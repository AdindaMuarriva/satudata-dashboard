import { useEffect, useRef, useState } from "react";
import {
  CONFIG, THEME_KEYWORDS, fetchJSON, fetchDatasetsMultiPage, unwrapArray,
  isThemeRelevant, pick
} from "./api";
import { renderOrgChart } from "./charts";

// Dikembalikan ke CHIPS asli milikmu agar tidak ada fitur yang hilang
const CHIPS = [
  { label: "Semua", kw: "" },
  { label: "Sosial", kw: "sosial" },
  { label: "Kependudukan", kw: "kependudukan" },
  { label: "Perempuan & Anak", kw: "perempuan" },
  { label: "Disabilitas", kw: "disabilitas" },
  { label: "Lansia", kw: "lansia" },
  { label: "Kemiskinan", kw: "kemiskinan" }
];

const FEATURES = [
  { title: "Dataset", description: "Jelajahi data resmi ACEH untuk analisis dan kebijakan." },
  { title: "Dashboard", description: "Pantau indikator penting dan visualisasi interaktif." },
  { title: "Infografik", description: "Ringkas data dalam tampilan visual yang informatif." },
  { title: "Publikasi", description: "Akses artikel dan laporan statistik resmi." },
  { title: "Videografik", description: "Konten video penjelasan data dan tutorial." },
  { title: "Dokumen Geospasial", description: "Dokumen, peta, dan data geospasial." }
];

