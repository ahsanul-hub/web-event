import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = "SELECT * FROM registrations WHERE status != 'cancelled'";
    const params: string[] = [];

    if (status) {
      query += " AND status = $1";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
