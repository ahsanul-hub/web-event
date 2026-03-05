import { NextResponse } from "next/server";
import { isVoucherValid } from "@/lib/vouchers";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json(
        { message: "Kode voucher harus diisi." },
        { status: 400 },
      );
    }

    const { valid, voucher, reason } = await isVoucherValid(code);

    if (!valid) {
      return NextResponse.json({ message: reason }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      voucher: {
        code: voucher?.code,
        discount_type: voucher?.discount_type,
        discount_value: voucher?.discount_value,
      },
    });
  } catch (error) {
    console.error("VALIDATE_VOUCHER_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan sistem." },
      { status: 500 },
    );
  }
}
