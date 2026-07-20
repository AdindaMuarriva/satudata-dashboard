import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Download, Printer, RefreshCw, Search, Building2, Tag, CalendarRange, Database } from "lucide-react";
import { fetchDatasetsMultiPage, pick } from "../../api";

const TOP_N_CATEGORY = 10;
const TOP_N_ORG = 10;
const UNKNOWN_LABEL = "Tidak diketahui";

/* ==========================================================================
   RESOLVER
   Semua fungsi di bawah ini HANYA membaca field dari objek dataset yang
   dikembalikan fetchDatasetsMultiPage() — endpoint yang sama persis dipakai
   DatasetPage & Dashboard. Tidak ada data hardcode/manual di file ini.
   ========================================================================== */

function resolveTitle(dataset) {
  return pick(dataset, ["judul", "title", "name"], "Dataset tanpa judul");
}

function resolveCategory(dataset) {
  const direct = pick(dataset, ["bidang", "kategori", "category", "klasifikasi", "sektor"], null);
  if (direct && typeof direct === "string" && direct.trim()) {
    const clean = direct.trim();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  // CATATAN: dataset.topik.nama SENGAJA tidak dipakai sebagai fallback lagi —
  // di data SatuData ini field itu ternyata berisi nama OPD/sub-unit kerja,
  // bukan kategori tematik (Kesehatan/Pendidikan/dst). Menampilkan itu sebagai
  // "kategori" hanya akan salah kelompok. Kalau tidak ketemu, jujur saja
  // "Tidak diketahui" daripada memberi angka yang salah.
  return UNKNOWN_LABEL;
}

function resolveOrgName(dataset) {
  if (typeof dataset?.organisasi === "string" && dataset.organisasi.trim()) return dataset.organisasi.trim();
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "opd", "instansi"], UNKNOWN_LABEL);
}

