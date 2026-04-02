import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { getSetting, upsertSetting } from "@/lib/settings";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dataJson = await getSetting("meeting_report_pdf_data");
    if (!dataJson) {
      return NextResponse.json({ exists: false });
    }

    const data = JSON.parse(dataJson);
    return NextResponse.json({
      exists: true,
      filename: data.filename,
      size: data.size,
      updatedAt: data.updatedAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files are allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const data = {
      filename: file.name,
      size: file.size,
      updatedAt: new Date().toISOString(),
      content: base64,
    };

    await upsertSetting("meeting_report_pdf_data", JSON.stringify(data));

    return NextResponse.json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Delete the setting row to free up space
    await pool.query("DELETE FROM settings WHERE key = $1", ["meeting_report_pdf_data"]);

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
