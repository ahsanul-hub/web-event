import { NextResponse } from 'next/server';
import { z } from 'zod';
import { markAsPaid } from '@/lib/registrations';
import { sendRegistrationEmail } from '@/lib/email';

const bodySchema = z.object({
  code: z.string().min(5)
});

export async function POST(req: Request) {
  try {
    const { code } = bodySchema.parse(await req.json());
    const registration = await markAsPaid(code);

    if (!registration) {
      return NextResponse.json({ message: 'Data registrasi tidak ditemukan.' }, { status: 404 });
    }

    try {
      await sendRegistrationEmail(registration);
    } catch (emailError) {
      console.error('Email konfirmasi gagal dikirim:', emailError);
    }

    return NextResponse.json({ message: 'Pembayaran berhasil dikonfirmasi.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Permintaan tidak valid.' }, { status: 400 });
  }
}
