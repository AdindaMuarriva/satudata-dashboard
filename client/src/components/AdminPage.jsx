import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Database,
  Building2,
  Users,
  Info,
  LogOut,
  Trash2,
} from "lucide-react";
import { CONFIG, fetchJSON, getLocalDatasets, pick } from "../api";
import { getDatasets } from "../api/dataset";
import { getAdmins } from "../api/admin";
import Dashboard from "./admin/Dashboard";
import DatasetPage from "./admin/DatasetPage";
import OPDPage from "./admin/OPDPage";
import UserPage from "./admin/UserPage";
import SettingPage from "./admin/SettingPage";
import AddDatasetPage from "./admin/AddDatasetPage";
import EditDatasetPage from "./admin/EditDatasetPage";
import RecentDatasetsPage from "./admin/RecentDatasetsPage";
import ReportPage from "./admin/ReportPage";
import TrashPage from "./admin/TrashPage";

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
  return dataset?.is_active === false ? "Nonaktif" : "Aktif";
}

export default function AdminPage({ user, onLogout }) {
  const [datasets, setDatasets] = useState([]);
  const [stats, setStats] = useState({ totalDatasets: 0, organizationCount: 0, adminCount: 0, activeYear: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [editDatasetUuid, setEditDatasetUuid] = useState(null);
  const [editReturnPage, setEditReturnPage] = useState("dataset");

  function handleDatasetSaved() {
    const newestDataset = getLocalDatasets()[0];
    if (newestDataset) {
      setDatasets(current => [newestDataset, ...current.filter(item => item.uuid !== newestDataset.uuid)].slice(0, 8));
      setStats(current => ({ ...current, totalDatasets: current.totalDatasets + 1 }));
    }
    setActivePage("dashboard");
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [{ rows, totalCount }, organizationsJson, admins] = await Promise.all([
          getDatasets(),
          fetchJSON(CONFIG.endpoints.organizations).catch(() => []),
          getAdmins(),
        ]);

        if (!mounted) return;

        const dataRows = Array.isArray(rows) ? rows : [];
        const orgNames = [...new Set(dataRows.map(resolveOrgName).filter((name) => name && name !== "—"))].sort();
        const years = dataRows.map(resolveYear).filter((year) => year && year !== "—").map((year) => Number(year)).filter((year) => !Number.isNaN(year));

        setDatasets(dataRows.slice(0, 8));
        setStats({
          totalDatasets: totalCount || dataRows.length,
          organizationCount: orgNames.length || (Array.isArray(organizationsJson) ? organizationsJson.length : 0),
          adminCount: admins.length,
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

    const handleUpdate = () => {
      load();
    };

    window.addEventListener("satudata-local-datasets-updated", handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("satudata-local-datasets-updated", handleUpdate);
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
            className={`sidebar-item ${activePage === "trash" ? "active" : ""}`}
            onClick={() => setActivePage("trash")}
          >
            <Trash2 size={20} />
            Tempat Sampah
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
            Informasi Admin
          </button>

          <button
            className={`sidebar-item ${activePage === "settings" ? "active" : ""}`}
            onClick={() => setActivePage("settings")}
          >
            <Info size={20} />
            Tentang Sistem
          </button>

        </nav>

        <button className="sidebar-logout" style={{ marginTop: 28 }} onClick={onLogout}>
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
            onAddDataset={() => setActivePage("add-dataset")}
            onImportCsv={() => setActivePage("import-csv")}
            onManageDatasets={() => setActivePage("dataset")}
            onViewRecentDatasets={() => setActivePage("recent-datasets")}
            onViewReport={() => setActivePage("report")}
          />
        )}

        {activePage === "recent-datasets" && (
          <RecentDatasetsPage
            onBack={() => setActivePage("dashboard")}
            onEditDataset={(uuid) => {
              setEditDatasetUuid(uuid);
              setEditReturnPage("recent-datasets");
              setActivePage("edit-dataset");
            }}
          />
        )}

        {activePage === "report" && <ReportPage onBack={() => setActivePage("dashboard")} />}

        {activePage === "dataset" && (
          <DatasetPage
            onAddDataset={() => setActivePage("add-dataset")}
            onEditDataset={(uuid) => {
              setEditDatasetUuid(uuid);
              setEditReturnPage("dataset");
              setActivePage("edit-dataset");
            }}
          />
        )}
        {activePage === "trash" && <TrashPage />}
        {activePage === "edit-dataset" && (
          <EditDatasetPage
            uuid={editDatasetUuid}
            onBack={() => setActivePage(editReturnPage)}
          />
        )}
        {activePage === "add-dataset" && <AddDatasetPage onBack={() => setActivePage("dashboard")} onSaved={handleDatasetSaved} />}
        {activePage === "import-csv" && <AddDatasetPage mode="csv" onBack={() => setActivePage("dashboard")} onSaved={handleDatasetSaved} />}
        {activePage === "opd" && <OPDPage />}
        {activePage === "user" && <UserPage />}
        {activePage === "settings" && <SettingPage />}

      </main>

    </div>
  );
}
