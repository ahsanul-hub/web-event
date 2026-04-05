import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { sendMeetingEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { pool } from "@/lib/db";
import type { Registration } from "@/lib/types";

export async function GET() {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query<Registration>(
      `SELECT id, full_name, email, registration_code
       FROM registrations
       WHERE attendance_type = 'online'
         AND status = 'paid'`,
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengambil daftar peserta." },
      { status: 500 },
    );
  }
}

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

    // Parse request body
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body might be empty
    }
    const { email: testEmail, registrationId } = body as {
      email?: string;
      registrationId?: number;
    };

    let onlineParticipants: Registration[] = [];

    if (testEmail) {
      // Scenario 1: Manual Test Email
      onlineParticipants = [
        {
          full_name: "Admin Test User",
          email: testEmail,
          registration_code: "TEST-LINK",
          attendance_type: "online",
        } as Registration,
      ];
    } else if (registrationId) {
      // Scenario 2: Send to specific registration ID (Client-side loop)
      const res = await pool.query<Registration>(
        "SELECT * FROM registrations WHERE id = $1 LIMIT 1",
        [registrationId],
      );
      if (res.rowCount === 0) {
        return NextResponse.json(
          { message: "Peserta tidak ditemukan." },
          { status: 404 },
        );
      }
      onlineParticipants = res.rows;
    } else {
      // Scenario 3: Send to ALL (Fallback or Bulk internal request)
      const result = await pool.query<Registration>(
        `SELECT * FROM registrations
         WHERE attendance_type = 'online'
           AND status = 'paid'`,
      );
      onlineParticipants = result.rows;

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

      if (onlineParticipants.length === 0) {
        return NextResponse.json({
          message: "Tidak ada peserta online yang berstatus 'paid'.",
        });
      }
    }

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
        // If it's a single registration send, we want to know it failed
        if (registrationId) {
          throw err;
        }
      }
    }

    return NextResponse.json({
      message:
        testEmail || registrationId
          ? `Berhasil mengirim email ke ${onlineParticipants[0].email}.`
          : `Berhasil mengirim email link meeting ke ${sentCount} peserta.`,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memproses pengiriman email." },
      { status: 500 },
    );
  }
}
