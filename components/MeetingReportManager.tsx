"use client";

import { useState, useEffect } from "react";

export default function MeetingReportManager() {
  const [fileStatus, setFileStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchFileStatus();
  }, []);

  async function fetchFileStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/report-pdf");
      if (res.ok) {
        const data = await res.json();
        setFileStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Hanya file PDF yang diperbolehkan");
      return;
    }

    setUploading(true);
    setMessage("");
    setIsError(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/report-pdf", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessage("File berhasil diunggah!");
        fetchFileStatus();
      } else {
        const data = await res.json();
        setMessage(data.message || "Gagal mengunggah file");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Terjadi kesalahan sistem");
      setIsError(true);
    } finally {
      setUploading(false);
      // Clear input
      e.target.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm("Apakah Anda yakin ingin menghapus file PDF ini?")) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/report-pdf", {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("File berhasil dihapus");
        setIsError(false);
        setFileStatus({ exists: false });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !fileStatus) return <p>Memuat status file...</p>;

  return (
    <div style={{ marginTop: "30px" }}>
      <h3
        style={{
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "10px",
          marginBottom: "20px",
        }}>
        Konfigurasi lampiran PDF Email Meeting
      </h3>

      <div
        style={{
          background: "#f8fafc",
          padding: "20px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}>
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              display: "block",
              marginBottom: "10px",
            }}>
            File PDF Report (Lampiran Email Meeting)
          </label>

          {fileStatus?.exists ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                background: "#f1f5f9",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>📄</span>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      color: "#0f2a83",
                      fontSize: "14px",
                    }}>
                    {fileStatus.filename}
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                    Ukuran: {(fileStatus.size / 1024).toFixed(1)} KB • Diunggah:{" "}
                    {new Date(fileStatus.updatedAt).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDelete}
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
                Hapus
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "20px",
                border: "2px dashed #cbd5e1",
                borderRadius: "10px",
                textAlign: "center",
                background: "white",
              }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  margin: "0 0 10px",
                }}>
                Belum ada file yang diunggah.
              </p>
              <label
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  background: "#0f2a83",
                  color: "white",
                  borderRadius: "6px",
                  cursor: uploading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}>
                {uploading ? "Mengunggah..." : "Upload PDF Report"}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          )}
        </div>

        <p style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
          * Jika file sudah diunggah, ia akan otomatis menjadi lampiran saat
          Panitia mengirim email link meeting. Lakukan upload ulang untuk
          mengganti file yang sudah ada.
        </p>

        {message && (
          <p
            style={{
              color: isError ? "#ef4444" : "#15803d",
              fontSize: "13px",
              textAlign: "center",
              marginTop: "15px",
              fontWeight: "bold",
            }}>
            {isError ? "⚠️" : "✅"} {message}
          </p>
        )}
      </div>
    </div>
  );
}
