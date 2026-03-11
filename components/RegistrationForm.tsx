"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  namaKtp: string;
  fullName: string;
  nik: string;
  institution: string;
  kotaAsal: string;
  email: string;
  phone: string;
  profession: string;
  attendanceType: string;
  paymentMethod: string;
  tourIkn: boolean;
  additionalInfo: string;
};

const initialState: FormState = {
  namaKtp: "",
  fullName: "",
  nik: "",
  institution: "",
  kotaAsal: "",
  email: "",
  phone: "",
  profession: "Dokter Umum",
  attendanceType: "offline",
  paymentMethod: "qris",
  tourIkn: true,
  additionalInfo: "",
};

const PROFESSIONS = [
  "Dokter Spesialis Patologi Klinik",
  "Dokter Spesialis Lainnya",
  "Dokter Umum",
  "ATLM",
];

const PRICING_MAP: Record<string, number> = {
  "Dokter Spesialis Patologi Klinik": 500000,
  "Dokter Spesialis Lainnya": 400000,
  "Dokter Umum": 300000,
  ATLM: 250000,
};

const ATTENDANCE_TYPES = [
  { value: "offline", label: "Luring (Offline)" },
  { value: "online", label: "Daring (Online) Khusus Domisili Luar Balikpapan" },
];

const PAYMENT_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "va_bca", label: "BCA Virtual Account" },
  { value: "va_bri", label: "BRI Virtual Account" },
  { value: "va_mandiri", label: "Mandiri Virtual Account" },
  { value: "va_bni", label: "BNI Virtual Account" },
  { value: "dana", label: "DANA" },
];

