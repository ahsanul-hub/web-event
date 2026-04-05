"use client";

import { useState, useEffect } from "react";

export default function LinkManager() {
  const [links, setLinks] = useState({
    whatsapp_link: "",
    online_meeting_link: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLinks();
  }, []);

  async function fetchLinks() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setLinks({
          whatsapp_link: data.whatsapp_link || "",
          online_meeting_link: data.online_meeting_link || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(links),
      });

      if (res.ok) {
        setSuccess("Tautan berhasil diperbarui!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.message || "Gagal memperbarui tautan");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
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
        Konfigurasi Link Grub & Meeting
      </h3>

      <form
        onSubmit={handleSave}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "15px",
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}>
        <div className="form-group">
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              display: "block",
              marginBottom: "5px",
            }}>
            WhatsApp Group Link
          </label>
          <input
            type="text"
            placeholder="https://chat.whatsapp.com/..."
            value={links.whatsapp_link}
            onChange={(e) =>
              setLinks({ ...links, whatsapp_link: e.target.value })
            }
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Link ini akan muncul di email sukses untuk semua peserta.
          </p>
        </div>

        <div className="form-group">
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              display: "block",
              marginBottom: "5px",
            }}>
            Online Meeting (Zoom/Meet) Link
          </label>
          <input
            type="text"
            placeholder="https://zoom.us/j/..."
            value={links.online_meeting_link}
            onChange={(e) =>
              setLinks({ ...links, online_meeting_link: e.target.value })
            }
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            Link ini hanya akan muncul di email untuk peserta yang memilih
            "Online".
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "15px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
            gap: "10px",
            flexWrap: "wrap",
          }}>
          <SendMeetingLinkButton />

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#15803d",
              color: "white",
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}>
            {loading ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>

        {success && (
          <p
            style={{
              color: "#15803d",
              fontSize: "13px",
              textAlign: "center",
              margin: 0,
            }}>
            ✅ {success}
          </p>
        )}
        {error && (
          <p
            style={{
              color: "#ef4444",
              fontSize: "13px",
              textAlign: "center",
              margin: 0,
            }}>
            ⚠️ {error}
          </p>
        )}

        <TestMeetingLinkButton />
      </form>
    </div>
  );
}

// Sub-component for sending a test email to a single recipient
function TestMeetingLinkButton() {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSend() {
    if (!testEmail) {
      alert("Masukkan alamat email untuk pengetesan.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/send-meeting-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      setMessage(
        data.message || (res.ok ? "Berhasil dikirim" : "Gagal dikirim"),
      );
      if (res.ok) setTestEmail("");
    } catch (e) {
      console.error(e);
      setMessage("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 5000);
    }
  }

  return (
    <div
      style={{
        marginTop: "15px",
        paddingTop: "20px",
        borderTop: "1px dashed #cbd5e1",
      }}>
      <label
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          display: "block",
          marginBottom: "8px",
          color: "#475569",
        }}>
        🧪 Test Kirim Email Link Meeting (Satu Email)
      </label>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="email"
          placeholder="Masukkan email untuk test..."
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            flex: 1,
            fontSize: "13px",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          style={{
            background: "#64748b",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "13px",
            whiteSpace: "nowrap",
          }}>
          {loading ? "Mengirim..." : "Kirim Email Test"}
        </button>
      </div>
      {message && (
        <p
          style={{
            fontSize: "12px",
            color:
              message.includes("Gagal") || message.includes("kesalahan")
                ? "#ef4444"
                : "#10b981",
            marginTop: "8px",
            fontWeight: "600",
          }}>
          {message}
        </p>
      )}
    </div>
  );
}

