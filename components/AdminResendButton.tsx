'use client';

import { useState } from 'react';

export default function AdminResendButton({ code }: { code: string }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setMessage('');

    const res = await fetch('/api/admin/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await res.json();
    setMessage(data.message ?? 'Selesai');
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button type="button" onClick={resend} disabled={loading}>
        {loading ? 'Mengirim...' : 'Resend Email'}
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
