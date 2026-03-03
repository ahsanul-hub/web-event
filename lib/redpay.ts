export async function generateBodySign(
  payload: any,
  appSecret: string,
): Promise<string> {
  const crypto = await import("node:crypto");
  // Redpay expects JSON string without escaped slashes if any
  const payloadJson = JSON.stringify(payload).replace(/\\\//g, "/");

  // HMAC-SHA256
  const hash = crypto
    .createHmac("sha256", appSecret)
    .update(payloadJson)
    .digest();

  // Base64 + URL safe
  let bodysign = hash.toString("base64");
  bodysign = bodysign.replace(/\+/g, "-").replace(/\//g, "_");

  return bodysign;
}

/**
 * createRedpayOrder
 * Memanggil API Redpay untuk membuat order/token pembayaran.
 * Mendukung renewal dengan parameter transactionId unik.
 */
export async function createRedpayOrder(
  registration: {
    id: number;
    full_name: string;
    phone: string;
    registration_code: string;
  },
  amount: number = 10000,
  paymentMethod: string = "qris",
  transactionId?: string,
): Promise<string> {
  const REDPAY_API_URL =
    process.env.REDPAY_API_URL || "https://sandbox-payment.redision.com";
  const REDPAY_APP_KEY = process.env.REDPAY_APP_KEY;
  const REDPAY_APP_ID = process.env.REDPAY_APP_ID;
  const REDPAY_APP_SECRET = process.env.REDPAY_APP_SECRET;

  if (!REDPAY_APP_KEY || !REDPAY_APP_ID || !REDPAY_APP_SECRET) {
    throw new Error(
      "Konfigurasi Redpay (APP_KEY, APP_ID, APP_SECRET) belum diatur di .env",
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Use the provided transactionId or fall back to the registration code
  const merchantTxId = transactionId ?? registration.registration_code;

  // Define Request Payload
  const payload = {
    redirect_url: `${appUrl}/success`,
    user_id: `USER-${registration.id}`,
    user_mdn: registration.phone || "-",
    merchant_transaction_id: merchantTxId,
    payment_method: paymentMethod,
    currency: "IDR",
    amount: amount,
    item_name: "PAYMENT",
    customer_name: registration.full_name,
    notification_url: `${appUrl}/api/webhook/redpay`,
  };

  const bodysign = await generateBodySign(payload, REDPAY_APP_SECRET);

  console.log("REDPAY REQUEST PAYLOAD:", JSON.stringify(payload, null, 2));

  const response = await fetch(`${REDPAY_API_URL}/api/create`, {
    method: "POST",
    headers: {
      appkey: REDPAY_APP_KEY,
      appid: REDPAY_APP_ID,
      bodysign: bodysign,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  console.log("REDPAY RAW RESPONSE:", rawText);
  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error(
      "Redpay API returned unparseable text. Status:",
      response.status,
      "Text:",
      rawText,
    );
    throw new Error(
      `Redpay merespon dengan format yang salah (Status ${response.status}). Cek API Key/URL.`,
    );
  }

  // CRITICAL FIX: Redpay uses data.success (boolean), not data.status
  if (!response.ok || data.success !== true) {
    console.error("Redpay API Error:", data);
    throw new Error(
      data.message || `Gagal membuat pembayaran (Status ${response.status})`,
    );
  }

  console.log(
    "Redpay payment URL:",
    `${REDPAY_API_URL}/api/order/${REDPAY_APP_ID}/${data.data.token}`,
  );

  if (data.data && data.data.token) {
    // All payment gateways via Redpay V1 return a token for redirection to the frontend payment page.
    return `${REDPAY_API_URL}/api/order/${REDPAY_APP_ID}/${data.data.token}`;
  }

  console.error("Unexpected Redpay Response structure (Expected token):", data);
  throw new Error("Respon Redpay tidak menyertakan Payment Token valid");
}