// Advanced distribution component with progress tracking
function SendMeetingLinkButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "fetching" | "sending" | "done" | "cancelled"
  >("idle");
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 });
  const [failedList, setFailedList] = useState<
    { name: string; email: string }[]
  >([]);
  const [isCancelled, setIsCancelled] = useState(false);

  async function startDistribution() {
    if (
      !confirm(
        "Kirim email link meeting ke seluruh peserta online secara bertahap?",
      )
    )
      return;

    setIsProcessing(true);
    setIsCancelled(false);
    setStatus("fetching");
    setFailedList([]);
    setStats({ total: 0, sent: 0, failed: 0 });
    setProgress(0);

    try {
      // 1. Fetch the list of recipients
      const res = await fetch("/api/admin/send-meeting-links");
      if (!res.ok) throw new Error("Gagal mengambil data peserta");

      const recipients = (await res.json()) as {
        id: number;
        full_name: string;
        email: string;
      }[];

      if (recipients.length === 0) {
        alert("Tidak ada peserta online yang berstatus 'paid'.");
        setIsProcessing(false);
        setStatus("idle");
        return;
      }

      setStats({ total: recipients.length, sent: 0, failed: 0 });
      setStatus("sending");

      // 2. Loop through recipients and send one by one
      for (let i = 0; i < recipients.length; i++) {
        // Check if user cancelled
        if (window.distributeCancelled) {
          setStatus("cancelled");
          break;
        }

        const person = recipients[i];

        try {
          const sendRes = await fetch("/api/admin/send-meeting-links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registrationId: person.id }),
          });

          if (sendRes.ok) {
            setStats((prev) => ({ ...prev, sent: prev.sent + 1 }));
          } else {
            throw new Error();
          }
        } catch (e) {
          setStats((prev) => ({ ...prev, failed: prev.failed + 1 }));
          setFailedList((prev) => [
            ...prev,
            { name: person.full_name, email: person.email },
          ]);
        }

        // Update progress percentage
        const currentProgress = Math.round(((i + 1) / recipients.length) * 100);
        setProgress(currentProgress);

        // Add a small delay between requests (e.g., 200ms) to stay under rate limits
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (!window.distributeCancelled) {
        setStatus("done");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
      setStatus("idle");
    } finally {
      setIsProcessing(false);
      window.distributeCancelled = false;
    }
  }

  function handleCancel() {
    if (confirm("Batalkan pengiriman yang sedang berjalan?")) {
      window.distributeCancelled = true;
    }
  }

  return (
    <div style={{ width: "100%", marginTop: "10px" }}>
      {status === "idle" || status === "done" || status === "cancelled" ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}>
          <button
            type="button"
            onClick={startDistribution}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #1d4ed8, #1e3a8a)",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(29, 78, 216, 0.2)",
            }}>
            {status === "done"
              ? "Kirim Ulang ke Semua"
              : "Kirim Email Link Meeting Ke Semua Peserta Online"}
          </button>

          {status === "done" && (
            <span
              style={{
                fontSize: "14px",
                color: "#15803d",
                fontWeight: "bold",
              }}>
              ✅ Selesai! {stats.sent} terkirim, {stats.failed} gagal.
            </span>
          )}
          {status === "cancelled" && (
            <span
              style={{
                fontSize: "14px",
                color: "#64748b",
                fontWeight: "bold",
              }}>
              ⏹️ Pengiriman dibatalkan.
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "#f1f5f9",
            padding: "15px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              alignItems: "center",
            }}>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: "#1e293b",
              }}>
              {status === "fetching"
                ? "📢 Mengambil data peserta..."
                : `🚀 Mengirim email: ${progress}%`}
            </span>
            <button
              onClick={handleCancel}
              style={{
                fontSize: "11px",
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer",
              }}>
              Batalkan
            </button>
          </div>

          {/* Progress Bar Container */}
          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#cbd5e1",
              borderRadius: "5px",
              overflow: "hidden",
              marginBottom: "10px",
            }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#1d4ed8",
                transition: "width 0.3s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "20px", fontSize: "12px" }}>
            <span style={{ color: "#475569" }}>
              Total: <b>{stats.total}</b>
            </span>
            <span style={{ color: "#15803d" }}>
              Berhasil: <b>{stats.sent}</b>
            </span>
            <span style={{ color: "#ef4444" }}>
              Gagal: <b>{stats.failed}</b>
            </span>
          </div>
        </div>
      )}

      {/* Failed List Display */}
      {failedList.length > 0 && (
        <div
          style={{
            marginTop: "15px",
            background: "#fff5f5",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #feb2b2",
          }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              color: "#c53030",
              margin: "0 0 8px 0",
            }}>
            ⚠️ Daftar Gagal Pengiriman ({failedList.length}):
          </p>
          <div
            style={{ maxHeight: "150px", overflowY: "auto", fontSize: "12px" }}>
            {failedList.map((f, i) => (
              <div
                key={i}
                style={{ borderBottom: "1px solid #fed7d7", padding: "4px 0" }}>
                {f.name} ({f.email})
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: "11px",
              color: "#742a2a",
              marginTop: "8px",
              fontStyle: "italic",
            }}>
            * Anda bisa mencoba mengirim ulang secara manual lewat tabel atau
            reset proses dan kirim ulang semua.
          </p>
        </div>
      )}
    </div>
  );
}

// Global variable for cancel tracking
declare global {
  interface Window {
    distributeCancelled?: boolean;
  }
}
