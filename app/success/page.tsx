export default function SuccessPage({ searchParams }: { searchParams: { code?: string } }) {
  return (
    <main>
      <section className="hero">
        <h1>Status Pembayaran: Success ✅</h1>
        <p>Terima kasih, pembayaran Anda sudah berhasil dikonfirmasi.</p>
      </section>
      <section className="card">
        <h2>Notifikasi</h2>
        <p>Silakan cek email Anda untuk melihat kode registrasi.</p>
        {searchParams.code ? <p><b>Kode Registrasi:</b> {searchParams.code}</p> : null}
      </section>
    </main>
  );
}
