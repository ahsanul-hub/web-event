"use client";

import { useState, useEffect } from "react";
import type { Voucher } from "@/lib/types";

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [maxClaims, setMaxClaims] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchVouchers();
  }, []);

  async function fetchVouchers() {
    try {
      const res = await fetch("/api/admin/vouchers");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data);
      }
    } catch (err) {
      console.error("Failed to fetch vouchers", err);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description,
          discount_type: discountType,
          discount_value: discountValue,
          max_claims: maxClaims,
          expires_at: expiresAt || null,
        }),
      });

      if (res.ok) {
        setCode("");
        setDescription("");
        setDiscountValue(0);
        setMaxClaims(1);
        setExpiresAt("");
        fetchVouchers();
      } else {
        const data = await res.json();
        setError(data.message || "Gagal menambah voucher");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: number, currentStatus: boolean) {
    try {
      const res = await fetch(`/api/admin/vouchers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (res.ok) {
        fetchVouchers();
      }
    } catch (err) {
      console.error("Failed to toggle voucher", err);
    }
  }

  async function handleDelete(id: number, codeToDelete: string) {
    if (!confirm(`Hapus voucher ${codeToDelete}?`)) return;

    try {
      const res = await fetch(`/api/admin/vouchers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchVouchers();
      }
    } catch (err) {
      console.error("Failed to delete voucher", err);
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
        Manajemen Voucher Diskon
      </h3>

      <form
        onSubmit={handleAdd}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
          marginBottom: "20px",
          background: "#f8fafc",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
        }}>
        <div className="form-group">
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>
            Kode Voucher
          </label>
          <input
            type="text"
            placeholder="CONTOH: DISKON50"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>
            Deskripsi
          </label>
          <input
            type="text"
            placeholder="Diskon 50%"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>Tipe</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as any)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}>
            <option value="percent">Persentase (%)</option>
            <option value="fixed">Nominal (IDR)</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>
            Nilai Diskon
          </label>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
            required
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>
            Maks Claim
          </label>
          <input
            type="number"
            value={maxClaims}
            onChange={(e) => setMaxClaims(parseInt(e.target.value) || 0)}
            required
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: "12px", fontWeight: "bold" }}>
            Kadaluarsa (Opsional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              width: "100%",
            }}
          />
        </div>
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "10px",
          }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#0f2a83",
              color: "white",
              padding: "10px 24px",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}>
            {loading ? "Menyimpan..." : "Tambah Voucher"}
          </button>
        </div>
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
                Kode
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Diskon
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Terpakai
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Status
              </th>
              <th
                style={{ padding: "12px", borderBottom: "1px solid #e2e8f0" }}>
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                  }}>
                  Belum ada voucher
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id}>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      fontWeight: "bold",
                    }}>
                    {v.code}
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        fontWeight: "normal",
                      }}>
                      {v.description}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    {v.discount_type === "percent"
                      ? `${v.discount_value}%`
                      : `Rp ${v.discount_value.toLocaleString("id-ID")}`}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    <span
                      style={{
                        color:
                          v.current_claims >= v.max_claims
                            ? "#ef4444"
                            : "inherit",
                        fontWeight: "bold",
                      }}>
                      {v.current_claims} / {v.max_claims}
                    </span>
                    {v.claimants && v.claimants.length > 0 && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          marginTop: "4px",
                        }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            borderBottom: "1px solid #e2e8f0",
                            marginBottom: "2px",
                          }}>
                          Claimed by:
                        </div>
                        {v.claimants.map((c, idx) => (
                          <div key={idx}>
                            • {c.nik} ({c.full_name})
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    <button
                      onClick={() => handleToggleActive(v.id, v.is_active)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        background: v.is_active ? "#dcfce7" : "#fee2e2",
                        color: v.is_active ? "#15803d" : "#b91c1c",
                      }}>
                      {v.is_active ? "AKTIF" : "NON-AKTIF"}
                    </button>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>
                    <button
                      onClick={() => handleDelete(v.id, v.code)}
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
