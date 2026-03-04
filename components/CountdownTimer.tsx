"use client";

import { useEffect, useState } from "react";

type Props = {
  startTime: string; // ISO String from updated_at
  method: string;
  onExpire?: () => void;
};

export default function CountdownTimer({ startTime, method, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // 10 minutes for QRIS/GoPay, 60 minutes for others
    const durationMinutes = method === "qris" || method === "gopay" ? 10 : 60;
    const durationMs = durationMinutes * 60 * 1000;

    const start = new Date(startTime).getTime();
    const end = start + durationMs;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, method, onExpire]);

  if (timeLeft === null) return null;

  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const isExpired = timeLeft <= 0;

  return (
    <div
      style={{
        background: isExpired ? "#fef2f2" : "#fffbeb",
        border: `1px solid ${isExpired ? "#fee2e2" : "#fef3c7"}`,
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        textAlign: "center",
      }}>
      <div
        style={{
          fontSize: "14px",
          color: isExpired ? "#b91c1c" : "#92400e",
          marginBottom: "4px",
          fontWeight: 600,
        }}>
        {isExpired
          ? "⏰ Batas Waktu Pembayaran Habis"
          : "⏰ Sisa Waktu Pembayaran"}
      </div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: 800,
          fontFamily: "monospace",
          color: isExpired ? "#ef4444" : "#d97706",
        }}>
        {isExpired
          ? "00:00"
          : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </div>
      {!isExpired && (
        <p
          style={{
            fontSize: "12px",
            color: "#b45309",
            marginTop: "8px",
            margin: "8px 0",
          }}>
          Selesaikan pembayaran sebelum waktu habis atau link akan kedaluwarsa.
        </p>
      )}
      {isExpired && (
        <p
          style={{
            fontSize: "12px",
            color: "#ef4444",
            marginTop: "8px",
            margin: "8px 0",
          }}>
          Silakan buat link pembayaran baru menggunakan form di bawah.
        </p>
      )}
    </div>
  );
}
