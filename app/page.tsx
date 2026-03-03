import RegistrationForm from "@/components/RegistrationForm";

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 relative overflow-hidden"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, #1e3a8a, #1d4ed8, #172554)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Wave Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          pointerEvents: "none",
        }}>
        <svg
          className="absolute top-0 left-0 w-full"
          style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,149.3C672,139,768,117,864,122.7C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            fill="white"
          />
        </svg>
      </div>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          pointerEvents: "none",
        }}>
        <svg
          className="absolute bottom-0 right-0 w-full"
          style={{ position: "absolute", bottom: 0, right: 0, width: "100%" }}
          viewBox="0 0 1440 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,224L48,213.3C96,203,192,181,288,176C384,171,480,181,576,197.3C672,213,768,235,864,234.7C960,235,1056,213,1152,197.3C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="white"
          />
        </svg>
      </div>

      <div
        className="page-wrapper"
        style={{ position: "relative", zIndex: 10 }}>
        {/* ── HERO CARD ─────────────────────────────── */}
        <div className="hero-card">
          {/* Logo bar */}
          <div className="hero-logo-bar">
            {/* Kemenkes logo placeholder */}
            <svg
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <circle cx="22" cy="22" r="22" fill="#008000" />
              <text
                x="50%"
                y="54%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize="8"
                fontWeight="bold"
                fontFamily="Arial">
                Kemenkes
              </text>
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#166534",
                  lineHeight: 1.2,
                }}>
                KEMENTERIAN
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#166534",
                  lineHeight: 1.2,
                }}>
                KESEHATAN
              </span>
              <span
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#166534",
                  lineHeight: 1.2,
                }}>
                REPUBLIK INDONESIA
              </span>
            </div>
            <div className="hero-logo-divider" />
            {/* PDS Patklin logo placeholder */}
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="26"
                cy="26"
                r="25"
                fill="#0f2a83"
                stroke="#ccc"
                strokeWidth="1"
              />
              <text
                x="50%"
                y="42%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="#87d300"
                fontSize="6.5"
                fontWeight="bold"
                fontFamily="Arial">
                PDS
              </text>
              <text
                x="50%"
                y="57%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize="5.5"
                fontWeight="bold"
                fontFamily="Arial">
                PATKLIN
              </text>
            </svg>
            <div className="hero-logo-divider" />
            {/* IDI logo placeholder */}
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="26"
                cy="26"
                r="25"
                fill="#c0392b"
                stroke="#ccc"
                strokeWidth="1"
              />
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
                fontFamily="Arial">
                IDI
              </text>
            </svg>
          </div>

          {/* Main headings */}
          <div className="hero-body">
            <div className="hero-left">
              <h1 className="hero-title-green">
                Simposium Ilmiah dan Pelantikan
              </h1>
              <h2 className="hero-title-navy">
                Pengurus PDS PATKLIN
                <br />
                Regional Borneo
                <br />
                Masa Bakti 2025-2028
              </h2>
            </div>
            <div className="hero-right">
              <p className="hero-theme-text">
                Clinical
                <br />
                Laboratory
                <br />
                Perspectives in
                <br />
                Hematology and
                <br />
                Endocrine Disease
              </p>
            </div>
          </div>

          {/* Badges */}
          <div style={{ position: "relative", height: "80px" }}>
            {/* Tour IKN badge */}
            <div
              style={{
                position: "absolute",
                left: "28px",
                top: "8px",
                background: "#0f2a83",
                color: "#fff",
                padding: "8px 20px 8px 14px",
                clipPath:
                  "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
                fontSize: "0.7rem",
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.3,
                zIndex: 3,
              }}>
              <span
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 900,
                }}>
                "TOUR IKN"
              </span>
              <span>
                Khusus Anggota
                <br />
                PDSPatklin
              </span>
            </div>
            {/* Arrow icon */}
            <div
              style={{
                position: "absolute",
                left: "220px",
                top: "10px",
                color: "#0f2a83",
                fontSize: "1.4rem",
                zIndex: 3,
              }}>
              ✦
            </div>

            {/* SKP Kemenkes badge */}
            <div
              style={{
                position: "absolute",
                right: "-2px",
                top: "4px",
                background: "#87d300",
                color: "#0f2a83",
                padding: "10px 20px 10px 28px",
                clipPath:
                  "polygon(18px 0, 100% 0, 100% 100%, 18px 100%, 0 50%)",
                fontSize: "0.85rem",
                fontWeight: 900,
                textAlign: "center",
                lineHeight: 1.3,
                zIndex: 3,
              }}>
              SKP
              <br />
              Kemenkes
            </div>
          </div>

          {/* Event date / location banner */}
          <div className="event-banner">
            <div className="event-banner-date">
              <div className="day-label">Sabtu</div>
              <div className="day-number">
                <span>11</span>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginLeft: "4px",
                  }}>
                  APRIL
                  <br />
                  2026
                </span>
              </div>
            </div>
            <div className="event-banner-divider" />
            <div className="event-banner-location">
              <div className="venue-name">
                Platinum Hotel &amp; Convention Center
              </div>
              <div className="venue-detail">
                Rhodium 2–7, M Floor · Kota Balikpapan
              </div>
            </div>
          </div>
        </div>

        {/* ── TOUR IKN NOTICE ─────────────────────────── */}
        <div className="tour-notice">
          <div className="tour-notice-icon">🚌</div>
          <div className="tour-notice-text">
            <strong>One Day Trip IKN Nusantara – Jumat, 10 April 2026</strong>
            <p>
              Kesempatan terbatas untuk mengikuti tour IKN Nusantara sehari
              sebelum acara simposium. Termasuk kunjungan ke kawasan IKN, makan
              siang, dan transportasi AC.{" "}
              <strong>Centang opsi di form untuk ikut serta!</strong>
            </p>
          </div>
        </div>

        {/* ── REGISTRATION FORM ───────────────────────── */}
        <RegistrationForm />

        {/* ── ALUR PENDAFTARAN ────────────────────────── */}
        <div className="flow-card">
          <h3>Alur Pendaftaran</h3>
          <ol>
            <li>Isi formulir pendaftaran dengan lengkap dan benar.</li>
            <li>Anda akan diarahkan ke halaman detail pembayaran.</li>
            <li>Lakukan pembayaran melalui tautan yang tersedia.</li>
            <li>
              Setelah status sukses, sistem menampilkan notifikasi cek kode
              registrasi di email.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
