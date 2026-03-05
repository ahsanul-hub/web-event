import { NextResponse } from "next/server";
import { getActiveVouchers } from "@/lib/vouchers";

export async function GET() {
  try {
    const vouchers = await getActiveVouchers();
    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("GET_ACTIVE_VOUCHERS_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan sistem." },
      { status: 500 },
    );
  }
}
