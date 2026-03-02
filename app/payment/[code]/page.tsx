import { notFound } from 'next/navigation';
import PaymentActions from '@/components/PaymentActions';
import { getRegistrationByCode } from '@/lib/registrations';

export default async function PaymentPage({ params }: { params: { code: string } }) {
  const registration = await getRegistrationByCode(params.code);
  if (!registration) return notFound();

  return (
    <main>
      <section className="hero">
        <h1>Detail Pembayaran</h1>
        <p>Kode Registrasi: <b>{registration.registration_code}</b></p>
        <p>Peserta: {registration.full_name}</p>
      </section>

      <section className="card">
        <h2>Status: {registration.status === 'paid' ? 'Success' : 'Menunggu Pembayaran'}</h2>
        <p>Email: {registration.email}</p>
        <p>Silakan lanjutkan pembayaran lalu klik tombol konfirmasi.</p>
        <PaymentActions code={registration.registration_code} paymentLink={registration.payment_link} />
      </section>
    </main>
  );
}
