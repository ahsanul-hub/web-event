import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

/**
 * Redpay Payment Gateway Webhook Handler
 *
 * Called by Redpay when a payment status changes.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("REDPAY WEBHOOK RECEIVED:", JSON.stringify(body, null, 2));

    const {
      merchant_transaction_id,
      status,
      status_code,
      amount,
      payment_method,
      reference_id,
    } = body;

    if (!merchant_transaction_id) {
      return NextResponse.json(
        { message: "merchant_transaction_id is required" },
        { status: 400 },
      );
    }

    // Renewal transaction IDs have a hex-timestamp suffix:
    // "PATKLIN-2026-ABC123-19ABC1F2" → base code is "PATKLIN-2026-ABC123"
    const parts = merchant_transaction_id.split("-");
    const registrationCode =
      parts.length > 3
        ? parts.slice(0, 3).join("-") // Strip the hex suffix
        : merchant_transaction_id; // Original first-time transaction ID

    console.log(
      `Webhook: merchant_transaction_id=${merchant_transaction_id} → registrationCode=${registrationCode}`,
    );

    // Status 1000 = success per Redpay docs
    const isPaid = status === "success" || Number(status_code) === 1000;

    if (isPaid) {
      // 1. Mark registration as paid
      await pool.query(
        `UPDATE registrations SET status = 'paid', updated_at = NOW()
         WHERE registration_code = $1`,
        [registrationCode],
      );

      // 2. Upsert transaction record
      const regResult = await pool.query(
        `SELECT id, full_name, email FROM registrations WHERE registration_code = $1 LIMIT 1`,
        [registrationCode],
      );
      const reg = regResult.rows[0];

      if (reg) {
        await pool.query(
          `INSERT INTO transactions
             (registration_id, registration_code, payer_name, payer_email, amount, payment_method, status)
           VALUES ($1,$2,$3,$4,$5,$6,'success')
           ON CONFLICT (registration_id)
           DO UPDATE SET
             status = 'success',
             amount = EXCLUDED.amount,
             payment_method = EXCLUDED.payment_method,
             paid_at = NOW()`,
          [
            reg.id,
            registrationCode,
            reg.full_name,
            reg.email,
            parseFloat(amount) || 0,
            payment_method || "redpay",
          ],
        );

        console.log(
          `✅ Payment confirmed via webhook: ${registrationCode} (Redpay ref: ${reference_id})`,
        );
      } else {
        console.warn(`⚠️ No registration found for code: ${registrationCode}`);
      }
    } else {
      console.log(
        `Webhook non-success status for ${registrationCode}: status=${status}, status_code=${status_code}`,
      );
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
