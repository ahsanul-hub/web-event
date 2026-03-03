const crypto = require("crypto");
const fs = require("fs");

const envData = fs
  .readFileSync(".env", "utf8")
  .split("\n")
  .reduce((acc, line) => {
    const [key, ...vals] = line.split("=");
    if (key && vals.length)
      acc[key.trim()] = vals.join("=").replace(/^"|"$/g, "").trim();
    return acc;
  }, {});

function generateBodySign(payload, appSecret) {
  const payloadJson = JSON.stringify(payload).replace(/\\\//g, "/");
  const hash = crypto
    .createHmac("sha256", appSecret)
    .update(payloadJson)
    .digest();
  let bodysign = hash.toString("base64");
  return bodysign.replace(/\+/g, "-").replace(/\//g, "_");
}

async function test() {
  const APP_URL = envData.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const REG_CODE = "PATKLIN-2026-TESTFIX";

  const payload = {
    redirect_url: `${APP_URL}/success`,
    user_id: `USER-99`,
    user_mdn: "08212345678",
    merchant_transaction_id: REG_CODE,
    payment_method: "qris",
    currency: "IDR",
    amount: 250000,
    item_name: "PAYMENT",
    customer_name: "ATLM Test",
    notification_url: `${APP_URL}/api/webhook/redpay`,
  };

  const bodysign = generateBodySign(payload, envData.REDPAY_APP_SECRET);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  const res = await fetch(envData.REDPAY_API_URL + "/api/create", {
    method: "POST",
    headers: {
      appkey: envData.REDPAY_APP_KEY,
      appid: envData.REDPAY_APP_ID,
      bodysign,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const data = JSON.parse(text);

  console.log("\nRedpay Response:", JSON.stringify(data, null, 2));

  if (data.success === true && data.data?.token) {
    const paymentUrl = `${envData.REDPAY_API_URL}/api/order/${envData.REDPAY_APP_ID}/${data.data.token}`;
    console.log("\n✅ Payment URL generated successfully:");
    console.log(paymentUrl);
  } else {
    console.log("\n❌ Token not found in response:", data);
  }
}

test();
