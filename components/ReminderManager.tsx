"use client";

import { useState } from "react";

export default function ReminderManager() {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [progress, setProgress] = useState({ total: 0, current: 0, sent: 0, failed: 0 });

  async function handleSend(isBatch: boolean) {
    if (!isBatch && !testEmail) {
      alert("Masukkan email uji coba terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);
    setProgress({ total: 0, current: 0, sent: 0, failed: 0 });

    try {
      if (!isBatch) {
        // TEST SEND
        const res = await fetch("/api/admin/send-reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testEmail }),
        });
        const data = await res.json();
        setMessage(data.message);
        if (!res.ok) setIsError(true);
        setLoading(false);
        return;
      }

      // BATCH SEND (with Chunking)
      if (!confirm("Kirim email reminder ke SELURUH peserta yang sudah membayar?")) {
        setLoading(false);
        return;
      }

      // 1. Get All Paid IDs
      // Note: We'll fetch them from a dedicated simple API or registration list
      const resList = await fetch("/api/admin/registrations?status=paid");
      const allPaid = await resList.json();
      const allIds = allPaid.map((p: any) => p.id);

      if (allIds.length === 0) {
        setMessage("Tidak ada peserta berstatus lunas found.");
        setLoading(false);
        return;
      }

      const chunkSize = 10;
      const total = allIds.length;
      let totalSent = 0;
      let totalFailed = 0;

      setProgress({ total, current: 0, sent: 0, failed: 0 });

      // 2. Loop through chunks
      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunk = allIds.slice(i, i + chunkSize);
        
        setProgress(prev => ({ ...prev, current: i }));

        try {
          const res = await fetch("/api/admin/send-reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedIds: chunk }),
          });
          
          const data = await res.json();
          totalSent += data.sentCount || 0;
          totalFailed += data.failedCount || 0;
          
          setProgress(prev => ({ 
            ...prev, 
            current: Math.min(i + chunkSize, total),
            sent: totalSent,
            failed: totalFailed 
          }));

          // Add a small delay between chunks to be safe
          if (i + chunkSize < allIds.length) {
            await new Promise(r => setTimeout(r, 1000));
          }
        } catch (chunkErr) {
          console.error("Batch error", chunkErr);
          totalFailed += chunk.length;
        }
      }

      setMessage(`Selesai! Berhasil mengirim ${totalSent} email. ${totalFailed > 0 ? `(Gagal: ${totalFailed})` : ""}`);

    } catch (err) {
      console.error(err);
      setMessage("Terjadi kesalahan sistem");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h3
        style={{
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}>
        Pengiriman Email Reminder (Paid Participants)
      </h3>

      <div
        style={{
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}>
        
        {/* Progress Bar (Visible during batch) */}
        {loading && progress.total > 0 && (
          <div style={{ marginBottom: "20px", background: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #1e3a8a33" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px", fontWeight: "bold" }}>
              <span>Progress Pengiriman...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ width: `${(progress.current / progress.total) * 100}%`, height: "100%", background: "#0f2a83", transition: "width 0.3s ease" }}></div>
            </div>
            <p style={{ fontSize: "11px", marginTop: "8px", color: "#64748b" }}>
              Berhasil: <span style={{ color: "#10b981", fontWeight: "bold" }}>{progress.sent}</span> • 
              Gagal: <span style={{ color: "#ef4444", fontWeight: "bold" }}>{progress.failed}</span>
            </p>
          </div>
        )}
        
        {/* Test Send Section */}
        <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              display: "block",
              marginBottom: "10px",
            }}>
            Uji Coba Kirim (Single Email)
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="email"
              placeholder="email@contoh.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
              }}
            />
            <button
              type="button"
              onClick={() => handleSend(false)}
              disabled={loading}
              style={{
                background: "#64748b",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "13px",
              }}>
              Test Kirim
            </button>
          </div>
        </div>

        {/* Batch Send Section */}
        <div>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              display: "block",
              marginBottom: "10px",
            }}>
            Kirim Massal (Semua Peserta Lunas)
          </label>
          <button
            type="button"
            onClick={() => handleSend(true)}
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #0f2a83, #1e3a8a)",
              color: "white",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              boxShadow: "0 4px 6px rgba(15,42,131,0.2)",
            }}>
            {loading ? "Sedang Memproses..." : "Kirim Email Reminder Sekarang"}
          </button>
        </div>

        {message && (
          <p
            style={{
              color: isError ? "#ef4444" : "#10b981",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "15px",
              fontWeight: "bold",
              background: isError ? "#fef2f2" : "#f0fdf4",
              padding: "10px",
              borderRadius: "6px",
            }}>
            {isError ? "⚠️" : "✅"} {message}
          </p>
        )}
      </div>
    </div>
  );
}
