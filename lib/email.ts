import nodemailer from "nodemailer";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { pool } from "./db";
import type { Registration, Transaction } from "./types";
import { getSetting } from "./settings";

let transporterInstance: nodemailer.Transporter | null = null;
let currentSmtpUser: string | null = null;

function getTransporter() {
  const user = process.env.SMTP_USER;

  // Reset instance if user has changed (e.g. .env update)
  if (transporterInstance && currentSmtpUser !== user) {
    transporterInstance = null;
  }

  if (transporterInstance) return transporterInstance;
  currentSmtpUser = user || null;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER, SMTP_PASS harus diatur agar email dapat dikirim.",
    );
  }

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL (Port 465)
    auth: { user, pass },
    pool: false,
    connectionTimeout: 30000, // Kembalikan ke 30s agar lebih toleran terhadap server lambat
    greetingTimeout: 30000,
    socketTimeout: 30000,
  } as any);

  return transporterInstance;
}

/**
 * Generates a PDF Receipt buffer mirroring the client-side design.
 */
async function generateReceiptPDF(
  registration: Registration,
  transaction: Transaction,
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // --- Header ---
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("PDS PATKLIN BORNEO", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Official Registration Receipt", 105, 22, { align: "center" });

  doc.setFontSize(12);
  doc.text(`REG-CODE: ${registration.registration_code}`, 105, 32, {
    align: "center",
  });

  // --- Content ---
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(16);
  doc.text("BUKTI PEMBAYARAN", 20, 55);

  doc.setDrawColor(226, 232, 240);
  doc.line(20, 58, 190, 58);

  const tableData = [
    ["Nama Peserta", registration.full_name],
    ["Institusi", registration.institution],
    ["Profesi", registration.profession],
    [
      "Metode Pembayaran",
      (transaction.payment_method || "Online").replace(/_/g, " ").toUpperCase(),
    ],
    ["Status", "LUNAS / PAID"],
    [
      "Tanggal Pembayaran",
      transaction.paid_at
        ? new Date(transaction.paid_at).toLocaleString("id-ID")
        : "-",
    ],
  ];

  autoTable(doc, {
    startY: 65,
    body: tableData,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 116, 139] }, // slate-500
      1: { textColor: [15, 23, 42] }, // slate-900
    },
  });

  // Amount Box
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFillColor(248, 250, 252);
  doc.rect(20, finalY + 10, 170, 20, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PEMBAYARAN", 30, finalY + 22);

  const amountNumber = parseFloat(transaction.amount || "0");
  const formattedAmount = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amountNumber);

  doc.setFontSize(16);
  doc.text(formattedAmount, 180, finalY + 22, { align: "right" });

  // Footer & Notes
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    "*Harap simpan kwitansi ini sebagai bukti pendaftaran resmi dan masuk ke lokasi acara.",
    20,
    finalY + 45,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("Tertanda,", 150, finalY + 60);
  doc.text("Panitia Pelaksana", 150, finalY + 85);

  return Buffer.from(doc.output("arraybuffer"));
}

