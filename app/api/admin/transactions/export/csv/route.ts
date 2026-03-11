import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { getAllRegistrations, getTransactions } from "@/lib/registrations";
import type { Transaction } from "@/lib/types";

export async function GET() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const registrations = await getAllRegistrations();
  const transactions = await getTransactions();

  // Create lookup for transactions
  const txMap: Record<string, Transaction> = {};
  for (const tx of transactions) {
    txMap[tx.registration_code] = tx;
  }

  const header = [
    "No",
    "Kode Registrasi",
    "Nama KTP",
    "Nama Lengkap & Gelar",
    "NIK",
    "Email",
    "Telepon",
    "Institusi",
    "Kota Asal",
    "Kategori",
    "Tipe Kehadiran",
    "Status Kehadiran",
    "Tour IKN",
    "Metode Pembayaran",
    "Status Pembayaran",
    "Jumlah Bayar",
    "Waktu Bayar",
  ];

  const rows = registrations.map((reg, idx) => {
    const tx = txMap[reg.registration_code];
    return [
      idx + 1,
      reg.registration_code,
      reg.nama_ktp,
      reg.full_name,
      reg.nik,
      reg.email,
      reg.phone,
      reg.institution,
      reg.kota_asal,
      reg.profession,
      reg.attendance_type,
      reg.attendance_status,
      reg.tour_ikn ? "Ya" : "Tidak",
      tx?.payment_method || "-",
      reg.status === "paid" ? "Lunas" : "Pending",
      tx?.amount || 0,
      tx?.paid_at ? new Date(tx.paid_at).toLocaleString("id-ID") : "-",
    ];
  });

  const csvContent = [header, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  // Add BOM for Excel UTF-8 support
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const csvEncoded = new TextEncoder().encode(csvContent);
  const content = new Uint8Array(bom.length + csvEncoded.length);
  content.set(bom);
  content.set(csvEncoded, bom.length);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="participants_full.csv"',
    },
  });
}
