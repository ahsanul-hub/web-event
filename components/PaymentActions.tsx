"use client";

import { useState } from "react";
import type { Registration, Transaction } from "@/lib/types";
import ReceiptButton from "./ReceiptButton";
import CountdownTimer from "./CountdownTimer";

const PAYMENT_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "va_bca", label: "BCA Virtual Account" },
  { value: "va_bri", label: "BRI Virtual Account" },
  { value: "va_mandiri", label: "Mandiri Virtual Account" },
  { value: "va_bni", label: "BNI Virtual Account" },
  { value: "va_permata", label: "Permata Virtual Account" },
  { value: "va_sinarmas", label: "Sinarmas Virtual Account" },
  { value: "gopay", label: "GoPay" },
  { value: "dana", label: "DANA" },
];

export default function PaymentActions({
  registration,
  transaction,
}: {
  registration: Registration;
  transaction?: Transaction | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [showNewLink, setShowNewLink] = useState(false);

  const {
    registration_code: code,
    payment_link: paymentLink,
    status,
  } = registration;

  // If already paid — Show receipt download
  if (status === "paid") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "16px 20px",
            color: "#15803d",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
          <span style={{ fontSize: "20px" }}>✔️</span> Pembayaran Telah Diterima
        </div>

        <ReceiptButton registration={registration} transaction={transaction} />

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b" }}>
          Klik tombol di atas untuk mengunduh kwitansi resmi pendaftaran Anda.
        </p>
      </div>
    );
  }

  // A fallback link is one that still points to our own /payment/... page
  const isFallbackLink = paymentLink.includes(`/payment/${code}`);

  async function generatePaymentLink() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Gagal membuat link pembayaran baru.");
        setLoading(false);
        return;
      }

      // Automatically open the new payment link in a new tab
      if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
      }

      window.location.reload();
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  const showGenerateForm = isFallbackLink || showNewLink;

  // Determine actual payment method for the timer
  // Use transaction.payment_method if available, otherwise use initial registration payment link context if possible
  const currentMethod = transaction?.payment_method || "qris";

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
      {status === "pending_payment" && (
        <CountdownTimer
          startTime={registration.updated_at || registration.created_at}
          method={currentMethod}
        />
      )}

      {/* Payment link button — only when a valid Redpay URL exists */}
      {!isFallbackLink && (
        <a
          href={paymentLink}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}>
          <button
            type="button"
            className="submit-btn"
            style={{
              width: "100%",
              background: "var(--navy)",
              color: "white",
              padding: "14px 24px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}>
            <span>💳</span> Buka Halaman Pembayaran
          </button>
        </a>
      )}

      {/* Generate / renew payment link */}
      {showGenerateForm ? (
        <div
          style={{
            background: isFallbackLink ? "#fff1f2" : "#f8fafc",
            padding: "20px",
            borderRadius: "16px",
            border: `2px solid ${isFallbackLink ? "#fecaca" : "#e2e8f0"}`,
          }}>
          <p
            style={{
              color: isFallbackLink ? "#991b1b" : "#475569",
              marginBottom: "16px",
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: "1.4",
            }}>
            {isFallbackLink
              ? "Link pembayaran belum tersedia. Silakan pilih metode dan buat tagihan baru:"
              : "Buat link pembayaran baru (jika link lama sudah tidak berlaku):"}
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              disabled={loading}
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                flex: "1 1 200px",
                fontSize: "15px",
                background: "#fff",
              }}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={generatePaymentLink}
              disabled={loading}
              className="submit-btn"
              style={{
                background: "var(--navy)",
                color: "white",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "15px",
                flex: "1 1 150px",
                marginTop: "0",
              }}>
              {loading ? "Memproses..." : "Bayar"}
            </button>
          </div>
          {!isFallbackLink && (
            <button
              type="button"
              onClick={() => setShowNewLink(false)}
              disabled={loading}
              style={{
                background: "transparent",
                color: "#64748b",
                padding: "10px 16px",
                marginTop: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                fontSize: "14px",
                width: "100%",
              }}>
              Batal
            </button>
          )}
        </div>
      ) : (
        /* Button to open the renewal form */
        <button
          type="button"
          onClick={() => setShowNewLink(true)}
          style={{
            background: "#f8fafc",
            color: "#64748b",
            border: "1px dashed #cbd5e1",
            padding: "14px",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#f8fafc")}>
          🔄 Link pembayaran kedaluwarsa? <b>Buat link baru</b>
        </button>
      )}

      {error && (
        <div
          style={{
            color: "#b91c1c",
            fontSize: "14px",
            marginTop: "8px",
            background: "#fef2f2",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #fee2e2",
          }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
