import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { getAllSettings, upsertSetting } from "@/lib/settings";
import { z } from "zod";

export async function GET() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("ADMIN_GET_SETTINGS_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data pengaturan" },
      { status: 500 },
    );
  }
}

const updateSettingsSchema = z.record(z.string());

export async function POST(req: Request) {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = updateSettingsSchema.parse(body);

    for (const [key, value] of Object.entries(validated)) {
      await upsertSetting(key, value);
    }

    return NextResponse.json({ message: "Pengaturan berhasil diperbarui" });
  } catch (error) {
    console.error("ADMIN_UPDATE_SETTINGS_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui pengaturan" },
      { status: 500 },
    );
  }
}
