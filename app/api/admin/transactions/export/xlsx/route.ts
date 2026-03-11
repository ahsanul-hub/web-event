import { NextResponse } from "next/server";
import { utils, write } from "xlsx";
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

  const data = registrations.map((reg, idx) => {
    const tx = txMap[reg.registration_code];
    return {
      No: idx + 1,
      "Kode Registrasi": reg.registration_code,
      "Nama KTP": reg.nama_ktp,
      "Nama Lengkap & Gelar": reg.full_name,
      NIK: reg.nik,
      Email: reg.email,
      Telepon: reg.phone,
      Institusi: reg.institution,
      "Kota Asal": reg.kota_asal,
      Kategori: reg.profession,
      "Tipe Kehadiran": reg.attendance_type,
      "Status Kehadiran": reg.attendance_status,
      "Tour IKN": reg.tour_ikn ? "Ya" : "Tidak",
      "Metode Pembayaran": tx?.payment_method || "-",
      "Status Pembayaran": reg.status === "paid" ? "Lunas" : "Pending",
      "Jumlah Bayar": tx ? parseFloat(tx.amount as unknown as string) : 0,
      "Waktu Bayar": tx?.paid_at
        ? new Date(tx.paid_at).toLocaleString("id-ID")
        : "-",
    };
  });

  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Registrations");
  const buffer = write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="registrations_full.xlsx"',
    },
  });
}
