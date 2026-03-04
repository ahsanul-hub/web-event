"use client";

import { useState, useMemo } from "react";
import type { Registration, Transaction } from "@/lib/types";

type Row = Registration & {
  tx_amount: string | null;
  tx_method: string | null;
  tx_paid_at: string | null;
};

const PAGE_SIZE = 15;

const statusBadge = (status: string) => {
  const isPaid = status === "paid";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
        background: isPaid ? "#dcfce7" : "#fef9c3",
        color: isPaid ? "#15803d" : "#92400e",
      }}>
      {isPaid ? "Lunas" : "Pending"}
    </span>
  );
};

export default function AdminTable({
  registrations,
  transactions,
}: {
  registrations: Registration[];
  transactions: Transaction[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "pending_payment"
  >("all");
  const [page, setPage] = useState(1);

  // Build a lookup: registration_code → transaction
  const txMap = useMemo(() => {
    const map: Record<string, Transaction> = {};
    for (const tx of transactions) {
      map[tx.registration_code] = tx;
    }
    return map;
  }, [transactions]);

  // Merge registrations with transaction data
  const rows: Row[] = useMemo(() => {
    return registrations.map((reg) => {
      const tx = txMap[reg.registration_code];
      return {
        ...reg,
        tx_amount: tx ? tx.amount : null,
        tx_method: tx ? tx.payment_method : null,
        tx_paid_at: tx ? tx.paid_at : null,
      };
    });
  }, [registrations, txMap]);

  // Filter by name, code, email and status
  const filtered = useMemo(() => {
    let result = rows;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    // Search query
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.registration_code?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.institution?.toLowerCase().includes(q) ||
          r.profession?.toLowerCase().includes(q) ||
          (r.tx_method && r.tx_method.toLowerCase().includes(q)) ||
          (r.tx_amount && String(r.tx_amount).includes(search)),
      );
    }

    return result;
  }, [rows, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const totalPaid = rows.filter((r) => r.status === "paid").length;
  const totalRevenue = transactions.reduce(
    (sum, tx) => sum + (parseFloat(tx.amount) || 0),
    0,
  );

  return (
    <div>
      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}>
        {[
          { label: "Total Peserta", value: rows.length },
          { label: "Sudah Bayar", value: totalPaid },
          { label: "Belum Bayar", value: rows.length - totalPaid },
          {
            label: "Total Pendapatan",
            value: new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(totalRevenue),
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "12px 20px",
              minWidth: 140,
              flex: 1,
            }}>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {stat.label}
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                margin: "4px 0 0",
                color: "#0f172a",
              }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 14,
          alignItems: "center",
        }}>
        <input
          type="text"
          placeholder="Cari nama, kode registrasi, atau email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as any);
            setPage(1);
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
            background: "#fff",
            outline: "none",
            cursor: "pointer",
            width: "180px",
          }}>
          <option value="all">Semua Status</option>
          <option value="paid">Lunas</option>
          <option value="pending_payment">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid #e2e8f0",
        }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              {[
                "#",
                "Kode Registrasi",
                "Nama",
                "Email",
                "Profesi",
                "Kehadiran",
                "Status Kehadiran",
                "Metode",
                "Jumlah",
                "Status Bayar",
                "Tgl. Bayar",
                "Aksi",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#475569",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid #e2e8f0",
                    ...(h === "Status" ? { minWidth: 130 } : {}),
                  }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  style={{
                    textAlign: "center",
                    padding: "24px",
                    color: "#94a3b8",
                  }}>
                  Tidak ada data ditemukan.
                </td>
              </tr>
            )}
            {paginated.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                }}>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "#94a3b8",
                    fontWeight: 500,
                  }}>
                  {(currentPage - 1) * PAGE_SIZE + idx + 1}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    fontFamily: "monospace",
                    whiteSpace: "nowrap",
                  }}>
                  <a
                    href={`/payment/${row.registration_code}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#1d4ed8",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}>
                    {row.registration_code}
                  </a>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}>
                  {row.full_name}
                </td>
                <td style={{ padding: "10px 12px", color: "#475569" }}>
                  {row.email}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    color: "#475569",
                    whiteSpace: "nowrap",
                  }}>
                  {row.profession}
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color:
                        row.attendance_type === "online"
                          ? "#0891b2"
                          : "#d97706",
                    }}>
                    {row.attendance_type}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <AttendanceStatusSelect
                    code={row.registration_code}
                    initialStatus={row.attendance_status}
                  />
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  {row.tx_method ? (
                    <span
                      style={{
                        textTransform: "uppercase",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#475569",
                      }}>
                      {row.tx_method}
                    </span>
                  ) : (
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}>
                  {row.tx_amount ? (
                    new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(parseFloat(row.tx_amount))
                  ) : (
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {statusBadge(row.status)}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    whiteSpace: "nowrap",
                    color: "#475569",
                    fontSize: 13,
                  }}>
                  {row.tx_paid_at ? (
                    new Date(row.tx_paid_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  ) : (
                    <span style={{ color: "#cbd5e1" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                  <ResendButton code={row.registration_code} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 14,
          flexWrap: "wrap",
          gap: 8,
        }}>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Menampilkan{" "}
          {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
          {Math.min(currentPage * PAGE_SIZE, filtered.length)} dari{" "}
          {filtered.length} data
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: currentPage === 1 ? "#f8fafc" : "#fff",
              color: currentPage === 1 ? "#cbd5e1" : "#374151",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontSize: 13,
            }}>
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
            )
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  style={{ padding: "6px 4px", color: "#94a3b8" }}>
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: currentPage === p ? "#1d4ed8" : "#fff",
                    color: currentPage === p ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontWeight: currentPage === p ? 700 : 400,
                    fontSize: 13,
                  }}>
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: currentPage === totalPages ? "#f8fafc" : "#fff",
              color: currentPage === totalPages ? "#cbd5e1" : "#374151",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontSize: 13,
            }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Interactive Attendance select
function AttendanceStatusSelect({
  code,
  initialStatus,
}: {
  code: string;
  initialStatus: any;
}) {
  const [status, setStatus] = useState(initialStatus || "pending");
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const bgColor =
    status === "present"
      ? "#dcfce7"
      : status === "absent"
        ? "#fee2e2"
        : "#f1f5f9";
  const color =
    status === "present"
      ? "#15803d"
      : status === "absent"
        ? "#b91c1c"
        : "#64748b";

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      style={{
        padding: "6px 10px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 700,
        background: bgColor,
        color: color,
        border: "1px solid rgba(0,0,0,0.05)",
        cursor: "pointer",
        outline: "none",
        width: "120px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}>
      <option value="pending">Pending</option>
      <option value="present">Hadir</option>
      <option value="absent">Tidak Hadir</option>
    </select>
  );
}

// Inline resend button to avoid another import
function ResendButton({ code }: { code: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleResend() {
    setLoading(true);
    await fetch("/api/admin/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={loading}
      style={{
        padding: "4px 12px",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        background: done ? "#dcfce7" : "#fff",
        color: done ? "#15803d" : "#475569",
        cursor: loading ? "not-allowed" : "pointer",
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}>
      {done ? "Terkirim" : loading ? "..." : "Resend Email"}
    </button>
  );
}
