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
  attendanceType: "online",
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
  const [isClosed, setIsClosed] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/registrations/status");
        if (res.ok) {
          const data = await res.json();
          setIsClosed(data.isClosed);
        }
      } catch (err) {
        console.error("Error checking status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

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

    checkStatus();
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

  if (checkingStatus) {
    return (
      <div className="form-card" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ color: "#64748b" }}>Memuat status pendaftaran...</p>
      </div>
    );
  }

  if (isClosed) {
    return (
      <div className="form-card" style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>🔒</div>
        <h2 style={{ color: "#1e3a8a", fontSize: "24px", fontWeight: 800, marginBottom: "15px" }}>
          REGISTRASI DITUTUP
        </h2>
        <p style={{ color: "#64748b", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto" }}>
          Mohon maaf, batas kuota pendaftaran telah tercapai dan pendaftaran resmi ditutup. 
          Terima kasih atas antusiasme Anda.
        </p>
        <div style={{ marginTop: "30px" }}>
          <button 
            onClick={() => router.push("/")}
            style={{ 
              padding: "12px 30px", 
              borderRadius: "10px", 
              fontWeight: 700,
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#475569",
              cursor: "pointer"
            }}
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const currentPrice =
    form.attendanceType === "online"
      ? 50000
      : PRICING_MAP[form.profession] || 250000;

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <h2>Form Pendaftaran Peserta</h2>
        <p>
          Mohon lengkapi semua informasi dengan benar. Tanda (
          <span style={{ color: "#ffdd57" }}>*</span>) wajib diisi.
        </p>
      </div>

      <div className="form-body">
        <div className="form-group">
          <label>Nama KTP <span className="required">*</span></label>
          <input
            name="namaKtp"
            required
            placeholder="Masukkan nama KTP Anda"
            value={form.namaKtp}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Nama Lengkap &amp; Gelar <span className="required">*</span></label>
          <input
            name="fullName"
            required
            placeholder="Masukkan nama lengkap dan gelar Anda"
            value={form.fullName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>NIK <span className="required">*</span></label>
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

        <div className="form-group">
          <label>Institusi/Rumah Sakit Asal <span className="required">*</span></label>
          <input
            name="institution"
            required
            placeholder="Nama institusi atau rumah sakit"
            value={form.institution}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Kota Asal <span className="required">*</span></label>
          <input
            name="kotaAsal"
            required
            placeholder="Masukkan kota asal Anda"
            value={form.kotaAsal}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Alamat Email <span className="required">*</span></label>
          <input
            type="email"
            name="email"
            required
            placeholder="nama@email.com"
            value={form.email}
            onChange={handleChange}
          />
          <p className="form-hint">Mohon cantumkan sesuai email LMS (Satu Sehat/Plataran Sehat).</p>
        </div>

        <div className="form-group">
          <label>Nomor WhatsApp <span className="required">*</span></label>
          <input
            name="phone"
            required
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="grid">
          <div className="form-group">
            <label>Kategori <span className="required">*</span></label>
            <select name="profession" required value={form.profession} onChange={handleChange}>
              <option value="" disabled>Pilih kategori</option>
              {PROFESSIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Tipe Kehadiran <span className="required">*</span></label>
            <select name="attendanceType" required value={form.attendanceType} onChange={handleChange}>
              {ATTENDANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Metode Pembayaran <span className="required">*</span></label>
          <select name="paymentMethod" required value={form.paymentMethod} onChange={handleChange}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {hasActiveVouchers && (
          <div className="form-group">
            <label>Masukkan Voucher (Jika ada)</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="PROMO2024"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleVoucherCheck}
                style={{
                  padding: "0 15px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#15803d",
                  color: "#fff",
                  fontSize: "13px",
                  cursor: "pointer",
                }}>
                Cek
              </button>
            </div>
            {voucherError && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0" }}>{voucherError}</p>}
            {voucherInfo && <p style={{ color: "#15803d", fontSize: "12px", margin: "4px 0", fontWeight: "bold" }}>✓ Voucher digunakan.</p>}
          </div>
        )}

        {nikError && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 16px", fontSize: 14, color: "#9a3412", marginBottom: 15 }}>
            <strong>⚠️ NIK sudah terdaftar.</strong>
            <br />
            Silakan cek email di <strong>{nikError.maskedEmail}</strong> atau <a href={`/payment/${nikError.registrationCode}`} style={{ color: "#c2410c", fontWeight: 600 }}>klik di sini</a>.
          </div>
        )}

        {error && <div className="form-error">⚠️ {error}</div>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Memproses..." : "Daftar & Bayar Sekarang →"}
        </button>
      </div>
    </form>
  );
}
