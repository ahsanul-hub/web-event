import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { upsertTransaction } from "@/lib/registrations";
import { sendRegistrationEmail } from "@/lib/email";
import { Registration } from "@/lib/types";

/**
 * Redpay Payment Gateway Webhook Handler
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
        : merchant_transaction_id;

    console.log(
      `Webhook: merchant_transaction_id=${merchant_transaction_id} → registrationCode=${registrationCode}`,
    );

    // Status 1000 = success per Redpay docs
    const isPaid = Number(status_code) === 1000;

    if (isPaid) {
      // 1. Mark registration as paid
      await pool.query(
        `UPDATE registrations SET status = 'paid', updated_at = NOW()
         WHERE registration_code = $1`,
        [registrationCode],
      );

      // 2. Fetch updated registration details for transaction and email
      const regResult = await pool.query<Registration>(
        `SELECT * FROM registrations WHERE registration_code = $1 LIMIT 1`,
        [registrationCode],
      );
      const reg = regResult.rows[0];

      if (reg) {
        // 3. Upsert transaction record as success
        await upsertTransaction({
          registration_id: reg.id,
          registration_code: registrationCode,
          payer_name: reg.full_name,
          payer_email: reg.email,
          amount: parseFloat(amount) || 0,
          payment_method: payment_method || "redpay",
          status: "success",
        });

        // 4. Send payment confirmation email
        try {
          await sendRegistrationEmail(reg);
          console.log(`📧 Confirmation email sent to: ${reg.email}`);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }

        console.log(
          `✅ Payment confirmed via webhook: ${registrationCode} (Ref: ${reference_id})`,
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