export default function RegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nikError, setNikError] = useState<{
    maskedEmail: string;
    registrationCode: string;
  } | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherInfo, setVoucherInfo] = useState<{
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
  } | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [hasActiveVouchers, setHasActiveVouchers] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if there are any active vouchers to determine if we should show the input
    const checkVouchers = async () => {
      try {
        const res = await fetch("/api/vouchers/active");
        if (res.ok) {
          const data = await res.json();
          setHasActiveVouchers(data.length > 0);
        }
      } catch (err) {
        console.error("Error checking vouchers:", err);
      }
    };
    checkVouchers();
  }, []);

  async function handleVoucherCheck() {
    if (!voucherInput) {
      setVoucherInfo(null);
      setVoucherError("");
      return;
    }

    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherInput }),
      });

      const data = await res.json();
      if (res.ok) {
        setVoucherInfo(data.voucher);
        setVoucherError("");
      } else {
        setVoucherInfo(null);
        setVoucherError(data.message || "Kode voucher tidak valid.");
      }
    } catch (err) {
      setVoucherError("Gagal memvalidasi voucher.");
    }
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNikError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          voucherCode: voucherInfo?.code || null,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.errorCode === "NIK_EXISTS") {
        setNikError({
          maskedEmail: data.maskedEmail,
          registrationCode: data.registrationCode,
        });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.message ?? "Gagal mendaftar");
        setLoading(false);
        return;
      }

      router.push(`/payment/${data.registrationCode}`);
    } catch (err) {
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      setLoading(false);
    }
  }

  const currentPrice =
    form.attendanceType === "online"
      ? 50000
      : PRICING_MAP[form.profession] || 250000;

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      {/* Form Header */}
      <div className="form-header">
        <h2>Form Pendaftaran Peserta</h2>
        <p>
          Mohon lengkapi semua informasi dengan benar. Tanda (
          <span style={{ color: "#ffdd57" }}>*</span>) wajib diisi.
        </p>
      </div>

      {/* Form Body */}
      <div className="form-body">
        {/* Nama KTP */}
        <div className="form-group">
          <label>
            Nama KTP <span className="required">*</span>
          </label>
          <input
            name="namaKtp"
            required
            placeholder="Masukkan nama KTP Anda"
            value={form.namaKtp}
            onChange={handleChange}
          />
        </div>

        {/* Nama Lengkap & Gelar */}
        <div className="form-group">
          <label>
            Nama Lengkap &amp; Gelar <span className="required">*</span>
          </label>
          <input
            name="fullName"
            required
            placeholder="Masukkan nama lengkap dan gelar Anda"
            value={form.fullName}
            onChange={handleChange}
          />
        </div>

        {/* NIK */}
        <div className="form-group">
          <label>
            NIK <span className="required">*</span>
          </label>
          <input
            name="nik"
            type="text"
            required
            maxLength={16}
            pattern="\d{16}"
            placeholder="Masukkan 16 digit NIK Anda"
            value={form.nik}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 16);
              setForm({ ...form, nik: val });
            }}
          />
        </div>

        {/* Institusi / Rumah Sakit */}
        <div className="form-group">
          <label>
            Institusi/Rumah Sakit Asal <span className="required">*</span>
          </label>
          <input
            name="institution"
            required
            placeholder="Nama institusi atau rumah sakit"
            value={form.institution}
            onChange={handleChange}
          />
        </div>

        {/* Kota Asal */}
        <div className="form-group">
          <label>
            Kota Asal <span className="required">*</span>
          </label>
          <input
            name="kotaAsal"
            required
            placeholder="Masukkan kota asal Anda"
            value={form.kotaAsal}
            onChange={handleChange}
          />
        </div>

        {/* Email */}
        <div className="form-group">
          <label>
            Alamat Email <span className="required">*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
          />
          <p className="form-hint">
            Mohon cantumkan sesuai email LMS. E-mail ini akan digunakan untuk
            menerima konfirmasi pendaftaran
          </p>
          <p className="form-hint"></p>
        </div>

        {/* WhatsApp */}
        <div className="form-group">
          <label>
            Nomor WhatsApp <span className="required">*</span>
          </label>
          <input
            name="phone"
            required
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={handleChange}
          />
          <p className="form-hint">Gunakan format: 08xxxxxxxxxx atau +62xxx</p>
        </div>

        <div className="grid">
          {/* Kategori/Profesi */}
          <div className="form-group">
            <label>
              Kategori <span className="required">*</span>
            </label>
            <select
              name="profession"
              required
              value={form.profession}
              onChange={handleChange}>
              <option value="" disabled>
                Pilih kategori
              </option>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <p className="form-hint">
              Harga tiket:{" "}
              <b>
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                }).format(currentPrice)}
              </b>
            </p>
          </div>

          {/* Tipe Kehadiran */}
          <div className="form-group">
            <label>
              Tipe Kehadiran <span className="required">*</span>
            </label>
            <select
              name="attendanceType"
              required
              value={form.attendanceType}
              onChange={handleChange}>
              {ATTENDANCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="form-hint">Pilih metode kehadiran Anda</p>
          </div>
        </div>

        {/* Metode Pembayaran */}
        <div className="form-group">
          <label>
            Metode Pembayaran <span className="required">*</span>
          </label>
          <select
            name="paymentMethod"
            required
            value={form.paymentMethod}
            onChange={handleChange}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="form-hint">
            Silahkan mengisi email yang terdaftar di akun Satu Sehat / Plataran
            Sehat
          </p>
        </div>

        {/* Voucher Code */}
        {hasActiveVouchers && (
          <div className="form-group">
            <label>Masukkan Voucher (Jika ada)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="PROMO2024"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                onBlur={handleVoucherCheck}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleVoucherCheck}
                style={{
                  padding: "0 15px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#15803d",
                  fontSize: "13px",
                  cursor: "pointer",
                }}>
                Cek
              </button>
            </div>
            {voucherError && (
              <p
                style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0" }}>
                {voucherError}
              </p>
            )}
            {voucherInfo && (
              <p
                style={{
                  color: "#15803d",
                  fontSize: "12px",
                  margin: "4px 0",
                  fontWeight: "bold",
                }}>
                ✓ Voucher digunakan: Potongan{" "}
                {voucherInfo.discount_type === "percent"
                  ? `${voucherInfo.discount_value}%`
                  : `Rp ${voucherInfo.discount_value.toLocaleString("id-ID")}`}
              </p>
            )}
          </div>
        )}

        {/* Informasi Tambahan */}
        {/* <label className="tour-checkbox-box" htmlFor="tourIkn">
          <input
            id="tourIkn"
            type="checkbox"
            name="tourIkn"
            checked={form.tourIkn}
            onChange={handleChange}
            style={{ width: "20px", height: "20px", minWidth: "20px" }}
          />
          <div className="tour-checkbox-label">
            <strong>
              Ya, saya ingin ikut Tour IKN Nusantara (10 April 2026)
            </strong>
            <span>
              One day trip ke Ibu Kota Nusantara sehari sebelum simposium. Biaya
              terpisah.
            </span>
          </div>
        </label> */}

        {/* Informasi Tambahan */}
        {/* <div className="form-group">
          <label>
            Informasi Tambahan/Pertanyaan
            <span className="optional">(Opsional)</span>
          </label>
          <textarea
            name="additionalInfo"
            placeholder="Apakah ada kebutuhan khusus, alergi makanan, atau pertanyaan?"
            value={form.additionalInfo}
            onChange={handleChange}
          />
        </div> */}

        {/* NIK duplicate error */}
        {nikError && (
          <div
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: "14px 16px",
              fontSize: 14,
              color: "#9a3412",
              lineHeight: 1.6,
            }}>
            <strong>⚠️ NIK sudah terdaftar.</strong>
            <br />
            NIK ini telah digunakan untuk mendaftar sebelumnya. Silakan cek
            email pendaftaran di <strong>{nikError.maskedEmail}</strong> untuk
            melanjutkan pembayaran.
            <br />
            <a
              href={`/payment/${nikError.registrationCode}`}
              style={{
                display: "inline-block",
                marginTop: 8,
                color: "#c2410c",
                fontWeight: 600,
                textDecoration: "underline",
              }}>
              → Buka halaman pembayaran pendaftaran ini
            </a>
          </div>
        )}

        {/* Generic error message */}
        {error && <div className="form-error">⚠️ {error}</div>}

        {/* Submit */}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Memproses..." : "Daftar & Bayar Sekarang →"}
        </button>
      </div>
    </form>
  );
}
