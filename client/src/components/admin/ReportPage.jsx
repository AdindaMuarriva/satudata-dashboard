import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Download, Printer, RefreshCw, Search } from "lucide-react";
import { fetchDatasetsMultiPage, pick } from "../../api";

const TOP_N_CATEGORY = 10;
const TOP_N_ORG = 10;
const UNKNOWN_LABEL = "Tidak diketahui";

// --- Resolver: dicoba beberapa kemungkinan nama field, urutan dari yang paling spesifik ---

function resolveTitle(dataset) {
  return pick(dataset, ["judul", "title", "name"], "Dataset tanpa judul");
}

// Kategori resmi (Kesehatan, Pendidikan, dst) — BUKAN nama sub-bidang/unit kerja.
// "topik.nama" pada data hasil scrape/API pemerintah sering berisi nama sub-unit,
// jadi field itu sengaja diletakkan paling akhir sebagai fallback saja.
function resolveCategory(dataset) {
  const direct = pick(dataset, ["bidang", "kategori", "category"], null);
  if (direct && typeof direct === "string" && direct.trim()) {
    const clean = direct.trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  if (dataset?.topik?.nama) return dataset.topik.nama;
  return UNKNOWN_LABEL;
}

function resolveOrgName(dataset) {
  if (typeof dataset?.organisasi === "string" && dataset.organisasi.trim()) return dataset.organisasi.trim();
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "opd", "instansi"], UNKNOWN_LABEL);
}

// Tahun data asli — dicoba banyak kemungkinan nama field sebelum jatuh ke "created_at".
// created_at sengaja jadi prioritas TERAKHIR karena itu tanggal input ke sistem,
// bukan tahun cakupan datanya, supaya tidak semua dataset numpuk di tahun berjalan.
function resolveYear(dataset) {
  const candidates = [
    dataset?.tahun,
    dataset?.year,
    dataset?.tahun_data,
    dataset?.periode,
    dataset?.dimensi,
    dataset?.waktu,
  ];

  for (const raw of candidates) {
    if (raw === undefined || raw === null || raw === "") continue;
    const str = String(raw);
    const match = str.match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }

  // fallback terakhir: created_at, ditandai supaya kelihatan itu bukan tahun data asli
  if (dataset?.created_at) {
    const match = String(dataset.created_at).match(/\b(19|20)\d{2}\b/);
    if (match) return `${match[0]}*`;
  }

  return UNKNOWN_LABEL;
}

function resolveStatus(dataset) {
  return dataset?.deleted_at || dataset?.deletedAt ? "Draft" : "Aktif";
}

