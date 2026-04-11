"use client";

import { useState } from "react";

export default function ReminderManager() {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [offset, setOffset] = useState("0");
  const [limit, setLimit] = useState("");

  const [progress, setProgress] = useState({
    total: 0,
    current: 0,
    sent: 0,
    failed: 0,
  });
  const [failedList, setFailedList] = useState<{ id: number; email: string }[]>(
    [],
  );

  async function handleSend(isBatch: boolean, idsToRetry?: number[]) {
    if (!isBatch && !testEmail && !idsToRetry) {
      alert("Masukkan email uji coba terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    // Only reset failedList if it's NOT a retry
    if (!idsToRetry) setFailedList([]);

    setProgress({ total: 0, current: 0, sent: 0, failed: 0 });

    try {
      if (!isBatch && !idsToRetry) {
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

      // BATCH SEND (Normal or Retry)
      if (
        !idsToRetry &&
        !confirm("Kirim email reminder ke peserta yang dipilih?")
      ) {
        setLoading(false);
        return;
      }

      let allIds = idsToRetry || [];

      if (!idsToRetry) {
        let url = "/api/admin/registrations?status=paid";
        if (offset && offset !== "0") url += `&offset=${offset}`;
        if (limit) url += `&limit=${limit}`;

        const resList = await fetch(url);
        const allPaid = await resList.json();
        allIds = allPaid.map((p: any) => p.id);
      }

      if (allIds.length === 0) {
        setMessage("Tidak ada peserta ditemukan pada rentang ini.");
        setLoading(false);
        return;
      }

      const chunkSize = 5; 
      const total = allIds.length;
      let totalSent = 0;
      let totalFailed = 0;
      const collectedFailed: { id: number; email: string }[] = [];

      setProgress({ total, current: 0, sent: 0, failed: 0 });

      for (let i = 0; i < allIds.length; i += chunkSize) {
        const chunk = allIds.slice(i, i + chunkSize);

        setProgress((prev) => ({ ...prev, current: i }));

        try {
          const res = await fetch("/api/admin/send-reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedIds: chunk }),
          });

          const data = await res.json();
          totalSent += data.sentCount || 0;
          totalFailed += data.failedCount || 0;

          if (data.failedEmails && data.failedIds) {
            data.failedEmails.forEach((email: string, idx: number) => {
              collectedFailed.push({ id: data.failedIds[idx], email });
            });
          }

          setProgress((prev) => ({
            ...prev,
            current: Math.min(i + chunkSize, total),
            sent: totalSent,
            failed: totalFailed,
          }));

          setFailedList([...collectedFailed]);

          if (i + chunkSize < allIds.length) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        } catch (chunkErr) {
          totalFailed += chunk.length;
        }
      }

      setMessage(
        `${idsToRetry ? "(Retry) " : ""}Selesai! Berhasil mengirim ${totalSent} email. ${totalFailed > 0 ? `(Gagal: ${totalFailed})` : ""}`,
      );
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
        Konfigurasi Email Reminder
      </h3>

      <div
        style={{
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}>
        {/* Test Send Section */}
        <div
          style={{
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: "1px solid #e2e8f0",
          }}>
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

        {/* Batch Filter Section */}
        <div
          style={{
            marginBottom: "20px",
            paddingBottom: "20px",
            borderBottom: "1px solid #e2e8f0",
          }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              display: "block",
              marginBottom: "10px",
            }}>
            Filter Batch Pengiriman
          </label>
          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Mulai dari (Skip/Offset)
              </span>
              <input
                type="number"
                placeholder="0"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                Jumlah Data (Limit)
              </span>
              <input
                type="number"
                placeholder="Kosongkan untuk semua"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              />
            </div>
          </div>
          <p
            style={{ fontSize: "11px", color: "#94a3b8", marginTop: "10px" }}>
            *Gunakan filter ini untuk mengirim ke data yang berada di tengah
            atau melanjutkan pengiriman yang terputus.
          </p>
        </div>

        {/* Progress Bar (Visible during batch) */}
        {loading && progress.total > 0 && (
          <div
            style={{
              marginBottom: "20px",
              background: "#fff",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #1e3a8a33",
            }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "12px",
                fontWeight: "bold",
              }}>
              <span>Progress Pengiriman...</span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#e2e8f0",
                borderRadius: "10px",
                overflow: "hidden",
              }}>
              <div
                style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  height: "100%",
                  background: "#0f2a83",
                  transition: "width 0.3s ease",
                }}></div>
            </div>
            <p style={{ fontSize: "11px", marginTop: "8px", color: "#64748b" }}>
              Berhasil:{" "}
              <span style={{ color: "#10b981", fontWeight: "bold" }}>
                {progress.sent}
              </span>{" "}
              • Gagal:{" "}
              <span style={{ color: "#ef4444", fontWeight: "bold" }}>
                {progress.failed}
              </span>
            </p>
          </div>
        )}

        {/* Failed Emails List with Retry Button */}
        {!loading && failedList.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              background: "#fef2f2",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ef444433",
            }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#ef4444",
                  margin: 0,
                }}>
                ⚠️ Daftar Email yang Gagal Terkirim:
              </p>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    true,
                    failedList.map((f) => f.id),
                  )
                }
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}>
                Coba Lagi Sekarang
              </button>
            </div>
            <div
              style={{
                maxHeight: "100px",
                overflowY: "auto",
                fontSize: "12px",
                color: "#991b1b",
              }}>
              <ul style={{ margin: 0, paddingLeft: "15px" }}>
                {failedList.map((item, idx) => (
                  <li key={idx}>{item.email}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Batch Send Section */}
        <div>
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
