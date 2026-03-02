import RegistrationForm from '@/components/RegistrationForm';

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <h1 style={{ margin: 0 }}>Simposium Ilmiah dan Pelantikan Pengurus PDS PATKLIN Regional Borneo</h1>
        <h2 style={{ marginTop: 8 }}>Masa Bakti 2025-2028</h2>
        <p>Clinical Laboratory Perspectives in Hematology and Endocrine Disease</p>
        <p><b>Sabtu, 11 April 2026</b> · Platinum Hotel & Convention Center Balikpapan</p>
      </section>

      <RegistrationForm />

      <section className="card">
        <h3>Alur Pendaftaran</h3>
        <ol>
          <li>Isi formulir pendaftaran.</li>
          <li>Anda akan diarahkan ke halaman detail pembayaran.</li>
          <li>Lakukan pembayaran melalui tautan yang tersedia.</li>
          <li>Setelah status sukses, sistem menampilkan notifikasi cek kode registrasi di email.</li>
        </ol>
      </section>
    </main>
  );
}
