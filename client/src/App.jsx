import { useRef } from "react";
import ListPage from "./ListPage";
import DetailPage from "./Detailpage";
import OrgPage from "./OrgPage";
import AllOrgsPage from "./AllOrgsPage";
import TopicPage from "./TopicPage";
import FeaturePage from "./FeaturePage";
import SearchResultsPage from "./SearchResultsPage";
import ComparePage from "./ComparePage";
import MasyarakatDashboardPage from "./MasyarakatDashboardPage";
import AuthGate from "./components/AuthGate";
import AdminPage from "./components/AdminPage";

const SESSION_KEY = "satudata_admin_session";

// Baca sesi admin langsung (tanpa mount AuthGate) — cuma dipakai buat
// nampilin bar kecil "Login sebagai admin" pas admin lagi liat-liat
// halaman publik. Ini BUKAN pintu keamanan, cuma info tampilan biasa.
function readAdminSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.role === "admin" ? session : null;
  } catch {
    return null;
  }
}

export default function App() {
  const tooltipRef = useRef(null);
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get("dataset");
  const org = params.get("org");
  const page = params.get("page");
  const topic = params.get("topic");
  const feature = params.get("feature");
  const query = params.get("query");
  const datasets = params.get("datasets");

  const isAdminRoute = page === "admin" || params.get("admin") === "1";

  // Jalur admin: HANYA di sini AuthGate dipasang. Kalau belum login,
  // AuthGate nampilin form login/register. Kalau sudah, baru AdminPage.
  if (isAdminRoute) {
    return (
      <AuthGate>
        {({ user, onLogout }) => <AdminPage user={user} onLogout={onLogout} />}
      </AuthGate>
    );
  }

  // Semua jalur publik di bawah ini TIDAK PERNAH melewati AuthGate —
  // siapapun (login atau tidak) selalu bisa mengaksesnya.
  const publicPageContent = uuid ? (
    <DetailPage uuid={uuid} tooltipRef={tooltipRef} />
  ) : page === "all-orgs" ? (
    <AllOrgsPage />
  ) : page === "topic" ? (
    <TopicPage topicName={topic || "Semua"} />
  ) : page === "feature" ? (
    <FeaturePage featureName={feature || "Dataset"} />
  ) : page === "search" ? (
    <SearchResultsPage query={query || ""} />
  ) : page === "compare" ? (
    <ComparePage datasetIds={datasets ? datasets.split(",").filter(Boolean) : []} tooltipRef={tooltipRef} />
  ) : page === "dashboard-masyarakat" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} />
  ) : page === "dashboard-kesehatan" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="kesehatan" />
  ) : page === "dashboard-pendidikan" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="pendidikan" />
  ) : page === "dashboard-infrastruktur" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="infrastruktur" />
  ) : page === "dashboard-pertanian" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="pertanian" />
  ) : page === "dashboard-sosial" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="sosial" />
  ) : page === "dashboard-statistik" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="statistik" />
  ) : page === "dashboard-lingkungan" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="lingkungan" />
  ) : org ? (
    <OrgPage orgName={org} tooltipRef={tooltipRef} />
  ) : (
    <ListPage tooltipRef={tooltipRef} />
  );

  const adminSession = readAdminSession();

  function handleLogoutFromPublicBar() {
    window.localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }

  return (
    <div className="wrap">
      {adminSession && (
        <div className="admin-bar">
          <span>Login sebagai admin: {adminSession.fullName || "Admin"}</span>
          <a href="?page=admin" className="admin-logout">Ke Panel Admin</a>
          <button type="button" className="admin-logout" onClick={handleLogoutFromPublicBar}>Logout</button>
        </div>
      )}
      {publicPageContent}
      <div className="tooltip" ref={tooltipRef}></div>
    </div>
  );
}