function countBy(rows, resolver) {
  const map = new Map();
  rows.forEach((row) => {
    const key = resolver(row) || UNKNOWN_LABEL;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// Kelompokkan entri di luar top-N jadi satu baris "Lainnya (n kategori)" supaya grafik tidak numpuk.
function groupTopN(entries, n) {
  if (entries.length <= n) return entries;
  const top = entries.slice(0, n);
  const rest = entries.slice(n);
  const restTotal = rest.reduce((sum, [, count]) => sum + count, 0);
  top.push([`Lainnya (${rest.length} kategori lain)`, restTotal]);
  return top;
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function BarSection({ icon, title, entries, max, emptyText }) {
  return (
    <section className="admin-card">
      <div className="card-header">
        <h2>{icon} {title}</h2>
      </div>
      <div className="report-bars">
        {entries.length === 0 && <div className="admin-empty">{emptyText}</div>}
        {entries.map(([label, count]) => (
          <div className="report-bar-row" key={label}>
            <span className="report-bar-label" title={label}>{label}</span>
            <div className="report-bar-track">
              <div className="report-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
            </div>
            <span className="report-bar-value">{count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ReportPage({ onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showAllRows, setShowAllRows] = useState(false);

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

  const filteredRows = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return rows;
    return rows.filter((row) => {
      return (
        resolveTitle(row).toLowerCase().includes(key) ||
        resolveOrgName(row).toLowerCase().includes(key) ||
        resolveCategory(row).toLowerCase().includes(key) ||
        resolveYear(row).toLowerCase().includes(key)
      );
    });
  }, [rows, keyword]);

  const byCategoryFull = useMemo(() => countBy(filteredRows, resolveCategory), [filteredRows]);
  const byOrgFull = useMemo(() => countBy(filteredRows, resolveOrgName), [filteredRows]);
  const byYearFull = useMemo(
    () => countBy(filteredRows, resolveYear).sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    [filteredRows]
  );
  const byStatus = useMemo(() => countBy(filteredRows, resolveStatus), [filteredRows]);

  const byCategory = useMemo(() => groupTopN(byCategoryFull, TOP_N_CATEGORY), [byCategoryFull]);
  const byOrg = useMemo(() => groupTopN(byOrgFull, TOP_N_ORG), [byOrgFull]);

  const maxCategory = Math.max(1, ...byCategory.map(([, count]) => count));
  const maxOrg = Math.max(1, ...byOrg.map(([, count]) => count));
  const maxYear = Math.max(1, ...byYearFull.map(([, count]) => count));

  const topOrg = byOrgFull[0];
  const topCategory = byCategoryFull.find(([label]) => label !== UNKNOWN_LABEL) || byCategoryFull[0];
  const unknownCategoryCount = byCategoryFull.find(([label]) => label === UNKNOWN_LABEL)?.[1] || 0;
  const unknownYearCount = byYearFull.find(([label]) => label === UNKNOWN_LABEL)?.[1] || 0;

  const yearsOnly = byYearFull.map(([label]) => label).filter((label) => /^\d{4}\*?$/.test(label));
  const yearRange = yearsOnly.length
    ? `${yearsOnly[0].replace("*", "")} – ${yearsOnly[yearsOnly.length - 1].replace("*", "")}`
    : "-";

  const visibleTableRows = showAllRows ? filteredRows : filteredRows.slice(0, 15);

  function exportCsv() {
    const header = "Judul,Kategori,Organisasi,Tahun,Status\n";
    const body = filteredRows
      .map((row) =>
        [resolveTitle(row), resolveCategory(row), resolveOrgName(row), resolveYear(row), resolveStatus(row)]
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
          <p>Statistik lengkap dataset: distribusi kategori, OPD, tahun, dan status.</p>
        </div>
        <div className="table-action">
          <button className="btn-outline" onClick={loadData}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="btn-outline" onClick={() => window.print()} disabled={!rows.length}>
            <Printer size={18} /> Cetak
          </button>
          <button className="btn-primary" onClick={exportCsv} disabled={!filteredRows.length}>
            <Download size={18} /> Unduh CSV
          </button>
        </div>
      </div>

      {error && <div className="admin-empty">{error}</div>}

      {/* Ringkasan */}
      <section className="admin-stats">
        <div className="stat-box red">
          <h2>{loading ? "..." : filteredRows.length}</h2>
          <span>Total Dataset</span>
        </div>
        <div className="stat-box blue">
          <h2>{loading ? "..." : byOrgFull.length}</h2>
          <span>OPD Kontributor</span>
        </div>
        <div className="stat-box green">
          <h2>{loading ? "..." : byCategoryFull.length}</h2>
          <span>Kategori</span>
        </div>
        <div className="stat-box orange">
          <h2>{loading ? "..." : yearRange}</h2>
          <span>Rentang Tahun</span>
        </div>
      </section>

      {/* Sorotan */}
      {!loading && rows.length > 0 && (
        <section className="admin-card">
          <div className="card-header">
            <h2>Sorotan</h2>
          </div>
          <ul className="report-highlight-list">
            {topOrg && (
              <li>OPD paling banyak menyumbang dataset: <strong>{topOrg[0]}</strong> ({topOrg[1]} dataset)</li>
            )}
            {topCategory && (
              <li>Kategori terbanyak: <strong>{topCategory[0]}</strong> ({topCategory[1]} dataset)</li>
            )}
            {unknownCategoryCount > 0 && (
              <li>{unknownCategoryCount} dataset belum memiliki kategori yang terisi</li>
            )}
            {unknownYearCount > 0 && (
              <li>{unknownYearCount} dataset tidak memiliki data tahun yang bisa dibaca</li>
            )}
            <li>
              {byStatus.map(([label, count]) => `${label}: ${count}`).join(" · ")}
            </li>
          </ul>
        </section>
      )}

      {/* Filter untuk seluruh laporan */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari berdasarkan judul, kategori, OPD, atau tahun..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <BarSection
        icon={<BarChart3 size={18} />}
        title={`Dataset per Kategori${byCategoryFull.length > TOP_N_CATEGORY ? ` (Top ${TOP_N_CATEGORY})` : ""}`}
        entries={byCategory}
        max={maxCategory}
        emptyText={loading ? "Memuat data..." : "Belum ada data."}
      />

      <BarSection
        icon={<BarChart3 size={18} />}
        title={`Dataset per OPD${byOrgFull.length > TOP_N_ORG ? ` (Top ${TOP_N_ORG})` : ""}`}
        entries={byOrg}
        max={maxOrg}
        emptyText={loading ? "Memuat data..." : "Belum ada data."}
      />

      <BarSection
        icon={<BarChart3 size={18} />}
        title="Dataset per Tahun"
        entries={byYearFull}
        max={maxYear}
        emptyText={loading ? "Memuat data..." : "Belum ada data."}
      />

      {/* Tabel rincian */}
      <section className="admin-card">
        <div className="card-header">
          <h2>Rincian Dataset {keyword && `(hasil pencarian: "${keyword}")`}</h2>
        </div>
        <div className="table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Organisasi</th>
                <th>Tahun</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>Memuat data...</td>
                </tr>
              )}
              {!loading && visibleTableRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty">Tidak ada dataset yang cocok.</td>
                </tr>
              )}
              {!loading &&
                visibleTableRows.map((row, index) => (
                  <tr key={row.uuid || row.id || index}>
                    <td>{resolveTitle(row)}</td>
                    <td>{resolveCategory(row)}</td>
                    <td>{resolveOrgName(row)}</td>
                    <td>{resolveYear(row)}</td>
                    <td>
                      <span className={`status ${resolveStatus(row) === "Draft" ? "draft" : "active"}`}>
                        {resolveStatus(row)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredRows.length > 15 && (
          <button className="btn-outline" style={{ marginTop: 12 }} onClick={() => setShowAllRows((v) => !v)}>
            {showAllRows ? "Tampilkan lebih sedikit" : `Tampilkan semua (${filteredRows.length} dataset)`}
          </button>
        )}
      </section>
    </div>
  );
}