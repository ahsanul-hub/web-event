import { pool } from "./db";
import type { Voucher } from "./types";

export async function getAllVouchers(): Promise<Voucher[]> {
  const result = await pool.query<Voucher>(
    "SELECT * FROM vouchers ORDER BY created_at DESC",
  );

  const vouchers = result.rows;

  // Fetch claimants for each voucher
  for (const voucher of vouchers) {
    const claimantsResult = await pool.query<{
      nik: string;
      full_name: string;
    }>(
      "SELECT nik, full_name FROM registrations WHERE voucher_code = $1 AND status != 'cancelled'",
      [voucher.code],
    );
    voucher.claimants = claimantsResult.rows;
  }

  return vouchers;
}

export async function getActiveVouchers(): Promise<
  Pick<Voucher, "code" | "description" | "discount_type" | "discount_value">[]
> {
  const result = await pool.query<
    Pick<Voucher, "code" | "description" | "discount_type" | "discount_value">
  >(
    `SELECT code, description, discount_type, discount_value
     FROM vouchers
     WHERE is_active = true
       AND current_claims < max_claims
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function getVoucherByCode(code: string): Promise<Voucher | null> {
  const result = await pool.query<Voucher>(
    "SELECT * FROM vouchers WHERE code = $1 LIMIT 1",
    [code.toUpperCase()],
  );
  return result.rows[0] ?? null;
}

export async function isVoucherValid(
  code: string,
): Promise<{ valid: boolean; voucher?: Voucher; reason?: string }> {
  const voucher = await getVoucherByCode(code);
  if (!voucher)
    return { valid: false, reason: "Kode voucher tidak ditemukan." };
  if (!voucher.is_active)
    return { valid: false, reason: "Voucher tidak aktif." };
  if (voucher.current_claims >= voucher.max_claims)
    return { valid: false, reason: "Voucher sudah habis digunakan." };
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date())
    return { valid: false, reason: "Voucher sudah kadaluarsa." };
  return { valid: true, voucher };
}

/** Atomic increment — call inside the same transaction as registration insert */
export async function claimVoucher(code: string): Promise<void> {
  await pool.query(
    `UPDATE vouchers SET current_claims = current_claims + 1 WHERE code = $1`,
    [code.toUpperCase()],
  );
}

export type CreateVoucherInput = {
  code: string;
  description?: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_claims: number;
  expires_at?: string | null;
};

export async function createVoucher(
  input: CreateVoucherInput,
): Promise<Voucher> {
  const result = await pool.query<Voucher>(
    `INSERT INTO vouchers (code, description, discount_type, discount_value, max_claims, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.code.toUpperCase(),
      input.description ?? "",
      input.discount_type,
      input.discount_value,
      input.max_claims,
      input.expires_at ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateVoucher(
  id: number,
  patch: Partial<
    Pick<Voucher, "is_active" | "max_claims" | "description" | "expires_at">
  >,
): Promise<Voucher | null> {
  const setParts: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.is_active !== undefined) {
    setParts.push(`is_active = $${idx++}`);
    values.push(patch.is_active);
  }
  if (patch.max_claims !== undefined) {
    setParts.push(`max_claims = $${idx++}`);
    values.push(patch.max_claims);
  }
  if (patch.description !== undefined) {
    setParts.push(`description = $${idx++}`);
    values.push(patch.description);
  }
  if (patch.expires_at !== undefined) {
    setParts.push(`expires_at = $${idx++}`);
    values.push(patch.expires_at);
  }

  if (setParts.length === 0) return null;

  values.push(id);
  const result = await pool.query<Voucher>(
    `UPDATE vouchers SET ${setParts.join(", ")} WHERE id = $${idx} RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}

export async function deleteVoucher(id: number): Promise<void> {
  await pool.query("DELETE FROM vouchers WHERE id = $1", [id]);
}

/** Calculate discounted amount from original */
export function applyDiscount(
  originalAmount: number,
  voucher: Pick<Voucher, "discount_type" | "discount_value">,
): number {
  if (voucher.discount_type === "percent") {
    const discount = Math.round(
      (originalAmount * voucher.discount_value) / 100,
    );
    return Math.max(0, originalAmount - discount);
  }
  return Math.max(0, originalAmount - voucher.discount_value);
}
