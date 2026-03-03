import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoggedInAdminId } from "@/lib/auth";
import { updateAttendanceStatus } from "@/lib/registrations";

const bodySchema = z.object({
  code: z.string(),
  status: z.enum(["pending", "present", "absent"]),
});

export async function POST(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { code, status } = bodySchema.parse(await req.json());
    const updated = await updateAttendanceStatus(code, status);

    if (!updated) {
      return NextResponse.json(
        { message: "Peserta tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Status kehadiran diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memperbarui status" },
      { status: 400 },
    );
  }
}
