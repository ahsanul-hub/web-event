import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createRegistration,
  updatePaymentLink,
  upsertTransaction,
  isNIKWhitelisted,
} from "@/lib/registrations";
import { pool } from "@/lib/db";
import { sendRegistrationEmail } from "@/lib/email";
import { createRedpayOrder } from "@/lib/redpay";

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

    // Create initial registration record
    const registration = await createRegistration(validated);

    // 1. Check for NIK Whitelist
    const isWhitelisted = await isNIKWhitelisted(validated.nik);
    const amount = isWhitelisted
      ? 0
      : PRICING_MAP[validated.profession] || 250000;

    if (isWhitelisted) {
      // Direct Success for Whitelisted NIK
      await pool.query(
        "UPDATE registrations SET status = 'paid', updated_at = NOW() WHERE registration_code = $1",
        [registration.registration_code],
      );

      // Update local object for email
      registration.status = "paid";

      await upsertTransaction({
        registration_id: registration.id,
        registration_code: registration.registration_code,
        payer_name: registration.full_name,
        payer_email: registration.email,
        amount: 0,
        payment_method: "whitelist",
        status: "success",
      });

      console.log(
        `✨ Whitelisted NIK detected: ${validated.nik}. Registration ${registration.registration_code} marked as PAID.`,
      );
    } else {
      // standard Redpay flow
      try {
        // Create order via Redpay API immediately
        const paymentUrl = await createRedpayOrder(
          {
            id: registration.id,
            full_name: registration.full_name,
            phone: registration.phone,
            registration_code: registration.registration_code,
            category: registration.profession, // Map profession to category
            nik: registration.nik,
          },
          amount,
          validated.paymentMethod,
        );

        // Initialize transaction record as 'pending'
        await upsertTransaction({
          registration_id: registration.id,
          registration_code: registration.registration_code,
          payer_name: registration.full_name,
          payer_email: registration.email,
          amount: amount,
          payment_method: validated.paymentMethod,
          status: "pending",
        });

        // Update registration with the actual Redpay link
        await updatePaymentLink(registration.registration_code, paymentUrl);

        // Update registration object for email
        registration.payment_link = paymentUrl;
      } catch (redpayError) {
        console.error("Gagal membuat order Redpay otomatis:", redpayError);
        // We still proceed even if Redpay fails, user can generate link manually later in detail page
      }
    }

    try {
      await sendRegistrationEmail(registration);
    } catch (emailError) {
      console.error("Email gagal dikirim:", emailError);
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
