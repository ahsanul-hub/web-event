import PaymentActions from "@/components/PaymentActions";
import {
  getRegistrationByCode,
  getTransactionByCode,
} from "@/lib/registrations";
import Link from "next/link";

export default async function PaymentPage({
  params,
}: {
  params: { code: string };
}) {
  const registration = await getRegistrationByCode(params.code);
  const transaction = registration
    ? await getTransactionByCode(params.code)
    : null;

  if (!registration) {
    return (
      <div
        className="page-wrapper"
        style={{ textAlign: "center", paddingTop: "100px" }}>
        <div
          className="form-card"
          style={{ maxWidth: "500px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ fontSize: "50px", marginBottom: "20px" }}>🔍</div>
          <h2 style={{ color: "var(--navy)", marginBottom: "16px" }}>
            Transaksi Tidak Ditemukan
          </h2>
          <p
            style={{
              color: "#64748b",
              marginBottom: "30px",
              lineHeight: "1.6",
            }}>
            Maaf, kode registrasi <b>{params.code}</b> tidak ditemukan dalam
            sistem kami. Pastikan kode yang Anda masukkan sudah benar.
          </p>
          <Link href="/">
            <button className="submit-btn" style={{ maxWidth: "200px" }}>
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Hero Header matching Landing Page */}
      <div className="hero-card" style={{ marginBottom: "24px" }}>
        <div
          className="hero-body"
          style={{
            padding: "32px",
            background: "linear-gradient(135deg, #1d4ed8, #22c55e)",
            color: "#fff",
          }}>
          <div>
            <h1
              className="hero-title-navy"
              style={{ color: "#fff", fontSize: "1.8rem" }}>
              Detail Pembayaran
            </h1>
            <p style={{ opacity: 0.9, marginTop: "8px", fontWeight: 500 }}>
              Kode Registrasi:{" "}
              <b style={{ fontSize: "1.1rem" }}>
                {registration.registration_code}
              </b>
            </p>
            <p style={{ opacity: 0.9 }}>Peserta: {registration.full_name}</p>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="form-card">
        <div className="form-header">
          <h2>
            Status:{" "}
            {registration.status === "paid" ? "Lunas" : "Menunggu Pembayaran"}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)" }}>
            Email: {registration.email}
          </p>
        </div>

        <div className="form-body">
          {registration.status !== "paid" ? (
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "1rem",
                  color: "#334155",
                  lineHeight: "1.6",
                  marginBottom: "16px",
                }}>
                Silakan selesaikan pembayaran Anda melalui tombol di bawah ini.
                Status akan diperbarui secara otomatis setelah pembayaran
                berhasil.
              </p>
              <div
                style={{
                  background: "#f1f5f9",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  borderLeft: "4px solid var(--cyan)",
                  fontSize: "0.9rem",
                  color: "#475569",
                }}>
                💡 <b>Tips:</b> Gunakan metode pembayaran yang paling nyaman
                bagi Anda (QRIS, VA, atau E-Wallet).
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#f0fdf4",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                marginBottom: "24px",
                textAlign: "center",
              }}>
              <span
                style={{
                  fontSize: "24px",
                  display: "block",
                  marginBottom: "8px",
                }}>
                ✅
              </span>
              <strong>Pendaftaran Anda telah lunas.</strong>
              <br />
              Terima kasih telah melakukan pembayaran. Silakan cek email Anda
              untuk detail lebih lanjut.
            </div>
          )}

          <PaymentActions
            registration={registration}
            transaction={transaction}
          />

          <div
            style={{
              marginTop: "32px",
              textAlign: "center",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "20px",
            }}>
            <Link
              href="/"
              style={{
                color: "var(--navy)",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}>
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
