import { redirect } from 'next/navigation';
import { getLoggedInAdminId } from '@/lib/auth';
import { getAllRegistrations, getTransactions } from '@/lib/registrations';
import AdminResendButton from '@/components/AdminResendButton';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default async function AdminPage() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    redirect('/admin/login');
  }

  const registrations = await getAllRegistrations();
  const transactions = await getTransactions();

  return (
    <main>
      <section className="hero">
        <h1>Admin Registrasi & Transaksi</h1>
        <p>Daftar peserta, data transaksi, resend email, dan export laporan.</p>
        <AdminLogoutButton />
      </section>

      <section className="card">
        <h2>Export Data Transaksi</h2>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/api/admin/transactions/export/csv"><button type="button" className="secondary">Export CSV</button></a>
          <a href="/api/admin/transactions/export/xlsx"><button type="button">Export Excel (.xlsx)</button></a>
        </div>
      </section>

      <section className="card">
        <h2>Data Transaksi ({transactions.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Kode</th><th>Nama</th><th>Email</th><th>Metode</th><th>Status</th><th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{tx.registration_code}</td>
                  <td>{tx.payer_name}</td>
                  <td>{tx.payer_email}</td>
                  <td>{tx.payment_method}</td>
                  <td>{tx.status}</td>
                  <td>{new Date(tx.paid_at).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 ? <p>Belum ada transaksi.</p> : null}
      </section>

      <section className="card">
        <h2>Data Peserta ({registrations.length})</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {registrations.map((item) => (
            <article key={item.id} style={{ border: '1px solid #dbeafe', borderRadius: 12, padding: 12 }}>
              <p><b>{item.full_name}</b> — {item.email}</p>
              <p>Kode: {item.registration_code}</p>
              <p>Status: {item.status === 'paid' ? 'Success' : 'Pending Payment'}</p>
              <AdminResendButton code={item.registration_code} />
            </article>
          ))}
          {registrations.length === 0 ? <p>Belum ada pendaftaran.</p> : null}
        </div>
      </section>
    </main>
  );
}
