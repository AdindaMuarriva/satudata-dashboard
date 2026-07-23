import { useEffect, useRef, useState } from "react";
import ListPage from "./ListPage";
import DetailPage from "./Detailpage";
import OrgPage from "./OrgPage";
import AllOrgsPage from "./AllOrgsPage";
import TopicPage from "./TopicPage";
import FeaturePage from "./FeaturePage";
import SearchResultsPage from "./SearchResultsPage";
import ComparePage from "./ComparePage";
import MasyarakatDashboardPage from "./MasyarakatDashboardPage";
import AgricultureDashboardPage from "./AgricultureDashboardPage";
import SocialDashboardPage from "./SocialDashboardPage";
import InfrastructureDashboardPage from "./InfrastructureDashboardPage";
import AuthGate from "./components/AuthGate";
import AdminPage from "./components/AdminPage";
import { supabase } from "./lib/supabase";
import { createActivityLog } from "./api/activity";

// Baca sesi admin langsung (tanpa mount AuthGate) — cuma dipakai buat
// nampilin bar kecil "Login sebagai admin" pas admin lagi liat-liat
// halaman publik. Ini BUKAN pintu keamanan, cuma info tampilan biasa.
export default function App() {
  const tooltipRef = useRef(null);
  const [authNotice, setAuthNotice] = useState("");
  const [adminSession, setAdminSession] = useState(null);
  useEffect(() => {
    try {
      const notice = window.sessionStorage.getItem("satudata_auth_notice");
      if (notice) {
        window.sessionStorage.removeItem("satudata_auth_notice");
        setAuthNotice(notice);
        const timer = window.setTimeout(() => setAuthNotice(""), 4200);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // Storage may be unavailable in private/restricted browser contexts.
    }
  }, []);

  useEffect(() => {
    const setSession = (session) => setAdminSession(session?.user ?? null);

    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));

    return () => subscription.unsubscribe();
  }, []);
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
    <InfrastructureDashboardPage />
  ) : page === "dashboard-pertanian" ? (
    <AgricultureDashboardPage />
  ) : page === "dashboard-pertanian-pertanyaan" ? (
    <AgricultureDashboardPage />
  ) : page === "dashboard-sosial" ? (
    <SocialDashboardPage />
  ) : page === "dashboard-statistik" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="statistik" />
  ) : page === "dashboard-lingkungan" ? (
    <MasyarakatDashboardPage tooltipRef={tooltipRef} theme="lingkungan" />
  ) : org ? (
    <OrgPage orgName={org} tooltipRef={tooltipRef} />
  ) : (
    <ListPage tooltipRef={tooltipRef} />
  );

  async function handleLogoutFromPublicBar() {
    void createActivityLog("Logout", "Admin keluar dari sistem.").catch(() => {});
    const { error } = await supabase.auth.signOut();
    if (error) return;

    window.sessionStorage.setItem("satudata_auth_notice", "Anda berhasil logout dari area admin.");
    window.location.reload();
  }

  return (
    <div className="wrap">
      {authNotice && <div className="auth-toast" role="status">{authNotice}</div>}
      {adminSession && (
        <div className="admin-bar">
          <span>Login sebagai admin: {adminSession.user_metadata?.full_name || adminSession.email || "Admin"}</span>
          <a href="?page=admin" className="admin-logout">Ke Panel Admin</a>
          <button type="button" className="admin-logout" onClick={handleLogoutFromPublicBar}>Logout</button>
        </div>
      )}
      {publicPageContent}
      <div className="tooltip" ref={tooltipRef}></div>
    </div>
  );
}
