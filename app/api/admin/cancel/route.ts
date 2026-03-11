import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelRegistration } from "@/lib/registrations";
import { getLoggedInAdminId } from "@/lib/auth";

const bodySchema = z.object({
  code: z.string().min(5),
});

// Verify HMAC-SHA256 signature sent by the client
async function verifySignature(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  try {
    const secret = process.env.NEXT_PUBLIC_ADMIN_SIGN_SECRET ?? "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody),
    );
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    // Constant-time comparison
    if (expectedHex.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < expectedHex.length; i++) {
      diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const adminId = await getLoggedInAdminId();
    if (!adminId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") ?? "";

    const valid = await verifySignature(rawBody, signature);
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid signature." },
        { status: 403 },
      );
    }

    const { code } = bodySchema.parse(JSON.parse(rawBody));

    const registration = await cancelRegistration(code);
    if (!registration) {
      return NextResponse.json(
        { message: "Registrasi tidak ditemukan atau gagal dibatalkan." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Pendaftaran berhasil dibatalkan." });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal membatalkan pendaftaran." },
      { status: 400 },
    );
  }
}
