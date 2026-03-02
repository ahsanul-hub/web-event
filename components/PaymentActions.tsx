'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentActions({ code, paymentLink }: { code: string; paymentLink: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function confirmPayment() {
    setLoading(true);
    setError('');

    const res = await fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.message ?? 'Konfirmasi pembayaran gagal.');
      setLoading(false);
      return;
    }

    router.push(`/success?code=${encodeURIComponent(code)}`);
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <a href={paymentLink} target="_blank" rel="noreferrer">
        <button type="button" className="secondary">Buka Link Pembayaran</button>
      </a>
      <button type="button" onClick={confirmPayment} disabled={loading}>
        {loading ? 'Memproses...' : 'Saya Sudah Bayar'}
      </button>
      {error ? <p style={{ color: '#b91c1c', width: '100%' }}>{error}</p> : null}
    </div>
  );
}
