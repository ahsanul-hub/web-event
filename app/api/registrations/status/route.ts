import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM registrations WHERE status != 'cancelled'",
    );
    const count = parseInt(result.rows[0].count);
    return NextResponse.json({ count, isClosed: count >= 991 });
  } catch (error) {
    console.error("Error fetching registration count:", error);
    return NextResponse.json({ count: 0, isClosed: false }, { status: 500 });
  }
}
