import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import fs from "fs";
import path from "path";

const REPORT_DIR = path.join(process.cwd(), "public", "pdf", "report");

export async function GET() {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!fs.existsSync(REPORT_DIR)) {
      return NextResponse.json({ exists: false });
    }

    const files = fs.readdirSync(REPORT_DIR);
    if (files.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const filename = files[0];
    const fullPath = path.join(REPORT_DIR, filename);
    const stats = fs.statSync(fullPath);

    return NextResponse.json({
      exists: true,
      filename: filename,
      size: stats.size,
      updatedAt: stats.mtime,
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
    const buffer = new Uint8Array(bytes);

    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    } else {
      // Clear previous files to avoid storage bloat
      const files = fs.readdirSync(REPORT_DIR);
      for (const f of files) {
        fs.unlinkSync(path.join(REPORT_DIR, f));
      }
    }

    const fullPath = path.join(REPORT_DIR, file.name);
    fs.writeFileSync(fullPath, buffer);

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

    if (fs.existsSync(REPORT_DIR)) {
      const files = fs.readdirSync(REPORT_DIR);
      for (const f of files) {
        fs.unlinkSync(path.join(REPORT_DIR, f));
      }
    }

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