export default function ListPage({ tooltipRef }) {
  const [allDatasets, setAllDatasets] = useState([]);
  const [themeDatasets, setThemeDatasets] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [orgNames, setOrgNames] = useState([]);
  // const [status, setStatus] = useState({ ok: true, text: "Menghubungkan..." });
  const [banner, setBanner] = useState({ warn: false, html: "" });

  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("");
  
  // DEFAULT UTAMA: Mengatur pilihan OPD (Bisa menangkap redirect dari portal luar jika nanti diintegrasikan)
  const [org, setOrg] = useState("__all__"); 

  const orgChartRef = useRef(null);
  const [showAllOrgs, setShowAllOrgs] = useState(false);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = search.trim();
    const searchUrl = query ? `?page=search&query=${encodeURIComponent(query)}` : "?page=search";
    window.location.href = searchUrl;
  }

  function handleAdminLogin() {
    window.location.href = "?page=admin";
  }

  async function load() {
    try {
      const [{ rows: datasetRows, totalCount: tc }, kabkotaJson, orgsJson, dashboardJson] = await Promise.all([
        fetchDatasetsMultiPage(),
        fetchJSON(CONFIG.endpoints.kabkota),
        fetchJSON(CONFIG.endpoints.organizations),
        fetchJSON(CONFIG.endpoints.dashboard)
      ]);

      // KUNCI PERBAIKAN: Melepas filter tema saat inisialisasi awal 
      // Supaya dataset dari dinas-dinas lain di luar Dinas Sosial ikut terpanggil ke dalam aplikasi
      setAllDatasets(datasetRows);
      setThemeDatasets(datasetRows); 
      setDashboards(unwrapArray(dashboardJson));
      setTotalCount(tc || datasetRows.length);
      
      // Mengumpulkan daftar nama seluruh OPD/Dinas yang tersedia secara dinamis
      setOrgNames([...new Set(datasetRows.map(d => d.organisasi && d.organisasi.nama).filter(Boolean))].sort());

      // setStatus({ ok: true, text: "Live · " + new Date().toLocaleTimeString("id-ID") });

      setBanner({
        warn: false,
        html: `Silakan gunakan filter Organisasi (OPD) untuk melihat data spesifik per instansi.`
      });
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setStatus({ ok: false, text: "Gagal terhubung — cek console (F12)" });
      setBanner({ warn: true, html: `<b>Gagal menghubungi API.</b> Error: <code>${err.message}</code>` });
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, CONFIG.pollingIntervalMs);
    return () => clearInterval(id);
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const normalizedChip = chip.trim().toLowerCase();
  const filtered = themeDatasets.filter(d => {
    const title = d.judul ? d.judul.toLowerCase() : "";
    const orgName = d.organisasi && d.organisasi.nama ? d.organisasi.nama.toLowerCase() : "";
    const topicName = d.topik && d.topik.nama ? d.topik.nama.toLowerCase() : "";
    const haystack = [title, orgName, topicName].join(" ");

    if (org !== "__all__" && orgName !== org.toLowerCase()) return false;
    if (normalizedChip && !haystack.includes(normalizedChip)) return false;
    if (normalizedSearch && !title.includes(normalizedSearch)) return false;
    return true;
  });

  useEffect(() => {
    if (orgChartRef.current) renderOrgChart(orgChartRef.current, filtered, tooltipRef.current);
  }, [filtered.length, chip, search, org]);

  const kw = chip || search.toLowerCase();
  let matchedDashboards = dashboards.filter(d => {
    const haystack = [d.title, d.topik && d.topik.nama, ...(d.organisasi || []).map(o => o.nama)]
      .filter(Boolean).join(" ").toLowerCase();
    return THEME_KEYWORDS.some(k => haystack.includes(k)) || (kw && haystack.includes(kw));
  });
  if (!matchedDashboards.length) matchedDashboards = dashboards;

  const orgCounts = Object.entries(allDatasets.reduce((acc, d) => {
    const name = d.organisasi && d.organisasi.nama;
    if (!name) return acc;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const featuredDashboard = matchedDashboards[0];

  return (
    <div id="listView">
      <section className="hero">
        <div className="hero-head">
          <div className="brand">Satu Data Aceh</div>
          <nav className="hero-nav">
            <a href="#datasets">Dataset</a>
            <a href="#features">Mapset</a>
            <a href="#features">Pemanfaatan Data</a>
            <a href="#instansi">Instansi</a>
            <a href="#features">Group</a>
            <a href="#features">Bidang Urusan</a>
          </nav>
          <button type="button" className="hero-login" onClick={handleAdminLogin}>Login</button>
        </div>
        <div className="hero-status-row">
          <div className={"banner" + (banner.warn ? " warn" : "")} dangerouslySetInnerHTML={{ __html: banner.html || "Terhubung via proxy. Klik judul dataset untuk membuka halaman detailnya." }} />
          {/* <div className="status mini-status">
            <span className={"dot" + (status.ok ? "" : " err")}></span>
            <span>{status.text}</span>
          </div> */}
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">PORTAL DATA PEMERINTAH ACEH</span>
            <h1>Menuju Pemerintahan Berbasis Data</h1>
            <p>Akses dataset, dashboard, infografik, dan produk statistik resmi dari berbagai instansi di Aceh.</p>

            <form className="hero-search" onSubmit={handleSearchSubmit}>
              <input id="searchInput" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Data Statistik..." />
              <button type="submit">Cari</button>
            </form>

            <div className="hero-summary-cards">
              <div className="hero-summary-card">
                <span className="hero-summary-value">{totalCount || allDatasets.length}</span>
                <span className="hero-summary-label">Dataset</span>
              </div>
              <div className="hero-summary-card">
                <span className="hero-summary-value">{orgNames.length}</span>
                <span className="hero-summary-label">Instansi</span>
              </div>
              <div className="hero-summary-card">
                <span className="hero-summary-value">{matchedDashboards.length}</span>
                <span className="hero-summary-label">Dashboard Resmi</span>
              </div>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-card">
              <div className="hero-panel-title">Informasi terbaru dan terverifikasi</div>
              <div className="hero-panel-sub">Data resmi Aceh dari berbagai OPD dapat diakses melalui portal ini.</div>
            </div>
            <div className="hero-panel-card featured">
              <div className="hero-panel-flag">DASHBOARD BENCANA</div>
              <div className="hero-panel-title">Informasi perkembangan bencana alam di Provinsi Aceh</div>
              <div className="hero-panel-sub">Akses peta dampak, infografik, dan dashboard terkini secara cepat.</div>
              {featuredDashboard && featuredDashboard.url && (
                <a className="hero-panel-link" href={featuredDashboard.url} target="_blank" rel="noreferrer">Buka Dashboard</a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="topic-instansi">
        <div className="topic-panel">
          <div className="panel-head">
            <h2>Topik</h2>
            <a href="#features">Lihat Fitur →</a>
          </div>
          <div className="topic-grid">
            {CHIPS.map(topic => (
              <a
                key={topic.kw}
                className={"topic-card" + (chip === topic.kw ? " active" : "")}
                href={`?page=topic&topic=${encodeURIComponent(topic.label)}`}
              >
                <div className="topic-icon">●</div>
                <div>{topic.label}</div>
              </a>
            ))}
          </div>
        </div>
        <div className="instansi-panel" id="instansi">
          <div className="panel-head">
            <h2>Instansi</h2>
            <a href="?page=all-orgs">Lihat Semua →</a>
          </div>
          <ul className="instansi-list">
            {orgCounts.map(([name, count]) => (
              <li key={name}>
                <a href={`?org=${encodeURIComponent(name)}`}>{name}</a>
                <span className="badge">{count} Dataset</span>
              </li>
            ))}
          </ul>
        </div>
      </section>


      {/* LAYOUT GRID 3 PANEL ASLI KAMU (TIDAK HILANG) */}
      <div className="grid" id="datasets">
        <div className="panel wide">
          <h2>Katalog Dataset Terintegrasi</h2>
          <div className="sub">Klik judul dataset untuk membuka visualisasinya di halaman tersendiri.</div>
          <ul className="list">
            {filtered.length === 0 && <li>Tidak ada dataset cocok. Coba kata kunci lain atau pilih topik yang berbeda.</li>}
            {filtered.slice(0, 60).map(d => (
              <li key={d.uuid}>
                <a className="row-link" href={`?dataset=${d.uuid}`}>
                  <span className="name">
                    <span className="badge">{pick(d, ["satuan"], "")}</span>{d.judul || "Tanpa judul"}
                  </span>
                  <span className="meta">{d.organisasi ? d.organisasi.nama : ""}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* GRAFIK D3.js (TIDAK HILANG, otomatis merender grafik dinas yang terpilih) */}
        <div className="panel">
          <h2>Dataset per OPD Terkait</h2>
          <div className="sub">Jumlah dataset yang cocok, dikelompokkan per organisasi</div>
          <svg ref={orgChartRef} width="100%" height="280"></svg>
        </div>

        {/* PANEL DASHBOARD COCOK (TIDAK HILANG) */}
        <div className="panel">
          <h2>Dashboard Resmi Terkait</h2>
          <div className="sub">Klik untuk membuka dashboard aslinya</div>
          <ul className="list">
            {matchedDashboards.length === 0 && <li>Belum ada dashboard resmi yang cocok.</li>}
            {matchedDashboards.slice(0, 20).map(d => (
              <li key={d.id}>
                <a className="row-link" href={d.url || "#"} target="_blank" rel="noreferrer">
                  <span className="name">{d.title || "Tanpa judul"}</span>
                  <span className="meta">{d.topik ? d.topik.nama : ""}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer>Sumber: satudata.acehprov.go.id/api (via proxy) · Auto-refresh tiap 30 detik</footer>
    </div>
  );
}