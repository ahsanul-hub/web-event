// import { NextResponse } from 'next/server';
// import { z } from 'zod';
// import { createAdmin, getAdminByEmail } from '@/lib/registrations';
// import { hashPassword, setSessionCookie } from '@/lib/auth';

// const bodySchema = z.object({
//   name: z.string().min(3),
//   email: z.string().email(),
//   password: z.string().min(8)
// });

// export async function POST(req: Request) {
//   try {
//     const body = bodySchema.parse(await req.json());
//     const existing = await getAdminByEmail(body.email);
//     if (existing) {
//       return NextResponse.json({ message: 'Email admin sudah terdaftar.' }, { status: 400 });
//     }

//     const admin = await createAdmin(body.name, body.email, hashPassword(body.password));
//     await setSessionCookie(admin.id);

//     return NextResponse.json({ message: 'Admin berhasil dibuat.' });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ message: 'Gagal register admin.' }, { status: 400 });
//   }
// }
