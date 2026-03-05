import { NextResponse } from "next/server";
import { getLoggedInAdminId } from "@/lib/auth";
import { updateVoucher, deleteVoucher } from "@/lib/vouchers";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    const body = await req.json();
    const updated = await updateVoucher(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("ADMIN_UPDATE_VOUCHER_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal update voucher" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    await deleteVoucher(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN_DELETE_VOUCHER_ERROR:", error);
    return NextResponse.json(
      { message: "Gagal menghapus voucher" },
      { status: 500 },
    );
  }
}
