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
  tourIkn?: boolean;
  additionalInfo?: string;
};

export async function createRegistration(input: Input): Promise<Registration> {
  const code = generateRegistrationCode();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  // Default payment link if Redpay integration is skipped or fails later
  const paymentLink = `${appUrl}/payment/${code}`;

  const result = await pool.query<Registration>(
    `INSERT INTO registrations
      (nama_ktp, full_name, nik, email, phone, institution, kota_asal, profession, tour_ikn, additional_info, registration_code, payment_link)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
      input.tourIkn ?? false,
      input.additionalInfo ?? "",
      code,
      paymentLink,
    ],
  );

  return result.rows[0];
}

export async function updatePaymentLink(
  code: string,
  newPaymentLink: string,
): Promise<void> {
  await pool.query(
    `UPDATE registrations SET payment_link = $1 WHERE registration_code = $2`,
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
    "SELECT * FROM registrations ORDER BY created_at DESC",
  );
  return result.rows;
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

    await client.query(
      `INSERT INTO transactions (registration_id, registration_code, payer_name, payer_email, amount, payment_method, status)
       VALUES ($1,$2,$3,$4,$5,$6,'success')
       ON CONFLICT (registration_id)
       DO UPDATE SET status = EXCLUDED.status, paid_at = NOW()`,
      [
        registration.id,
        registration.registration_code,
        registration.full_name,
        registration.email,
        0,
        "manual_transfer",
      ],
    );

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
    "SELECT * FROM transactions ORDER BY paid_at DESC, id DESC",
  );
  return result.rows;
}
