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
      // TEST SEND logic
      const participant: Registration = {
        full_name: "Peserta Uji Coba (Admin)",
        email: testEmail,
        registration_code: "TEST-REMINDER",
        status: "paid",
        institution: "Rumah Sakit",
        profession: "Dokter Sp.PK",
        attendance_type: "offline",
      } as Registration;

      await sendReminderEmail(participant);
      return NextResponse.json({ message: `Email uji coba berhasil dikirim ke ${testEmail}` });
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

      for (const participant of participants) {
        try {
          await sendReminderEmail(participant);
          sentCount++;
        } catch (err) {
          console.error(`Gagal mengirim reminder ke ${participant.email}:`, err);
          failedCount++;
        }
      }

      return NextResponse.json({
        message: `Selesai batch. Berhasil: ${sentCount}, Gagal: ${failedCount}`,
        sentCount,
        failedCount,
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
