import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Database,
  Building2,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { CONFIG, fetchDatasetsMultiPage, fetchJSON, pick } from "../api";
import Dashboard from "./admin/Dashboard";
import DatasetPage from "./admin/DatasetPage";
import OPDPage from "./admin/OPDPage";
import UserPage from "./admin/UserPage";
import SettingPage from "./admin/SettingPage";

function readAdminCount() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("satudata_admin_accounts");
    const accounts = raw ? JSON.parse(raw) : [];
    return accounts.filter((account) => account.role === "admin").length;
  } catch {
    return 0;
  }
}

function resolveTitle(dataset) {
  return pick(dataset, ["judul", "name", "title"], "Dataset tanpa judul");
}

function resolveOrgName(dataset) {
  if (typeof dataset?.organisasi === "string") return dataset.organisasi;
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "opd", "instansi"], "—");
}

function resolveYear(dataset) {
  const raw = pick(dataset, ["tahun", "year", "created_at", "updated_at"], "—");
  if (raw === "—") return "—";
  if (typeof raw === "string") {
    const match = raw.match(/\d{4}/);
    return match ? match[0] : raw;
  }
  return String(raw);
}

function resolveStatus(dataset) {
  return dataset?.deleted_at || dataset?.deletedAt ? "Draft" : "Aktif";
}

export default function AdminPage({ user, onLogout }) {
  const [datasets, setDatasets] = useState([]);
  const [stats, setStats] = useState({ totalDatasets: 0, organizationCount: 0, adminCount: 0, activeYear: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [{ rows, totalCount }, organizationsJson] = await Promise.all([
          fetchDatasetsMultiPage(),
          fetchJSON(CONFIG.endpoints.organizations).catch(() => []),
        ]);

        if (!mounted) return;

        const dataRows = Array.isArray(rows) ? rows : [];
        const orgNames = [...new Set(dataRows.map(resolveOrgName).filter((name) => name && name !== "—"))].sort();
        const years = dataRows.map(resolveYear).filter((year) => year && year !== "—").map((year) => Number(year)).filter((year) => !Number.isNaN(year));

        setDatasets(dataRows.slice(0, 8));
        setStats({
          totalDatasets: totalCount || dataRows.length,
          organizationCount: orgNames.length || (Array.isArray(organizationsJson) ? organizationsJson.length : 0),
          adminCount: readAdminCount(),
          activeYear: years.length ? Math.max(...years) : new Date().getFullYear(),
        });
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Gagal memuat data dari API");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <aside className="admin-sidebar">

        <div className="sidebar-brand">
          <img
            src="/logo-aceh.png"
            alt="Logo"
          />
          <div>
            <h3>SatuData</h3>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-menu">

          <button
            className={`sidebar-item ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button
            className={`sidebar-item ${activePage === "dataset" ? "active" : ""}`}
            onClick={() => setActivePage("dataset")}
          >
            <Database size={20} />
            Dataset
          </button>

          <button
            className={`sidebar-item ${activePage === "opd" ? "active" : ""}`}
            onClick={() => setActivePage("opd")}
          >
            <Building2 size={20} />
            OPD
          </button>

          <button
            className={`sidebar-item ${activePage === "user" ? "active" : ""}`}
            onClick={() => setActivePage("user")}
          >
            <Users size={20} />
            Pengguna
          </button>

          <button
            className={`sidebar-item ${activePage === "settings" ? "active" : ""}`}
            onClick={() => setActivePage("settings")}
          >
            <Settings size={20} />
            Pengaturan
          </button>

        </nav>

        <button className="sidebar-logout" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>

      </aside>

      {/* Main */}
      <main className="admin-main">

        {/* Header */}

        <div className="admin-topbar">

          <div>
            <p className="admin-title-small">
              Selamat Datang
            </p>

            <h1>
              Halo, {user?.fullName || "Administrator"}
            </h1>
          </div>

          <div className="admin-user">

            <div className="avatar">
              {(user?.fullName || "A")[0]}
            </div>

            <div>
              <strong>{user?.fullName}</strong>
              <span>Administrator</span>
            </div>

          </div>

        </div>

        {activePage === "dashboard" && (
          <Dashboard
            loading={loading}
            stats={stats}
            datasets={datasets}
            error={error}
            resolveTitle={resolveTitle}
            resolveOrgName={resolveOrgName}
            resolveYear={resolveYear}
            resolveStatus={resolveStatus}
          />
        )}

        {activePage === "dataset" && <DatasetPage />}
        {activePage === "opd" && <OPDPage />}
        {activePage === "user" && <UserPage />}
        {activePage === "settings" && <SettingPage />}

      </main>

    </div>
  );
}