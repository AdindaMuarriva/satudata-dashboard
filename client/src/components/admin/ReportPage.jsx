import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Download, RefreshCw } from "lucide-react";
import { fetchDatasetsMultiPage, pick } from "../../api";

function resolveCategory(dataset) {
  if (dataset?.topik?.nama) return dataset.topik.nama;
  return pick(dataset, ["bidang", "kategori", "topik"], "Lainnya");
}

function resolveOrgName(dataset) {
  if (typeof dataset?.organisasi === "string") return dataset.organisasi;
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "opd", "instansi"], "Tidak diketahui");
}

function resolveYear(dataset) {
  const raw = pick(dataset, ["tahun", "year", "created_at"], "-");
  if (typeof raw === "string") {
    const match = raw.match(/\d{4}/);
    if (match) return match[0];
  }
  return String(raw);
}

function countBy(rows, resolver) {
  const map = new Map();
  rows.forEach((row) => {
    const key = resolver(row) || "Lainnya";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export default function ReportPage({ onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const { rows: data } = await fetchDatasetsMultiPage();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const byCategory = useMemo(() => countBy(rows, resolveCategory), [rows]);
  const byOrg = useMemo(() => countBy(rows, resolveOrgName).slice(0, 8), [rows]);
  const byYear = useMemo(
    () => countBy(rows, resolveYear).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    [rows]
  );

  const maxCategory = Math.max(1, ...byCategory.map(([, count]) => count));
  const maxOrg = Math.max(1, ...byOrg.map(([, count]) => count));
  const maxYear = Math.max(1, ...byYear.map(([, count]) => count));

  function exportCsv() {
    const header = "Judul,Kategori,Organisasi,Tahun\n";
    const body = rows
      .map((row) =>
        [pick(row, ["judul", "title", "name"], "-"), resolveCategory(row), resolveOrgName(row), resolveYear(row)]
          .map(csvEscape)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-dataset-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-content">
      <button type="button" className="back-admin-button" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Dashboard
      </button>

      <div className="page-header">
        <div>
          <h2>Laporan</h2>
          <p>Statistik penggunaan dataset berdasarkan kategori, OPD, dan tahun.</p>
        </div>
        <div className="table-action">
          <button className="btn-outline" onClick={loadData}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn-primary" onClick={exportCsv} disabled={!rows.length}>
            <Download size={18} /> Unduh CSV
          </button>
        </div>
      </div>

      {error && <div className="admin-empty">{error}</div>}

      <section className="admin-stats">
        <div className="stat-box red">
          <h2>{loading ? "..." : rows.length}</h2>
          <span>Total Dataset</span>
        </div>
        <div className="stat-box blue">
          <h2>{loading ? "..." : byOrg.length}</h2>
          <span>OPD Kontributor</span>
        </div>
        <div className="stat-box green">
          <h2>{loading ? "..." : byCategory.length}</h2>
          <span>Kategori</span>
        </div>
        <div className="stat-box orange">
          <h2>{loading ? "..." : byYear.length}</h2>
          <span>Rentang Tahun</span>
        </div>
      </section>

      <section className="admin-card">
        <div className="card-header">
          <h2><BarChart3 size={18} /> Dataset per Kategori</h2>
        </div>
        <div className="report-bars">
          {!loading && byCategory.length === 0 && <div className="admin-empty">Belum ada data.</div>}
          {byCategory.map(([label, count]) => (
            <div className="report-bar-row" key={label}>
              <span className="report-bar-label">{label}</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: `${(count / maxCategory) * 100}%` }} />
              </div>
              <span className="report-bar-value">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="card-header">
          <h2><BarChart3 size={18} /> Dataset per OPD (Top 8)</h2>
        </div>
        <div className="report-bars">
          {!loading && byOrg.length === 0 && <div className="admin-empty">Belum ada data.</div>}
          {byOrg.map(([label, count]) => (
            <div className="report-bar-row" key={label}>
              <span className="report-bar-label">{label}</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: `${(count / maxOrg) * 100}%` }} />
              </div>
              <span className="report-bar-value">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <div className="card-header">
          <h2><BarChart3 size={18} /> Dataset per Tahun</h2>
        </div>
        <div className="report-bars">
          {!loading && byYear.length === 0 && <div className="admin-empty">Belum ada data.</div>}
          {byYear.map(([label, count]) => (
            <div className="report-bar-row" key={label}>
              <span className="report-bar-label">{label}</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: `${(count / maxYear) * 100}%` }} />
              </div>
              <span className="report-bar-value">{count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}