import { NextResponse } from "next/server";
import { z } from "zod";
import { createRegistration, updatePaymentLink } from "@/lib/registrations";
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
  paymentMethod: z.string().min(2),
  tourIkn: z.boolean().optional(),
  additionalInfo: z.string().optional(),
});

const PRICING_MAP: Record<string, number> = {
  "Dokter Spesialis Patologi Klinik": 500000,
  "Dokter Spesialis Lainnya": 400000,
  "Dokter Umum": 300000,
  "PPDS Patologi Klinik": 250000,
  "Analis Laboratorium": 250000,
  Perawat: 250000,
  Mahasiswa: 200000,
  Lainnya: 250000,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = bodySchema.parse(body);

    // Create initial registration record
    const registration = await createRegistration(validated);

    const amount = PRICING_MAP[validated.profession] || 250000;

    try {
      // Create order via Redpay API immediately
      const paymentUrl = await createRedpayOrder(
        registration,
        amount,
        validated.paymentMethod,
      );

      // Update registration with the actual Redpay link
      await updatePaymentLink(registration.registration_code, paymentUrl);

      // Update registration object for email
      registration.payment_link = paymentUrl;
    } catch (redpayError) {
      console.error("Gagal membuat order Redpay otomatis:", redpayError);
      // We still proceed even if Redpay fails, user can generate link manually later in detail page
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
  } catch (error) {
    console.error(error);
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
      { message: "Terjadi kesalahan sistem atau email sudah terdaftar." },
      { status: 400 },
    );
  }
}