function resolveYear(dataset) {
  const candidates = [dataset?.tahun, dataset?.year, dataset?.tahun_data, dataset?.periode, dataset?.dimensi, dataset?.waktu];
  for (const raw of candidates) {
    if (raw === undefined || raw === null || raw === "") continue;
    const match = String(raw).match(/\b(19|20)\d{2}\b/);
    if (match) return match[0];
  }
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

/* ========================================================================== */

function BarSection({ icon, title, entries, max, total, emptyText, accent }) {
  return (
    <section className="sd-card">
      <div className="sd-card-head">
        <h2>{icon} {title}</h2>
        <span className="sd-card-total">{total} entri</span>
      </div>
      <div className="sd-bars">
        {entries.length === 0 && <div className="sd-empty">{emptyText}</div>}
        {entries.map(([label, count], i) => (
          <div className="sd-bar-row" key={label}>
            <span className="sd-bar-rank">{i + 1}</span>
            <span className="sd-bar-label" title={label}>{label}</span>
            <div className="sd-bar-track">
              <div
                className={`sd-bar-fill sd-accent-${accent}`}
                style={{ width: `${Math.max((count / max) * 100, 3)}%` }}
              />
            </div>
            <span className="sd-bar-value">{count}</span>
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
      setError(err.message || "Gagal memuat data laporan dari server SatuData");
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
    return rows.filter(
      (row) =>
        resolveTitle(row).toLowerCase().includes(key) ||
        resolveOrgName(row).toLowerCase().includes(key) ||
        resolveCategory(row).toLowerCase().includes(key) ||
        resolveYear(row).toLowerCase().includes(key)
    );
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

  const maxCategory = Math.max(1, ...byCategory.map(([, c]) => c));
  const maxOrg = Math.max(1, ...byOrg.map(([, c]) => c));
  const maxYear = Math.max(1, ...byYearFull.map(([, c]) => c));

  const topOrg = byOrgFull[0];
  const topCategory = byCategoryFull.find(([label]) => label !== UNKNOWN_LABEL) || byCategoryFull[0];
  const unknownCategoryCount = byCategoryFull.find(([label]) => label === UNKNOWN_LABEL)?.[1] || 0;
  const unknownYearCount = byYearFull.find(([label]) => label === UNKNOWN_LABEL)?.[1] || 0;
  const activeCount = byStatus.find(([label]) => label === "Aktif")?.[1] || 0;
  const draftCount = byStatus.find(([label]) => label === "Draft")?.[1] || 0;

  const yearsOnly = byYearFull.map(([label]) => label).filter((l) => /^\d{4}\*?$/.test(l));
  const yearRange = yearsOnly.length ? `${yearsOnly[0].replace("*", "")} – ${yearsOnly[yearsOnly.length - 1].replace("*", "")}` : "-";

  const visibleTableRows = showAllRows ? filteredRows : filteredRows.slice(0, 15);

  function exportCsv() {
    const header = "Judul,Kategori,Organisasi,Tahun,Status\n";
    const body = filteredRows
      .map((row) => [resolveTitle(row), resolveCategory(row), resolveOrgName(row), resolveYear(row), resolveStatus(row)].map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-satudata-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-content sd-report">
      <style>{`
        .sd-report { --sd-red:#9d1b1b; --sd-blue:#2563eb; --sd-green:#16a34a; --sd-orange:#ea580c; --sd-ink:#1f2430; --sd-sub:#6b7280; --sd-line:#e6e8ec; --sd-bg:#f7f8fa; }
        .sd-report .back-admin-button { margin-bottom: 16px; }

        .sd-kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:20px; }
        .sd-kpi { border-radius:14px; padding:20px 22px; color:#fff; position:relative; overflow:hidden; box-shadow:0 8px 20px -10px rgba(0,0,0,.25); }
        .sd-kpi::after { content:""; position:absolute; right:-20px; top:-20px; width:90px; height:90px; border-radius:50%; background:rgba(255,255,255,.14); }
        .sd-kpi .sd-kpi-icon { opacity:.85; margin-bottom:10px; }
        .sd-kpi h2 { font-size:30px; font-weight:800; margin:0 0 2px; line-height:1.1; }
        .sd-kpi span { font-size:13px; opacity:.9; font-weight:500; }
        .sd-kpi.red { background:linear-gradient(135deg,#b3231f,#7a1414); }
        .sd-kpi.blue { background:linear-gradient(135deg,#2f6fed,#1c3fa0); }
        .sd-kpi.green { background:linear-gradient(135deg,#1fa15a,#0d6b3c); }
        .sd-kpi.orange { background:linear-gradient(135deg,#f2810f,#b4570a); }

        .sd-card { background:#fff; border:1px solid var(--sd-line); border-radius:14px; padding:20px 22px; margin-bottom:18px; box-shadow:0 1px 3px rgba(16,24,40,.04); }
        .sd-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .sd-card-head h2 { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:700; color:var(--sd-ink); margin:0; }
        .sd-card-total { font-size:12px; color:var(--sd-sub); background:var(--sd-bg); padding:3px 10px; border-radius:999px; font-weight:600; }

        .sd-highlight { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
        .sd-highlight li { display:flex; align-items:flex-start; gap:10px; font-size:14px; color:var(--sd-ink); }
        .sd-highlight li::before { content:""; width:6px; height:6px; margin-top:7px; border-radius:50%; background:var(--sd-red); flex-shrink:0; }
        .sd-highlight strong { color:var(--sd-red); }
        .sd-status-pills { display:flex; gap:8px; margin-top:4px; }
        .sd-pill { font-size:12px; font-weight:700; padding:4px 12px; border-radius:999px; }
        .sd-pill.active { background:#dcfce7; color:#15803d; }
        .sd-pill.draft { background:#fef3c7; color:#b45309; }

        .sd-toolbar { display:flex; gap:10px; margin-bottom:18px; }
        .sd-search { flex:1; display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--sd-line); border-radius:10px; padding:10px 14px; }
        .sd-search svg { color:var(--sd-sub); flex-shrink:0; }
        .sd-search input { border:none; outline:none; width:100%; font-size:14px; }

        .sd-bars { display:flex; flex-direction:column; gap:10px; }
        .sd-bar-row { display:grid; grid-template-columns:22px minmax(140px,220px) 1fr 44px; align-items:center; gap:12px; }
        .sd-bar-rank { font-size:11px; font-weight:700; color:var(--sd-sub); text-align:center; }
        .sd-bar-label { font-size:13px; color:var(--sd-ink); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sd-bar-track { background:var(--sd-bg); border-radius:999px; height:12px; overflow:hidden; }
        .sd-bar-fill { height:100%; border-radius:999px; transition:width .4s ease; }
        .sd-accent-red { background:linear-gradient(90deg,#c62828,#8e1616); }
        .sd-accent-blue { background:linear-gradient(90deg,#3b82f6,#1d4ed8); }
        .sd-accent-orange { background:linear-gradient(90deg,#fb923c,#c2410c); }
        .sd-bar-value { font-size:13px; font-weight:700; color:var(--sd-ink); text-align:right; }

        .sd-empty { color:var(--sd-sub); font-size:13px; padding:16px 0; text-align:center; }

        .sd-table-wrap { overflow-x:auto; border:1px solid var(--sd-line); border-radius:12px; }
        .sd-table { width:100%; border-collapse:collapse; font-size:13px; }
        .sd-table thead th { background:var(--sd-bg); text-align:left; padding:12px 14px; font-weight:700; color:var(--sd-sub); text-transform:uppercase; font-size:11px; letter-spacing:.03em; border-bottom:1px solid var(--sd-line); }
        .sd-table tbody td { padding:12px 14px; border-bottom:1px solid var(--sd-line); color:var(--sd-ink); }
        .sd-table tbody tr:last-child td { border-bottom:none; }
        .sd-table tbody tr:hover { background:#fafafa; }
        .sd-status-tag { font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
        .sd-status-tag.active { background:#dcfce7; color:#15803d; }
        .sd-status-tag.draft { background:#fef3c7; color:#b45309; }

        .sd-showmore { margin-top:14px; }

        @media print {
          .sidebar-item, .back-admin-button, .sd-toolbar, .sd-table-action, .admin-sidebar, .admin-topbar { display:none !important; }
          .sd-card { break-inside:avoid; box-shadow:none; }
        }

        /* ---- Fallback styling untuk elemen umum yang belum ada di CSS global proyek ---- */
        .sd-report .page-header {
          display:flex !important; align-items:flex-start !important; justify-content:space-between !important;
          gap:16px !important; margin-bottom:20px !important; flex-wrap:wrap !important;
        }
        .sd-report .page-header > div:first-child { min-width:240px; flex:1 1 320px; }
        .sd-report .page-header h2 { font-size:26px; font-weight:800; color:var(--sd-ink); margin:0 0 4px; }
        .sd-report .page-header p { color:var(--sd-sub); font-size:14px; margin:0; }

        .sd-report .table-action {
          display:flex !important; gap:10px !important; flex-wrap:wrap !important;
          align-items:center !important; flex:0 0 auto; margin-left:auto;
        }

        .sd-report .btn-outline,
        .sd-report .btn-primary {
          all:unset;
          display:inline-flex !important; align-items:center !important; gap:8px !important;
          font-size:14px !important; font-weight:600 !important; border-radius:10px !important;
          padding:10px 18px !important; cursor:pointer !important; white-space:nowrap !important;
          line-height:1 !important; box-sizing:border-box !important;
        }
        .sd-report .btn-outline {
          background:#fff !important; color:var(--sd-ink) !important; border:1.5px solid var(--sd-line) !important;
        }
        .sd-report .btn-outline:hover { background:var(--sd-bg) !important; border-color:#c7cbd3 !important; }
        .sd-report .btn-primary {
          background:linear-gradient(135deg,#c62828,#8e1616) !important; color:#fff !important;
          box-shadow:0 4px 12px -4px rgba(158,27,27,.5) !important;
        }
        .sd-report .btn-primary:hover { filter:brightness(1.06); }
        .sd-report .btn-outline:disabled,
        .sd-report .btn-primary:disabled { opacity:.45 !important; cursor:not-allowed !important; }
        .sd-report .btn-outline svg,
        .sd-report .btn-primary svg { flex-shrink:0; }

        .sd-report .back-admin-button {
          all:unset;
          display:inline-flex !important; align-items:center !important; gap:8px !important;
          color:var(--sd-red) !important; font-weight:700 !important; font-size:14px !important;
          cursor:pointer !important; margin-bottom:16px !important;
        }
        .sd-report .back-admin-button:hover { text-decoration:underline; }

        @media (max-width: 760px) {
          .sd-report .table-action { margin-left:0; width:100%; }
          .sd-report .btn-outline, .sd-report .btn-primary { flex:1 1 auto; justify-content:center; }
        }

        .sd-report .status.active,
        .sd-report .sd-status-tag.active { background:#dcfce7; color:#15803d; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
        .sd-report .status.draft,
        .sd-report .sd-status-tag.draft { background:#fef3c7; color:#b45309; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; }
      `}</style>

      <button type="button" className="back-admin-button" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Dashboard
      </button>

      <div className="page-header">
        <div>
          <h2>Laporan</h2>
          <p>Statistik dataset diambil langsung dari data yang sudah diupload di portal SatuData.</p>
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

      {error && <div className="sd-card"><div className="sd-empty">{error}</div></div>}

      <div className="sd-kpi-grid">
        <div className="sd-kpi red">
          <Database className="sd-kpi-icon" size={22} />
          <h2>{loading ? "..." : filteredRows.length}</h2>
          <span>Total Dataset</span>
        </div>
        <div className="sd-kpi blue">
          <Building2 className="sd-kpi-icon" size={22} />
          <h2>{loading ? "..." : byOrgFull.length}</h2>
          <span>OPD Kontributor</span>
        </div>
        <div className="sd-kpi green">
          <Tag className="sd-kpi-icon" size={22} />
          <h2>{loading ? "..." : byCategoryFull.length}</h2>
          <span>Kategori</span>
        </div>
        <div className="sd-kpi orange">
          <CalendarRange className="sd-kpi-icon" size={22} />
          <h2>{loading ? "..." : yearRange}</h2>
          <span>Rentang Tahun</span>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <section className="sd-card">
          <div className="sd-card-head"><h2>Sorotan</h2></div>
          <ul className="sd-highlight">
            {topOrg && <li>OPD paling banyak menyumbang dataset: <strong>{topOrg[0]}</strong> ({topOrg[1]} dataset)</li>}
            {topCategory && <li>Kategori terbanyak: <strong>{topCategory[0]}</strong> ({topCategory[1]} dataset)</li>}
            {unknownCategoryCount > 0 && <li>{unknownCategoryCount} dataset belum memiliki kategori yang terisi di sumber data</li>}
            {unknownYearCount > 0 && <li>{unknownYearCount} dataset tidak memiliki data tahun yang bisa dibaca</li>}
            <li>
              Status dataset saat ini
              <div className="sd-status-pills">
                <span className="sd-pill active">Aktif: {activeCount}</span>
                <span className="sd-pill draft">Draft: {draftCount}</span>
              </div>
            </li>
          </ul>
        </section>
      )}

      <div className="sd-toolbar">
        <div className="sd-search">
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
        total={byCategoryFull.length}
        accent="red"
        emptyText={loading ? "Memuat data..." : "Belum ada data."}
      />

      <BarSection
        icon={<BarChart3 size={18} />}
        title={`Dataset per OPD${byOrgFull.length > TOP_N_ORG ? ` (Top ${TOP_N_ORG})` : ""}`}
        entries={byOrg}
        max={maxOrg}
        total={byOrgFull.length}
        accent="blue"
        emptyText={loading ? "Memuat data..." : "Belum ada data."}
      />

      <BarSection
        icon={<BarChart3 size={18} />}
        title="Dataset per Tahun"
        entries={byYearFull}
        max={maxYear}
        total={byYearFull.length}
        accent="orange"
        emptyText={loading ? "Memuat data..." : "Belum ada data."}
      />

      <section className="sd-card">
        <div className="sd-card-head">
          <h2>Rincian Dataset {keyword && `(hasil pencarian: "${keyword}")`}</h2>
          <span className="sd-card-total">{filteredRows.length} dataset</span>
        </div>
        <div className="sd-table-wrap">
          <table className="sd-table">
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
                <tr><td colSpan={5}>Memuat data...</td></tr>
              )}
              {!loading && visibleTableRows.length === 0 && (
                <tr><td colSpan={5} className="sd-empty">Tidak ada dataset yang cocok.</td></tr>
              )}
              {!loading &&
                visibleTableRows.map((row, index) => (
                  <tr key={row.uuid || row.id || index}>
                    <td>{resolveTitle(row)}</td>
                    <td>{resolveCategory(row)}</td>
                    <td>{resolveOrgName(row)}</td>
                    <td>{resolveYear(row)}</td>
                    <td>
                      <span className={`sd-status-tag ${resolveStatus(row) === "Draft" ? "draft" : "active"}`}>
                        {resolveStatus(row)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!loading && filteredRows.length > 15 && (
          <button className="btn-outline sd-showmore" onClick={() => setShowAllRows((v) => !v)}>
            {showAllRows ? "Tampilkan lebih sedikit" : `Tampilkan semua (${filteredRows.length} dataset)`}
          </button>
        )}
      </section>
    </div>
  );
}