export async function sendRegistrationEmail(
  registration: Registration,
  transaction?: Transaction,
) {
  const transporter = getTransporter();
  const from =
    process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "noreply@aurapakar.com";

  const isPaid = registration.status === "paid";
  let receiptBuffer: Buffer | null = null;

  if (isPaid && transaction) {
    receiptBuffer = await generateReceiptPDF(registration, transaction);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #1e3a8a, #1e40af); padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 40px; color: #1e293b; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #0f172a; }
        .message { line-height: 1.6; margin-bottom: 25px; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
        .receipt-badge { display: inline-block; padding: 12px 24px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; color: #166534; font-weight: 700; font-size: 14px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PDS PATKLIN <span style="color: #4ade80;">BORNEO</span></h1>
        </div>
        <div class="content">
          <p class="greeting">Halo, ${registration.full_name}!</p>
          <div class="receipt-badge">${isPaid ? "PEMBAYARAN KONFIRMASI" : "PENDAFTARAN DITERIMA"}</div>
          <p class="message">
            Terima kasih atas partisipasi Anda dalam <b>Simposium Ilmiah PDS PATKLIN Regional Borneo 2026</b>.
            ${
              isPaid
                ? "Kami telah menerima pembayaran Anda secara lunas."
                : `Pendaftaran Anda telah kami terima dengan kode: <b>${registration.registration_code}</b>. Silakan selesaikan pembayaran melalui tautan berikut jika belum melakukannya: <a href="${registration.payment_link}">${registration.payment_link}</a>`
            }
          </p>
          ${
            isPaid
              ? `
          <p class="message">
            Bersama email ini, kami lampirkan **Kwitansi Resmi** sebagai bukti pendaftaran Anda. Harap simpan file tersebut untuk keperluan registrasi di lokasi.
          </p>`
              : ""
          }
          <p class="message">
            Informasi terkait link meeting (bagi peserta online) dan rundown acara akan kami informasikan kembali melalui email atau grup WhatsApp resmi.
          </p>
        </div>
        <div class="footer">
          &copy; 2026 PDS PATKLIN Regional Borneo. all rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: registration.email,
    subject: isPaid
      ? `[KWITANSI RESMI] Pendaftaran PDS PATKLIN Borneo 2026 - ${registration.registration_code}`
      : `[KONFIRMASI] Registrasi PDS PATKLIN Borneo 2026 - ${registration.registration_code}`,
    html,
    attachments: receiptBuffer
      ? [
          {
            content: receiptBuffer,
            filename: `Kwitansi_PATKLIN_Borneo_${registration.registration_code}.pdf`,
          },
        ]
      : [],
  });
}

export async function sendMeetingEmail(
  registration: Registration,
  meetingUrl: string,
  whatsappUrl: string = "",
) {
  const transporter = getTransporter();
  const from =
    process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "noreply@aurapakar.com";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #0f172a; padding: 30px 40px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
        .content { padding: 40px; }
        .message { font-size: 15px; line-height: 1.8; margin-bottom: 24px; color: #475569; }
        .cta-box { background-color: #f1f5f9; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0; }
        .meeting-link { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); }
        .alternative-link { font-size: 13px; color: #94a3b8; margin-top: 12px; display: block; word-break: break-all; }
        .footer { padding: 30px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LINK MEETING WEBINAR</h1>
        </div>
        <div class="content">
          <p class="message">
            Halo <b>${registration.full_name}</b>, berikut adalah tautan akses untuk mengikuti webinar <b>"Clinical Laboratory Perspective in Hematology and Endocrine Disease"</b>:
          </p>
          
          <div class="cta-box">
            <a href="${meetingUrl}" class="meeting-link">Klik untuk Masuk Zoom</a>
            <span class="alternative-link">Tautan Cadangan: ${meetingUrl}</span>
          </div>

          ${
            whatsappUrl
              ? `
          <div class="cta-box" style="background-color: #f0fdf4;">
            <p style="font-size: 13px; margin-bottom: 12px; color: #166534;">Pastikan Anda juga sudah bergabung di grup WhatsApp peserta:</p>
            <a href="${whatsappUrl}" style="background-color: #22c55e; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);" class="meeting-link">Gabung Grup WhatsApp</a>
          </div>
          `
              : ""
          }

          <p class="message">
            Terima kasih atas partisipasinya. Kami menyarankan Anda bergabung 10-15 menit sebelum acara dimulai.
          </p>
        </div>
        <div class="footer">
          &copy; 2026 PDS PATKLIN Regional Borneo. email otomatis oleh sistem.
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  const pdfDataJson = await getSetting("meeting_report_pdf_data");
  if (pdfDataJson) {
    try {
      const data = JSON.parse(pdfDataJson);
      if (data.content && data.filename) {
        attachments.push({
          filename: data.filename,
          content: Buffer.from(data.content, "base64"),
        });
      }
    } catch (e) {
      console.error("Gagal memproses lampiran PDF dari settings:", e);
    }
  }

  await transporter.sendMail({
    from,
    to: registration.email,
    subject: `[LINK MEETING] Simposium Ilmiah PDS PATKLIN Regional Borneo 2026`,
    html,
    attachments,
  });
}

export async function sendReminderEmail(registration: Registration) {
  const transporter = getTransporter();
  const from =
    process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "noreply@aurapakar.com";

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
        .content { padding: 30px 40px; }
        .greeting { font-size: 16px; font-weight: 700; margin: 0 0 15px; color: #0f2a83; }
        .message { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; text-align: justify; }
        .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px; font-size: 14px; }
        .timeline-box { background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 20px; margin-bottom: 25px; font-size: 13px; color: #9a3412; }
        .timeline-title { font-weight: 800; margin-bottom: 10px; color: #c2410c; text-transform: uppercase; }
        .cta-container { margin: 25px 0; }
        .btn { display: block; padding: 14px 10px; background: linear-gradient(135deg, #1a3b94, #0a1f66); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; box-shadow: 0 4px 6px rgba(15,42,131,0.2); text-align: center; }
        .btn-wa { background: linear-gradient(135deg, #25D366, #128C7E); box-shadow: 0 4px 6px rgba(37,211,102,0.2); }
        .footer { padding: 30px 40px; background-color: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .bullet-list { margin: 10px 0; padding-left: 20px; }
        .bullet-list li { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>PDS PATKLIN <span style="color: #87d300;">BORNEO</span></h1>
        </div>
        <div class="hero">
          REMINDER KEGIATAN & INFORMASI PENTING
        </div>
        <div class="content">
          <p class="greeting">Bapak/Ibu Prof / Dr / dr <b>${registration.full_name}</b> yang kami hormati, </p>
          
          <p class="message">
            Dalam rangka Pelantikan Pengurus PDS PATKLIN Regional Borneo (Balikpapan, Palangkaraya, Banjarmasin, Pontianak, dan Tarakan) Masa Bakti 2025–2028, kami mengucapkan terima kasih atas partisipasi Bapak/Ibu/ Saudara yang telah mendaftar sebagai peserta dalam kegiatan webinar <b>"Clinical Laboratory Perspective in Hematology and Endocrine Disease"</b> yang akan diselenggarakan pada:
          </p>
          
          <div class="details-box">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; width: 110px; color: #64748b; font-weight: 600;">Hari/Tanggal</td>
                <td style="padding: 4px 0; color: #0f2a83; font-weight: 700;">: Sabtu, 11 April 2026</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Waktu</td>
                <td style="padding: 4px 0; color: #0f2a83; font-weight: 700;">: 09.30 - 16.00 WITA</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Tempat</td>
                <td style="padding: 4px 0; color: #0f2a83; font-weight: 700;">: Platinum Hotel & Convention Center, Rhodium 2-7, M Floor</td>
              </tr>
            </table>
          </div>

          <p class="message">
            <b>Bagi peserta offline</b>, registrasi akan dibuka pukul 09.00 WITA.<br/>
            <b>Bagi peserta online</b>, tautan (link) Zoom akan diberitahukan via email pada H-1 dan juga akan dibagikan melalui grup WhatsApp.
          </p>

          <div class="timeline-box">
            <div class="timeline-title">⚠️ TIMELINE PLATARAN SEHAT:</div>
            <ul class="bullet-list">
              <li>Peserta tidak perlu minta akses, tunggu dan cek berkala sampai dengan diverifikasi. Selama data NIK & email yang didaftarkan sudah benar, <b>PASTI</b> akan diverifikasi.</li>
              <li><b>Pre Test:</b> Sabtu, 11 April 2026 (07:00 - 18.00 WITA)</li>
              <li><b>Post Test:</b> Minggu, 12 April 2026 (17.00 WITA) s.d Rabu, 15 April 2026 (18.00 WITA)</li>
            </ul>
          </div>

          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 25px 0;">
            <tr>
              <td style="width: 50%; vertical-align: middle;">
                <a href="https://chat.whatsapp.com/Fl04qFt3ZOdDDKu4wEtNqr?mode=gi_t" class="btn btn-wa">Gabung Grup WhatsApp</a>
              </td>
              <td style="width: 50%; vertical-align: middle;">
                <a href="https://drive.google.com/drive/folders/1VSwVDpJ2NfQhA3hsQNmaGEsmztndwifR" class="btn">Link Materi (Drive)</a>
              </td>
            </tr>
          </table>

          <p class="message">
            Kami mengharapkan kehadiran Bapak/Ibu/ Saudara hadir tepat waktu agar dapat mengikuti seluruh rangkaian acara dengan baik. Atas perhatian dan partisipasinya, kami ucapkan terima kasih.
          </p>
          
          <p class="message" style="margin-top: 30px;">
            Hormat kami,<br>
            <b>Panitia PDS PATKLIN Regional Borneo</b>
          </p>
        </div>
        <div class="footer">
          <p>Email ini dikirim otomatis oleh Sistem Registrasi PDS PATKLIN Borneo.</p>
          <div style="margin-top: 20px; opacity: 0.5;">
            &copy; 2026 PDS PATKLIN Regional Borneo. all rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = [];
  const pdfDataJson = await getSetting("meeting_report_pdf_data");
  if (pdfDataJson) {
    try {
      const data = JSON.parse(pdfDataJson);
      if (data.content && data.filename) {
        attachments.push({
          filename: data.filename,
          content: Buffer.from(data.content, "base64"),
        });
      }
    } catch (e) {
      console.error("Gagal memproses lampiran PDF dari settings:", e);
    }
  }

  const result = await transporter.sendMail({
    from,
    to: registration.email,
    subject: `[REMINDER] Simposium Ilmiah PDS PATKLIN Regional Borneo 2026`,
    html,
    attachments,
  });

  console.log("Email Sent via SMTP:", result.messageId);
}
