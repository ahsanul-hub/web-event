import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminByEmail } from '@/lib/registrations';
import { setSessionCookie, verifyPassword } from '@/lib/auth';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    const admin = await getAdminByEmail(body.email);
    if (!admin || !verifyPassword(body.password, admin.password_hash)) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 });
    }

    await setSessionCookie(admin.id);
    return NextResponse.json({ message: 'Login berhasil.' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Gagal login admin.' }, { status: 400 });
  }
}
