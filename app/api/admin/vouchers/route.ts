import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { getAllVouchers, createVoucher } from "@/lib/vouchers";
import { z } from "zod";

const createVoucherSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().min(0),
  max_claims: z.number().min(1),
  expires_at: z.string().nullable().optional(),
});

export async function GET() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const vouchers = await getAllVouchers();
    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("ADMIN_GET_VOUCHERS_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil data voucher" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = createVoucherSchema.parse(body);
    const voucher = await createVoucher(validated);
    return NextResponse.json(voucher);
  } catch (error: any) {
    console.error("ADMIN_CREATE_VOUCHER_ERROR:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message:
            "Data tidak valid: " +
            error.errors.map((e) => e.message).join(", "),
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        message: "Gagal membuat voucher: " + (error.message || "Unknown error"),
      },
      { status: 500 },
    );
  }
}
