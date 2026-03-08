"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message ?? "Login gagal");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main>
      <section className="hero">
        <h1>Login Admin</h1>
        <p>Masuk untuk melihat data transaksi dan mengelola email peserta.</p>
      </section>
      <form className="card" onSubmit={onSubmit}>
        <label>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label style={{ marginTop: 12 }}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
          {/* <a href="/admin/register"><button type="button" className="secondary">Register Admin</button></a> */}
        </div>
        {message ? <p style={{ color: "#b91c1c" }}>{message}</p> : null}
      </form>
    </main>
  );
}
