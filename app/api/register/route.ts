import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createRegistration,
  updatePaymentLink,
  upsertTransaction,
  isNIKWhitelisted,
  getRegistrationByNIK,
} from "@/lib/registrations";
import { pool } from "@/lib/db";
import { sendRegistrationEmail } from "@/lib/email";
import { createRedpayOrder } from "@/lib/redpay";
import { isVoucherValid, applyDiscount, claimVoucher } from "@/lib/vouchers";

const bodySchema = z.object({
  namaKtp: z.string().min(3),
  fullName: z.string().min(3),
  nik: z.string().min(16).max(16),
  email: z.string().email(),
  phone: z.string().min(8),
  institution: z.string().min(2),
  kotaAsal: z.string().min(2),
  profession: z.string().min(2),
  attendanceType: z.string().min(2),
  paymentMethod: z.string().min(2),
  tourIkn: z.boolean().optional(),
  additionalInfo: z.string().optional(),
  voucherCode: z.string().nullable().optional(),
});

const PRICING_MAP: Record<string, number> = {
  "Dokter Spesialis Patologi Klinik": 500000,
  "Dokter Spesialis Lainnya": 400000,
  "Dokter Umum": 300000,
  ATLM: 250000,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = bodySchema.parse(body);

    if (validated.attendanceType === "offline") {
      return NextResponse.json(
        { message: "Pendaftaran Offline sudah ditutup. Silahkan pilih tipe Daring (Online)." },
        { status: 400 },
      );
    }

    // Check NIK uniqueness before creating anything
    const existingByNIK = await getRegistrationByNIK(validated.nik);
    if (existingByNIK) {
      // Mask the email: show first 2 chars + domain only, e.g. jo***@gmail.com
      const [localPart, domain] = existingByNIK.email.split("@");
      const masked =
        localPart.slice(0, 2).padEnd(localPart.length, "*") + "@" + domain;
      return NextResponse.json(
        {
          errorCode: "NIK_EXISTS",
          message: `NIK ini sudah terdaftar.`,
          maskedEmail: masked,
          registrationCode: existingByNIK.registration_code,
        },
        { status: 409 },
      );
    }

    // Process Voucher if present
    let appliedVoucher = null;
    if (validated.voucherCode) {
      const { valid, voucher, reason } = await isVoucherValid(
        validated.voucherCode,
      );
      if (!valid) {
        return NextResponse.json({ message: reason }, { status: 400 });
      }
      appliedVoucher = voucher;
    }

    // Create initial registration record
    const registration = await createRegistration({
      ...validated,
      voucherCode: appliedVoucher?.code || null,
    });

    // 1. Check for NIK Whitelist
    const isWhitelisted = await isNIKWhitelisted(validated.nik);
    let amount = isWhitelisted
      ? 0
      : validated.attendanceType === "online"
        ? 50000
        : PRICING_MAP[validated.profession] || 250000;

    // Apply voucher discount if applicable and not whitelisted
    if (appliedVoucher && amount > 0) {
      amount = applyDiscount(amount, appliedVoucher);
      await claimVoucher(appliedVoucher.code);
    }

    if (isWhitelisted || amount === 0) {
      // Direct Success for Whitelisted NIK or 100% discount
      await pool.query(
        "UPDATE registrations SET status = 'paid', updated_at = NOW() WHERE registration_code = $1",
        [registration.registration_code],
      );

      // Update local object for email
      registration.status = "paid";

      const transactionData = {
        registration_id: registration.id,
        registration_code: registration.registration_code,
        payer_name: registration.full_name,
        payer_email: registration.email,
        amount: "0",
        payment_method: isWhitelisted ? "whitelist" : "voucher",
        status: "success" as const,
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        id: 0,
      };

      await upsertTransaction(transactionData);

      console.log(
        `✨ ${isWhitelisted ? "Whitelisted NIK" : "100% Voucher"} detected. Registration ${registration.registration_code} marked as PAID.`,
      );

      // Must wait for email so serverless doesn't terminate context
      try {
        await sendRegistrationEmail(registration, transactionData);
      } catch (emailError) {
        console.error("Email gagal dikirim:", emailError);
      }
    } else {
      // standard Redpay flow (Pending)
      // We can run Redpay creation and Email sending in parallel!
      const redpayTask = async () => {
        const paymentUrl = await createRedpayOrder(
          {
            id: registration.id,
            full_name: registration.full_name,
            phone: registration.phone,
            registration_code: registration.registration_code,
            category: registration.profession,
            nik: registration.nik,
          },
          amount,
          validated.paymentMethod,
        );

        await upsertTransaction({
          registration_id: registration.id,
          registration_code: registration.registration_code,
          payer_name: registration.full_name,
          payer_email: registration.email,
          amount: amount,
          payment_method: validated.paymentMethod,
          status: "pending",
        });

        await updatePaymentLink(registration.registration_code, paymentUrl);
        registration.payment_link = paymentUrl;
      };

      const emailTask = sendRegistrationEmail(registration);

      // Await both tasks concurrently. This ensures both finish before the API responds.
      const [redpayResult, emailResult] = await Promise.allSettled([
        redpayTask(),
        emailTask,
      ]);

      if (redpayResult.status === "rejected") {
        console.error(
          "Gagal membuat order Redpay otomatis:",
          redpayResult.reason,
        );
      }
      if (emailResult.status === "rejected") {
        console.error("Email gagal dikirim:", emailResult.reason);
      }
    }

    return NextResponse.json({
      message: "Pendaftaran berhasil",
      registrationCode: registration.registration_code,
    });
  } catch (error: any) {
    console.error("REGISTRATION ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message:
            "Data tidak valid: " +
            error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        message: `Terjadi kesalahan sistem: ${error.message || "Unknown error"}. Jika email sudah terdaftar, gunakan menu cari pendaftaran.`,
        debug: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 400 },
    );
  }
}
