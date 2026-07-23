import { useRef } from "react";
import ListPage from "./ListPage";
import DetailPage from "./Detailpage";
import OrgPage from "./OrgPage";
import AllOrgsPage from "./AllOrgsPage";
import TopicPage from "./TopicPage";
import FeaturePage from "./FeaturePage";
import SearchResultsPage from "./SearchResultsPage";
import ComparePage from "./ComparePage";
import GenericQuestionDashboard from "./GenericQuestionDashboard";
import AgricultureDashboardPage from "./AgricultureDashboardPage";
import SocialDashboardPage from "./SocialDashboardPage";
import InfrastructureDashboardPage from "./InfrastructureDashboardPage";
import AuthGate from "./components/AuthGate";
import AdminPage from "./components/AdminPage";
import { isEducationRelevant, isEnvironmentRelevant, isHealthRelevant, isStatisticsRelevant, isThemeRelevant } from "./api";

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
    <GenericQuestionDashboard themeLabel="masyarakat" title="Dashboard Analisis Masyarakat Aceh" filterDataset={isThemeRelevant} analysisLabel="ANALISIS MASYARAKAT" />
  ) : page === "dashboard-kesehatan" ? (
    <GenericQuestionDashboard themeLabel="kesehatan" title="Dashboard Analisis Kesehatan Aceh" filterDataset={isHealthRelevant} analysisLabel="ANALISIS KESEHATAN" />
  ) : page === "dashboard-pendidikan" ? (
    <GenericQuestionDashboard themeLabel="pendidikan" title="Dashboard Analisis Pendidikan Aceh" filterDataset={isEducationRelevant} analysisLabel="ANALISIS PENDIDIKAN" />
  ) : page === "dashboard-infrastruktur" ? (
    <InfrastructureDashboardPage />
  ) : page === "dashboard-pertanian" ? (
    <AgricultureDashboardPage />
  ) : page === "dashboard-pertanian-pertanyaan" ? (
    <AgricultureDashboardPage />
  ) : page === "dashboard-sosial" ? (
    <SocialDashboardPage />
  ) : page === "dashboard-statistik" ? (
    <GenericQuestionDashboard themeLabel="statistik" title="Dashboard Analisis Statistik Aceh" filterDataset={isStatisticsRelevant} analysisLabel="ANALISIS STATISTIK" />
  ) : page === "dashboard-lingkungan" ? (
    <GenericQuestionDashboard themeLabel="lingkungan hidup" title="Dashboard Analisis Lingkungan Hidup Aceh" filterDataset={isEnvironmentRelevant} analysisLabel="ANALISIS LINGKUNGAN" />
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
