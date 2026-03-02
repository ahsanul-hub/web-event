'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  profession: string;
};

const initialState: FormState = {
  fullName: '',
  email: '',
  phone: '',
  institution: '',
  profession: 'Dokter Spesialis Patologi Klinik'
};

export default function RegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Gagal mendaftar');
      setLoading(false);
      return;
    }

    router.push(`/payment/${data.registrationCode}`);
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Form Pendaftaran</h2>
      <p>Silakan isi data peserta untuk Simposium Ilmiah dan Pelantikan Pengurus PDS PATKLIN Regional Borneo.</p>
      <div className="grid">
        <div>
          <label>Nama Lengkap</label>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label>Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label>No. HP</label>
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label>Instansi</label>
          <input required value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
        </div>
        <div>
          <label>Profesi</label>
          <select value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })}>
            <option>Dokter Spesialis Patologi Klinik</option>
            <option>Dokter Umum</option>
            <option>Analis Laboratorium</option>
            <option>Mahasiswa</option>
            <option>Lainnya</option>
          </select>
        </div>
      </div>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <button disabled={loading}>{loading ? 'Memproses...' : 'Daftar Sekarang'}</button>
    </form>
  );
}
