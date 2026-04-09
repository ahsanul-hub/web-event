import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { sendReminderEmail } from "@/lib/email";
import { pool } from "@/lib/db";
import type { Registration } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { testEmail, isBatch, selectedIds } = await req.json();

    if (testEmail) {
      // TEST SEND: Ambil data asli dari database agar nama & kode sesuai peserta sebenarnya
      const result = await pool.query<Registration>(
        "SELECT * FROM registrations WHERE email = $1 LIMIT 1",
        [testEmail],
      );

      let participant: Registration;
      let isRealData = false;

      if (result.rows.length > 0) {
        participant = result.rows[0];
        isRealData = true;
      } else {
        // Fallback jika email tidak ditemukan di database
        participant = {
          full_name: "Nama Peserta Simulasi (Tidak Terdaftar)",
          email: testEmail,
          registration_code: "TEST-CODE",
          status: "paid",
          institution: "Institusi Contoh",
          profession: "Profesi Contoh",
          attendance_type: "offline",
        } as Registration;
      }

      await sendReminderEmail(participant);
      return NextResponse.json({
        message: `Email uji coba berhasil dikirim ke ${testEmail}. ${
          isRealData
            ? `(Menggunakan data asli: ${participant.full_name})`
            : "(Catatan: Email ini tidak terdaftar di database peserta, menggunakan data simulasi)"
        }`,
      });
    }

    if (isBatch || selectedIds) {
      // BATCH SEND logic
      let query = `SELECT * FROM registrations WHERE status = 'paid'`;
      let params: any[] = [];

      if (selectedIds && Array.isArray(selectedIds)) {
        query += ` AND id = ANY($1)`;
        params.push(selectedIds);
      }

      const result = await pool.query<Registration>(query, params);
      const participants = result.rows;

      let sentCount = 0;
      let failedCount = 0;
      const failedEmails: string[] = [];
      const failedIds: number[] = [];

      for (const participant of participants) {
        try {
          await sendReminderEmail(participant);
          sentCount++;
          // Tambahkan jeda minimal 3 detik untuk setiap email agar tidak memicu proteksi hosting
          if (participants.indexOf(participant) < participants.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (err) {
          console.error(`Gagal mengirim reminder ke ${participant.email}:`, err);
          failedCount++;
          failedEmails.push(participant.email);
          failedIds.push(participant.id);
        }
      }

      return NextResponse.json({
        message: `Selesai batch. Berhasil: ${sentCount}, Gagal: ${failedCount}`,
        sentCount,
        failedCount,
        failedEmails,
        failedIds,
      });
    }

    return NextResponse.json({ message: "Parameter tidak valid." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memproses pengiriman email reminder." },
      { status: 500 },
    );
  }
}
