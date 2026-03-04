import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import {
  getNIKWhitelist,
  addToWhitelist,
  removeFromWhitelist,
} from "@/lib/registrations";

export async function GET() {
  const adminId = await getLoggedInAdminId();
  if (!adminId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const list = await getNIKWhitelist();
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const adminId = await getLoggedInAdminId();
  if (!adminId)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { action, nik, description } = await req.json();

    if (action === "add") {
      if (!nik || nik.length !== 16 || !/^\d+$/.test(nik)) {
        return NextResponse.json(
          { message: "NIK harus 16 digit angka" },
          { status: 400 },
        );
      }
      await addToWhitelist(nik, description || "");
      return NextResponse.json({ message: "NIK ditambahkan ke whitelist" });
    }

    if (action === "remove") {
      await removeFromWhitelist(nik);
      return NextResponse.json({ message: "NIK dihapus dari whitelist" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
