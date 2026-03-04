import { getLoggedInAdminId } from "@/lib/auth";
import { getAllRegistrations, getTransactions } from "@/lib/registrations";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminTable from "@/components/AdminTable";
import WhitelistManager from "@/components/WhitelistManager";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const adminId = await getLoggedInAdminId();
  if (!adminId) {
    redirect("/admin/login");
  }

  const registrations = await getAllRegistrations();
  const transactions = await getTransactions();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, #1e3a8a, #1d4ed8, #172554)",
        position: "relative",
        overflow: "hidden",
      }}>
      {/* Wave Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          pointerEvents: "none",
        }}>
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
          viewBox="0 0 1440 320"
          fill="none">
          <path
            d="M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,149.3C672,139,768,117,864,122.7C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            fill="white"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          pointerEvents: "none",
        }}>
        <svg
          style={{ position: "absolute", bottom: 0, right: 0, width: "100%" }}
          viewBox="0 0 1440 320"
          fill="none">
          <path
            d="M0,224L48,213.3C96,203,192,181,288,176C384,171,480,181,576,197.3C672,213,768,235,864,234.7C960,235,1056,213,1152,197.3C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="white"
          />
        </svg>
      </div>

      <div style={{ position: "relative", zIndex: 10 }}>
        <main>
          <section className="hero">
            <h1>Admin Registrasi &amp; Transaksi</h1>
            <p>
              Daftar peserta, data transaksi, resend email, dan export laporan.
            </p>
            <AdminLogoutButton />
          </section>

          <section className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 10,
              }}>
              <h2 style={{ margin: 0 }}>Data Peserta &amp; Transaksi</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="/api/admin/transactions/export/csv">
                  <button
                    type="button"
                    className="secondary"
                    style={{ fontSize: 13, padding: "6px 14px" }}>
                    Export CSV
                  </button>
                </a>
                <a href="/api/admin/transactions/export/xlsx">
                  <button
                    type="button"
                    style={{ fontSize: 13, padding: "6px 14px" }}>
                    Export Excel
                  </button>
                </a>
              </div>
            </div>
            <AdminTable
              registrations={registrations}
              transactions={transactions}
            />

            <WhitelistManager />
          </section>
        </main>
      </div>
    </div>
  );
}
