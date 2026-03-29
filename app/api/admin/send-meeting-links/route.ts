import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { sendMeetingEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { pool } from "@/lib/db";
import type { Registration } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const onlineMeetingLink = await getSetting("online_meeting_link");
    const whatsappLink = await getSetting("whatsapp_link");

    if (!onlineMeetingLink) {
      return NextResponse.json(
        { message: "Link online meeting belum diatur di konfigurasi." },
        { status: 400 },
      );
    }

    // --- BAGIAN MENGAMBIL DATA EMAIL SELURUH PESERTA ONLINE (DI-COMMENT) ---

    const result = await pool.query<Registration>(
      `SELECT * FROM registrations 
       WHERE attendance_type = 'online' 
         AND status = 'paid'`,
    );
    const onlineParticipants = result.rows;

    // --- LIST EMAIL DUMMY UNTUK TEST KIRIM ---
    // const onlineParticipants = [
    //   {
    //     full_name: "Ahsanul Waladi",
    //     email: "aldi.madridista.am@gmail.com",
    //     registration_code: "DUMMY001",
    //   },
    //   {
    //     full_name: "John",
    //     email: "john.jojon888@gmail.com",
    //     registration_code: "DUMMY002",
    //   },
    // ] as Registration[];

    let sentCount = 0;
    for (const participant of onlineParticipants) {
      try {
        await sendMeetingEmail(
          participant,
          onlineMeetingLink,
          whatsappLink ?? "",
        );
        sentCount++;
      } catch (err) {
        console.error(`Gagal mengirim ke ${participant.email}:`, err);
      }
    }

    return NextResponse.json({
      message: `Berhasil mengirim email link meeting ke ${sentCount} peserta (dummy test).`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memproses pengiriman email." },
      { status: 500 },
    );
  }
}
