import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRegistrationByCode } from '@/lib/registrations';
import { sendRegistrationEmail } from '@/lib/email';
import { getLoggedInAdminId } from '@/lib/auth';

const bodySchema = z.object({
  code: z.string().min(5)
});

export async function POST(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code } = bodySchema.parse(await req.json());

    const registration = await getRegistrationByCode(code);
    if (!registration) {
      return NextResponse.json({ message: 'Registrasi tidak ditemukan.' }, { status: 404 });
    }

    await sendRegistrationEmail(registration);
    return NextResponse.json({ message: 'Email berhasil dikirim ulang.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal resend email.' }, { status: 400 });
  }
}
