"use client";

import { useState } from "react";
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
  { value: "online", label: "Daring (Online)" },
];

const PAYMENT_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "va_bca", label: "BCA Virtual Account" },
  { value: "va_bri", label: "BRI Virtual Account" },
  { value: "va_mandiri", label: "Mandiri Virtual Account" },
  { value: "va_bni", label: "BNI Virtual Account" },
  { value: "va_permata", label: "Permata Virtual Account" },
  { value: "va_sinarmas", label: "Sinarmas Virtual Account" },
  { value: "gopay", label: "GoPay" },
  { value: "dana", label: "DANA" },
];

export default function RegistrationForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
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

  const currentPrice = PRICING_MAP[form.profession] || 250000;

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

        {/* Tour IKN Checkbox */}
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
        <div className="form-group">
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
        </div>

        {/* Error message */}
        {error && <div className="form-error">⚠️ {error}</div>}

        {/* Submit */}
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Memproses..." : "Daftar & Bayar Sekarang →"}
        </button>
      </div>
    </form>
  );
}
