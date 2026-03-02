import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRegistration } from '@/lib/registrations';
import { sendRegistrationEmail } from '@/lib/email';

const bodySchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  institution: z.string().min(2),
  profession: z.string().min(2)
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const registration = await createRegistration(body);

    try {
      await sendRegistrationEmail(registration);
    } catch (emailError) {
      console.error('Email gagal dikirim:', emailError);
    }

    return NextResponse.json({
      message: 'Pendaftaran berhasil',
      registrationCode: registration.registration_code
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Data tidak valid atau email sudah terdaftar.' }, { status: 400 });
  }
}
