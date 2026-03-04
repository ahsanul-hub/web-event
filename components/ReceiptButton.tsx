"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Registration, Transaction } from "@/lib/types";

export default function ReceiptButton({
  registration,
  transaction,
}: {
  registration: Registration;
  transaction?: Transaction | null;
}) {
  const handleDownload = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Colors
    const NAVY = "#0f2a83";
    const LIME = "#87d300";
    const CYAN = "#00c2e0";
    const TEXT_DARK = "#172554";
    const TEXT_GRAY = "#64748b";

    // Header
    doc.setFillColor(NAVY);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor("#ffffff");
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("KWITANSI PEMBAYARAN", 105, 25, { align: "center" });

    // Brand accent
    doc.setFillColor(LIME);
    doc.rect(0, 40, 210, 10, "F");
    doc.setTextColor(NAVY);
    doc.setFontSize(10);
    doc.text("PDS PATKLIN REGIONAL BORNEO", 105, 46, { align: "center" });

    // Content Area
    let currY = 65;

    // Receipt Info
    doc.setTextColor(TEXT_GRAY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("NOMOR KUITANSI", 20, currY);
    doc.text("TANGGAL", 190, currY, { align: "right" });

    currY += 6;
    doc.setTextColor(NAVY);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`REG-${registration.registration_code}`, 20, currY);
    const paidDate = transaction?.paid_at
      ? new Date(transaction.paid_at)
      : new Date();
    doc.text(
      paidDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      190,
      currY,
      { align: "right" },
    );

    currY += 15;
    doc.setDrawColor("#e2e8f0");
    doc.line(20, currY, 190, currY);
    currY += 10;

    // Table of Details
    autoTable(doc, {
      startY: currY,
      margin: { left: 20, right: 20 },
      head: [["DESKRIPSI", "DETAIL"]],
      body: [
        ["Nama Lengkap", registration.full_name.toUpperCase()],
        ["Email", registration.email],
        ["Institusi/Instansi", registration.institution],
        ["Kategori Peserta", registration.profession],
        ["Tipe Kehadiran", registration.attendance_type.toUpperCase()],
        ["Status Pembayaran", "LUNAS / TERVERIFIKASI"],
        [
          "Metode Pembayaran",
          transaction?.payment_method?.toUpperCase() || "MANUAL TRANSFER",
        ],
      ],
      theme: "striped",
      headStyles: {
        fillColor: NAVY,
        textColor: "#ffffff",
        fontSize: 11,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 10, textColor: TEXT_DARK, cellPadding: 8 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: "bold", textColor: TEXT_GRAY },
        1: { cellWidth: "auto" },
      },
    });

    currY = (doc as any).lastAutoTable.finalY + 15;

    // Total Amount Box
    doc.setFillColor("#f8fafc");
    doc.rect(130, currY, 60, 20, "F");
    doc.setDrawColor(CYAN);
    doc.setLineWidth(1);
    doc.line(130, currY, 130, currY + 20);

    doc.setTextColor(TEXT_GRAY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL BAYAR", 135, currY + 7);

    doc.setTextColor(NAVY);
    doc.setFontSize(14);
    const amount = transaction?.amount
      ? parseFloat(String(transaction.amount))
      : 0;
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
    doc.text(formattedAmount, 135, currY + 15);

    currY += 40;

    // Footer / Signature
    doc.setTextColor(TEXT_DARK);
    doc.setFontSize(10);
    doc.text("Panitia Pelaksana,", 150, currY);
    currY += 25;
    doc.text("PDS PATKLIN Regional Borneo", 150, currY);

    // Bottom Decorative
    doc.setFillColor(NAVY);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor("#ffffff");
    doc.setFontSize(8);
    doc.text(
      "Simposium Ilmiah & Pelantikan Pengurus PDS PATKLIN Regional Borneo 2025-2028",
      105,
      293,
      { align: "center" },
    );

    doc.save(`Kwitansi_${registration.registration_code}.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      className="submit-btn"
      style={{
        width: "100%",
        background: "var(--lime)",
        color: "var(--navy)",
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
        boxShadow: "0 4px 12px rgba(135, 211, 0, 0.2)",
      }}>
      <span>📄</span> Download Kwitansi (PDF)
    </button>
  );
}
