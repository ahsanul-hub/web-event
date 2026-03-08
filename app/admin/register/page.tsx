// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AdminRegisterPage() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   async function onSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);
//     setMessage('');

//     const res = await fetch('/api/admin/register', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ name, email, password })
//     });
//     const data = await res.json();

//     if (!res.ok) {
//       setMessage(data.message ?? 'Register admin gagal');
//       setLoading(false);
//       return;
//     }

//     router.push('/admin');
//     router.refresh();
//   }

//   return (
//     <main>
//       <section className="hero">
//         <h1>Register Admin</h1>
//         <p>Buat akun admin terlebih dahulu.</p>
//       </section>
//       <form className="card" onSubmit={onSubmit}>
//         <label>Nama</label>
//         <input required value={name} onChange={(e) => setName(e.target.value)} />
//         <label style={{ marginTop: 12 }}>Email</label>
//         <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
//         <label style={{ marginTop: 12 }}>Password</label>
//         <input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
//         <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
//           <button disabled={loading}>{loading ? 'Memproses...' : 'Register'}</button>
//           <a href="/admin/login"><button type="button" className="secondary">Ke Login</button></a>
//         </div>
//         {message ? <p style={{ color: '#b91c1c' }}>{message}</p> : null}
//       </form>
//     </main>
//   );
// }
