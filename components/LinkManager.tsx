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
            justifyContent: "flex-end",
            marginTop: "5px",
          }}>
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
      </form>
    </div>
  );
}
