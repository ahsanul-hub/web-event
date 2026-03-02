# Web Event Pendaftaran - PDS PATKLIN Regional Borneo

Project Next.js untuk:
- Form pendaftaran peserta.
- Halaman detail pembayaran + link pembayaran.
- Konfirmasi status success.
- Notifikasi untuk cek kode registrasi di email.
- Panel admin dengan login/register.
- Data transaksi dan export CSV/Excel.
- Database PostgreSQL sederhana.

## Setup

1. Install dependency:
   ```bash
   npm install
   ```
2. Copy env:
   ```bash
   cp .env.example .env.local
   ```
3. Siapkan database PostgreSQL dan jalankan schema:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
4. Jalankan app:
   ```bash
   npm run dev
   ```

## Halaman

- `/` : landing + form pendaftaran
- `/payment/[code]` : detail pembayaran
- `/success` : status pembayaran berhasil
- `/admin/login` : login admin
- `/admin/register` : register admin
- `/admin` : dashboard admin (registrasi + transaksi + export)

## Fitur Admin

- Login dan register admin dengan session cookie.
- Melihat data peserta.
- Resend email ke peserta.
- Melihat data transaksi pembayaran.
- Export transaksi:
  - CSV: `/api/admin/transactions/export/csv`
  - Excel: `/api/admin/transactions/export/xlsx`

## Catatan

- Email dikirim menggunakan SMTP (`nodemailer`).
- Saat pendaftaran berhasil, email otomatis dikirim.
- Saat konfirmasi pembayaran sukses, sistem menyimpan data transaksi.
