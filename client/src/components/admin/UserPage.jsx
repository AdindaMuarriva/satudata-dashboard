// INFORMASI ADMIN PAGE

import { useEffect, useState } from "react";
import { Activity, CalendarDays, RefreshCw, Users } from "lucide-react";
import { getAdmins } from "../../api/admin";
import { getActivityLogs } from "../../api/activity";

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function UserPage() {
  const [admins, setAdmins] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminInformation() {
    setLoading(true);
    setError("");

    const [adminsResult, logsResult] = await Promise.allSettled([
      getAdmins(),
      getActivityLogs(),
    ]);

    const nextAdmins = adminsResult.status === "fulfilled" && Array.isArray(adminsResult.value)
      ? adminsResult.value
      : [];
    const nextLogs = logsResult.status === "fulfilled" && Array.isArray(logsResult.value)
      ? logsResult.value
      : [];

    setAdmins(nextAdmins);
    setActivityLogs(nextLogs);

    if (adminsResult.status === "rejected" || logsResult.status === "rejected") {
      setError("Sebagian informasi admin atau aktivitas tidak dapat dimuat.");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAdminInformation();
  }, []);

  const lastActivity = activityLogs[0];

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h2>Informasi Admin</h2>
          <p>Ringkasan administrator terdaftar dan riwayat aktivitas pada sistem.</p>
        </div>
        <button className="btn-outline" onClick={loadAdminInformation}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <section className="admin-stats">
        <div className="stat-box red">
          <h2>{loading ? "..." : admins.length}</h2>
          <span>Total Admin Terdaftar</span>
        </div>
        <div className="stat-box blue">
          <h2>{loading ? "..." : activityLogs.length}</h2>
          <span>Total Aktivitas</span>
        </div>
        <div className="stat-box green">
          <h2>{loading ? "..." : lastActivity ? formatDate(lastActivity.created_at) : "-"}</h2>
          <span>Aktivitas Terakhir</span>
        </div>
      </section>

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Aktivitas</th>
              <th>Deskripsi</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Memuat aktivitas...</td></tr>}
            {!loading && error && <tr><td colSpan={4} className="admin-empty">{error}</td></tr>}
            {!loading && activityLogs.map((log) => (
              <tr key={log.id}>
                <td><Users size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />{log.admin_name || "Admin"}</td>
                <td><Activity size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />{log.activity}</td>
                <td>{log.description || "-"}</td>
                <td><CalendarDays size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />{formatDate(log.created_at)}</td>
              </tr>
            ))}
            {!loading && !error && activityLogs.length === 0 && <tr><td colSpan={4} className="admin-empty">Belum ada aktivitas admin yang tercatat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
