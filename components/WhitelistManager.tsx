"use client";

import { useState, useEffect } from "react";

type WhitelistItem = {
  nik: string;
  description: string;
  created_at: string;
};

export default function WhitelistManager() {
  const [list, setList] = useState<WhitelistItem[]>([]);
  const [nik, setNik] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    try {
      const res = await fetch("/api/admin/whitelist");
      if (res.ok) {
        const data = await res.json();
        setList(data);
      }
    } catch (err) {
      console.error("Failed to fetch whitelist", err);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (nik.length !== 16) {
      setError("NIK harus 16 digit");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", nik, description }),
      });

      if (res.ok) {
        setNik("");
        setDescription("");
        fetchList();
      } else {
        const data = await res.json();
        setError(data.message || "Gagal menambah NIK");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(nikToRemove: string) {
    if (!confirm(`Hapus NIK ${nikToRemove} dari whitelist?`)) return;

    try {
      const res = await fetch("/api/admin/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", nik: nikToRemove }),
      });

      if (res.ok) {
        fetchList();
      }
    } catch (err) {
      console.error("Failed to remove NIK", err);
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
        Manajemen Whitelist NIK
      </h3>

      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}>
        <input
          type="text"
          placeholder="NIK (16 digit)"
          value={nik}
          onChange={(e) =>
            setNik(e.target.value.replace(/\D/g, "").slice(0, 16))
          }
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            flex: "1",
            minWidth: "160px",
          }}
        />
        <input
          type="text"
          placeholder="Keterangan (misal: Undangan VIP)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            flex: "2",
            minWidth: "200px",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#0f2a83",
            color: "white",
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "..." : "Tambah"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "15px" }}>
          ⚠️ {error}
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px",
          }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left" }}>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                NIK Whitelisted
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Keterangan
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Ditambahkan
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}>
                  Belum ada NIK yang di-whitelist
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.nik}>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      fontFamily: "monospace",
                    }}>
                    {item.nik}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    {item.description || "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    {new Date(item.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    <button
                      onClick={() => handleRemove(item.nik)}
                      style={{
                        color: "#ef4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
