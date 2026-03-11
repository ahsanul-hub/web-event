import { pool } from "./db";
import { generateRegistrationCode } from "./utils";
import type { AdminUser, Registration, Transaction } from "./types";

type Input = {
  namaKtp: string;
  fullName: string;
  nik: string;
  institution: string;
  kotaAsal: string;
  email: string;
  phone: string;
  profession: string;
  attendanceType: string;
  tourIkn?: boolean;
  additionalInfo?: string;
  voucherCode?: string | null;
};

export async function createRegistration(input: Input): Promise<Registration> {
  const code = generateRegistrationCode();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // Default payment link if Redpay integration is skipped or fails later
  const paymentLink = `${appUrl}/payment/${code}`;

  const result = await pool.query<Registration>(
    `INSERT INTO registrations
      (nama_ktp, full_name, nik, email, phone, institution, kota_asal, profession, attendance_type, tour_ikn, additional_info, registration_code, payment_link, voucher_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      input.namaKtp,
      input.fullName,
      input.nik,
      input.email.toLowerCase(),
      input.phone,
      input.institution,
      input.kotaAsal,
      input.profession,
      input.attendanceType,
      input.tourIkn ?? false,
      input.additionalInfo ?? "",
      code,
      paymentLink,
      input.voucherCode || null,
    ],
  );

  return result.rows[0];
}

export async function updatePaymentLink(
  code: string,
  newPaymentLink: string,
): Promise<void> {
  await pool.query(
    `UPDATE registrations SET payment_link = $1, updated_at = NOW() WHERE registration_code = $2`,
    [newPaymentLink, code],
  );
}

export async function getRegistrationByCode(
  code: string,
): Promise<Registration | null> {
  const result = await pool.query<Registration>(
    "SELECT * FROM registrations WHERE registration_code = $1 LIMIT 1",
    [code],
  );
  return result.rows[0] ?? null;
}

export async function getAllRegistrations(): Promise<Registration[]> {
  const result = await pool.query<Registration>(
    "SELECT * FROM registrations WHERE status != 'cancelled' ORDER BY created_at DESC",
  );
  return result.rows;
}

export async function cancelRegistration(
  code: string,
): Promise<Registration | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Suffixing email and registration_code to avoid UNIQUE constraint collisions
    // and suffixing nik to allow re-registration with the same NIK.
    const result = await client.query<Registration>(
      `UPDATE registrations
       SET status = 'cancelled',
           email = email || '.cancelled.' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
           registration_code = registration_code || '.cancelled.' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
           nik = nik || '.cancelled.' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
           updated_at = NOW()
       WHERE registration_code = $1
       RETURNING *`,
      [code],
    );

    const registration = result.rows[0] ?? null;

    if (registration && registration.voucher_code) {
      await client.query(
        `UPDATE vouchers SET current_claims = GREATEST(0, current_claims - 1) WHERE code = $1`,
        [registration.voucher_code.toUpperCase()],
      );
    }

    await client.query("COMMIT");
    return registration;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function upsertTransaction(data: {
  registration_id: number;
  registration_code: string;
  payer_name: string;
  payer_email: string;
  amount: number;
  payment_method: string;
  status: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO transactions
       (registration_id, registration_code, payer_name, payer_email, amount, payment_method, status, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (registration_id)
     DO UPDATE SET
       registration_code = EXCLUDED.registration_code,
       payer_name = EXCLUDED.payer_name,
       payer_email = EXCLUDED.payer_email,
       amount = EXCLUDED.amount,
       payment_method = EXCLUDED.payment_method,
       status = EXCLUDED.status,
       paid_at = CASE WHEN EXCLUDED.status = 'success' THEN NOW() ELSE transactions.paid_at END`,
    [
      data.registration_id,
      data.registration_code,
      data.payer_name,
      data.payer_email,
      data.amount,
      data.payment_method,
      data.status,
    ],
  );
}

export async function markAsPaid(code: string): Promise<Registration | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateResult = await client.query<Registration>(
      `UPDATE registrations
       SET status = 'paid', updated_at = NOW()
       WHERE registration_code = $1
       RETURNING *`,
      [code],
    );

    const registration = updateResult.rows[0] ?? null;
    if (!registration) {
      await client.query("ROLLBACK");
      return null;
    }

    await upsertTransaction({
      registration_id: registration.id,
      registration_code: registration.registration_code,
      payer_name: registration.full_name,
      payer_email: registration.email,
      amount: 0, // Manual update usually doesn't track amount unless specified
      payment_method: "manual_transfer",
      status: "success",
    });

    await client.query("COMMIT");
    return registration;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createAdmin(
  name: string,
  email: string,
  passwordHash: string,
): Promise<AdminUser> {
  const result = await pool.query<AdminUser>(
    `INSERT INTO admins (name, email, password_hash)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [name, email.toLowerCase(), passwordHash],
  );
  return result.rows[0];
}

export async function getAdminByEmail(
  email: string,
): Promise<AdminUser | null> {
  const result = await pool.query<AdminUser>(
    "SELECT * FROM admins WHERE email = $1 LIMIT 1",
    [email.toLowerCase()],
  );
  return result.rows[0] ?? null;
}

export async function getTransactions(): Promise<Transaction[]> {
  const result = await pool.query<Transaction>(
    `SELECT t.* FROM transactions t
     JOIN registrations r ON t.registration_id = r.id
     WHERE r.status != 'cancelled'
     ORDER BY t.paid_at DESC, t.id DESC`,
  );
  return result.rows;
}

export async function updateAttendanceStatus(
  code: string,
  status: "pending" | "present" | "absent",
): Promise<Registration | null> {
  const result = await pool.query<Registration>(
    `UPDATE registrations
     SET attendance_status = $1, updated_at = NOW()
     WHERE registration_code = $2
     RETURNING *`,
    [status, code],
  );
  return result.rows[0] ?? null;
}

export async function getTransactionByCode(
  code: string,
): Promise<Transaction | null> {
  const result = await pool.query<Transaction>(
    "SELECT * FROM transactions WHERE registration_code = $1 LIMIT 1",
    [code],
  );
  return result.rows[0] ?? null;
}
export async function getRegistrationByNIK(
  nik: string,
): Promise<Pick<Registration, "registration_code" | "email"> | null> {
  const result = await pool.query<
    Pick<Registration, "registration_code" | "email">
  >(
    "SELECT registration_code, email FROM registrations WHERE nik = $1 AND status != 'cancelled' LIMIT 1",
    [nik],
  );
  return result.rows[0] ?? null;
}

export async function isNIKWhitelisted(nik: string): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM nik_whitelist WHERE nik = $1 LIMIT 1",
    [nik],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getNIKWhitelist(): Promise<
  { nik: string; description: string; created_at: string }[]
> {
  const result = await pool.query(
    "SELECT * FROM nik_whitelist ORDER BY created_at DESC",
  );
  return result.rows;
}

export async function addToWhitelist(
  nik: string,
  description: string,
): Promise<void> {
  await pool.query(
    "INSERT INTO nik_whitelist (nik, description) VALUES ($1, $2) ON CONFLICT (nik) DO UPDATE SET description = EXCLUDED.description",
    [nik, description],
  );
}

export async function removeFromWhitelist(nik: string): Promise<void> {
  await pool.query("DELETE FROM nik_whitelist WHERE nik = $1", [nik]);
}
