import nodemailer from "nodemailer";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pool } from "./db";
import type { Registration, Transaction } from "./types";
import { getSetting } from "./settings";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, SMTP_PASS harus diatur agar email dapat dikirim.",
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Generates a PDF Receipt buffer mirroring the client-side design.
 */
async function generateReceiptPDF(
  registration: Registration,
  transaction?: Transaction,
): Promise<Buffer> {
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
        transaction?.payment_method?.toUpperCase() || "REDPAY / MANUAL",
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

  return Buffer.from(doc.output("arraybuffer"));
}

export async function sendRegistrationEmail(registration: Registration) {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM ?? "noreply@patklin-borneo.id";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const whatsappLink = await getSetting("whatsapp_link");
  const onlineMeetingLink = await getSetting("online_meeting_link");

  const isPaid = registration.status === "paid";
  const statusLabel = isPaid ? "Lunas / Terverifikasi" : "Menunggu Pembayaran";
  const statusColor = isPaid ? "#10b981" : "#f59e0b";

  let attachments: any[] = [];

  if (isPaid) {
    try {
      // Fetch transaction details for the PDF
      const txResult = await pool.query<Transaction>(
        "SELECT * FROM transactions WHERE registration_id = $1 LIMIT 1",
        [registration.id],
      );
      const transaction = txResult.rows[0];

      const pdfBuffer = await generateReceiptPDF(registration, transaction);
      attachments.push({
        filename: `Kwitansi_${registration.registration_code}.pdf`,
        content: pdfBuffer,
      });
    } catch (pdfError) {
      console.error("Gagal membuat lampiran PDF:", pdfError);
      // We still send the email even if PDF fails
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6fa; color: #172554; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background-color: #0f2a83; padding: 30px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .hero { background-color: #87d300; padding: 15px; text-align: center; color: #0f2a83; font-weight: 700; font-size: 14px; }
        .content { padding: 40px; }
        .greeting { font-size: 18px; font-weight: 700; margin: 0 0 10px; color: #0f2a83; }
        .message { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 25px; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .info-value { font-size: 14px; color: #0f2a83; font-weight: 700; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40; }
        .cta-container { text-align: center; margin-top: 30px; }
        .btn { display: inline-block; padding: 14px 24px; background: linear-gradient(135deg, #1a3b94, #0a1f66); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px rgba(15,42,131,0.2); margin: 5px; }
        .btn-wa { background: linear-gradient(135deg, #25D366, #128C7E); box-shadow: 0 4px 6px rgba(37,211,102,0.2); }
        .btn-zoom { background: linear-gradient(135deg, #2D8CFF, #0B5ED7); box-shadow: 0 4px 6px rgba(45,140,255,0.2); }
        .footer { padding: 30px 40px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 5px 0; }
        .event-details { margin-top: 15px; padding-top: 15px; border-top: 1px dotted #cbd5e1; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PDS PATKLIN <span style="color: #87d300;">BORNEO</span></h1>
        </div>
        <div class="hero">
          Simposium Ilmiah & Pelantikan Pengurus 2025-2028
        </div>
        <div class="content">
          <h2 class="greeting">Halo, ${registration.full_name}</h2>
          <p class="message">
            ${
              isPaid
                ? "Terima kasih! Pembayaran Anda telah kami verifikasi. Terlampir adalah Kwitansi Resmi Anda sebagai bukti pembayaran yang sah. Mohon simpan Kode Registrasi ini sebagai bukti kehadiran."
                : "Terima kasih telah mendaftar. Silakan lakukan pembayaran sesuai instruksi di bawah ini untuk mengamankan slot kehadiran Anda."
            }
          </p>
          
          <div class="info-box">
            <div style="display: table; width: 100%;">
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Kode Registrasi</div>
                <div style="display: table-cell; padding: 8px 0; text-align: right; font-size: 16px; color: #00c2e0; font-weight: 800; font-family: monospace;">${registration.registration_code}</div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Status</div>
                <div style="display: table-cell; padding: 8px 0; text-align: right;"><span class="status-badge">${statusLabel}</span></div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Profesi</div>
                <div style="display: table-cell; padding: 8px 0; text-align: right; font-size: 14px; color: #0f2a83; font-weight: 700;">${registration.profession}</div>
              </div>
              <div style="display: table-row;">
                <div style="display: table-cell; padding: 8px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">Tipe Kehadiran</div>
                <div style="display: table-cell; padding: 8px 0; text-align: right; font-size: 14px; color: #0f2a83; font-weight: 700; text-transform: capitalize;">${registration.attendance_type}</div>
              </div>
            </div>
          </div>

          ${
            isPaid
              ? `
            <div class="cta-container">
              ${whatsappLink ? `<a href="${whatsappLink}" class="btn btn-wa">Join WhatsApp Group</a>` : ""}
              ${
                registration.attendance_type.toLowerCase() === "online" &&
                onlineMeetingLink
                  ? `<a href="${onlineMeetingLink}" class="btn btn-zoom">Online Meeting Link</a>`
                  : ""
              }
            </div>
            <p style="font-size: 13px; color: #64748b; text-align: center; font-style: italic; margin-top: 15px;">
              *Kwitansi digital telah dilampirkan dalam email ini.
              ${whatsappLink ? "<br/>Mohon segera bergabung ke grup WhatsApp di atas untuk informasi teknis lebih lanjut." : ""}
            </p>
          `
              : `
            <div class="cta-container">
              <a href="${appUrl}/payment/${registration.registration_code}" class="btn">Lanjutkan Pembayaran</a>
            </div>
            <p style="text-align: center; font-size: 13px; color: #94a3b8; margin-top: 15px;">
              Abaikan jika Anda sudah melakukan pembayaran.
            </p>
          `
          }


          <div class="event-details">
            <p style="font-size: 14px; font-weight: 700; color: #0f2a83; margin: 0 0 5px;">📍 Lokasi & Waktu Acara</p>
            <p style="font-size: 13px; margin: 0; color: #475569;">Sabtu, 11 April 2026</p>
            <p style="font-size: 13px; margin: 0; color: #475569;">Platinum Hotel & Convention Center Balikpapan</p>
          </div>
        </div>
        <div class="footer">
          <p style="margin-bottom: 15px; font-weight: 700; color: #64748b; font-size: 13px;">Untuk Informasi & Bantuan:</p>
          <div style="display: table; width: 100%; margin-bottom: 20px; font-size: 12px; color: #94a3b8;">
            <div style="display: table-row;">
              <div style="display: table-cell; text-align: left; padding: 2px 0;">Ramlah</div>
              <div style="display: table-cell; text-align: right; padding: 2px 0;">0821-5701-2190</div>
            </div>
           
          </div>
          <p>Jika butuh bantuan, hubungi Panitia melalui dashboard pendaftaran.</p>
          <p><a href="${appUrl}/payment/${registration.registration_code}" style="color: #00c2e0; text-decoration: none;">Lihat Detail Pendaftaran &rarr;</a></p>
          <div style="margin-top: 20px; opacity: 0.5;">
            &copy; 2026 PDS PATKLIN Regional Borneo. all rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: registration.email,
    subject: isPaid
      ? `Konfirmasi Pembayaran: ${registration.registration_code}`
      : `[PENTING] Kode Registrasi & Instruksi Pembayaran: ${registration.registration_code}`,
    html,
    attachments,
  });
}
