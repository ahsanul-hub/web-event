import nodemailer from 'nodemailer';
import type { Registration } from './types';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS harus diatur agar email dapat dikirim.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendRegistrationEmail(registration: Registration) {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM ?? 'noreply@patklin-borneo.id';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  await transporter.sendMail({
    from,
    to: registration.email,
    subject: 'Kode Registrasi Simposium PDS PATKLIN Regional Borneo',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6">
        <h2>Terima kasih sudah mendaftar</h2>
        <p>Halo <b>${registration.full_name}</b>,</p>
        <p>Registrasi Anda berhasil dibuat.</p>
        <p><b>Kode Registrasi:</b> ${registration.registration_code}</p>
        <p>Status pembayaran saat ini: <b>${registration.status === 'paid' ? 'Lunas' : 'Menunggu Pembayaran'}</b></p>
        <p>Silakan lanjutkan pembayaran melalui tautan berikut:</p>
        <p><a href="${registration.payment_link}">${registration.payment_link}</a></p>
        <p>Setelah status sukses, simpan kode registrasi ini dan cek email Anda kembali.</p>
        <hr/>
        <small>Lihat detail pendaftaran: ${appUrl}/payment/${registration.registration_code}</small>
      </div>
    `
  });
}
