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
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const search = searchParams.get("search");

    let query = "SELECT * FROM registrations WHERE status != 'cancelled'";
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length} OR institution ILIKE $${params.length})`;
    }

    query += " ORDER BY created_at DESC ";

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    }

    if (offset) {
      params.push(parseInt(offset));
      query += ` OFFSET $${params.length}`;
    }

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
