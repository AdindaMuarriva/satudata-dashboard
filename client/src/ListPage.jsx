import { useEffect, useRef, useState } from "react";
import {
  CONFIG, THEME_KEYWORDS, fetchJSON, fetchDatasetsMultiPage, unwrapArray,
  pick
} from "./api";
import {
  Database,
  Users,
  Landmark,
  Baby,
  Accessibility,
  PersonStanding,
  HandCoins,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
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

const ICONS = {
  "Semua": <Database size={24} />,
  "Sosial": <Users size={24} />,
  "Kependudukan": <Landmark size={24} />,
  "Perempuan & Anak": <Baby size={24} />,
  "Disabilitas": <Accessibility size={24} />,
  "Lansia": <PersonStanding size={24} />,
  "Kemiskinan": <HandCoins size={24} />,
};

const FEATURES = [
  { title: "Dataset", description: "Jelajahi data resmi ACEH untuk analisis dan kebijakan." },
  { title: "Dashboard", description: "Pantau indikator penting dan visualisasi interaktif." },
  { title: "Infografik", description: "Ringkas data dalam tampilan visual yang informatif." },
  { title: "Publikasi", description: "Akses artikel dan laporan statistik resmi." },
  { title: "Videografik", description: "Konten video penjelasan data dan tutorial." },
  { title: "Dokumen Geospasial", description: "Dokumen, peta, dan data geospasial." }
];

const THEME_DASHBOARD_CARDS = [
  {
    flag: "DASHBOARD MASYARAKAT",
    title: "Analisis Komparatif Indikator Kesejahteraan dan Ketahanan Sosial Masyarakat Aceh",
    description: "Bandingkan tren indikator sosial, kependudukan, perlindungan kelompok rentan, dan kemiskinan secara terpadu.",
    href: "?page=dashboard-masyarakat"
  },
  {
    flag: "DASHBOARD KESEHATAN",
    title: "Analisis Komparatif Indikator Kesehatan Masyarakat Aceh",
    description: "Pantau perbandingan indikator layanan kesehatan, gizi, pencegahan penyakit, dan kesehatan lingkungan secara terpadu.",
    href: "?page=dashboard-kesehatan"
  },
  {
    flag: "DASHBOARD PENDIDIKAN",
    title: "Analisis Komparatif Indikator Pendidikan Aceh",
    description: "Pantau tren peserta didik, guru, satuan pendidikan, sarana belajar, dan akses pendidikan secara terpadu.",
    href: "?page=dashboard-pendidikan"
  },
  {
    flag: "DASHBOARD INFRASTRUKTUR",
    title: "Analisis Komparatif Indikator Infrastruktur Aceh",
    description: "Pantau tren jalan, jembatan, transportasi, air bersih, sanitasi, perumahan, dan konektivitas secara terpadu.",
    href: "?page=dashboard-infrastruktur"
  },
  {
    flag: "DASHBOARD PERTANIAN",
    title: "Analisis Komparatif Indikator Pertanian Aceh",
    description: "Pantau tren tanaman pangan, perkebunan, peternakan, perikanan, dan produksi pangan secara terpadu.",
    href: "?page=dashboard-pertanian"
  },
  {
    flag: "DASHBOARD SOSIAL",
    title: "Analisis Komparatif Indikator Sosial Aceh",
    description: "Pantau kesejahteraan sosial, kemiskinan, bantuan sosial, dan kelompok rentan secara terpadu.",
    href: "?page=dashboard-sosial"
  },
  {
    flag: "DASHBOARD STATISTIK",
    title: "Analisis Komparatif Data Statistik Aceh",
    description: "Bandingkan statistik sektoral, hasil sensus, survei, dan publikasi data Aceh.",
    href: "?page=dashboard-statistik"
  },
  {
    flag: "DASHBOARD LINGKUNGAN HIDUP",
    title: "Analisis Komparatif Indikator Lingkungan Hidup Aceh",
    description: "Pantau sampah, limbah, kualitas lingkungan, hutan, iklim, dan konservasi secara terpadu.",
    href: "?page=dashboard-lingkungan"
  }
];

const EXTERNAL_SHORTCUTS = [
  { key: "bencana", label: "Dashboard Bencana Aceh", href: "https://bencana.acehprov.go.id/", Icon: AlertTriangle },
  { key: "standar-data", label: "Standar Data", href: "https://ms-sds.web.bps.go.id/sds", Icon: ShieldCheck }
];

export default function ListPage({ tooltipRef }) {
  const [allDatasets, setAllDatasets] = useState([]);
  const [themeDatasets, setThemeDatasets] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [orgNames, setOrgNames] = useState([]);
  // const [status, setStatus] = useState({ ok: true, text: "Menghubungkan..." });
  const [banner, setBanner] = useState({ warn: false, html: "" });
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("");
  const [dashboardSlide, setDashboardSlide] = useState(0);
  
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
    setDashboardLoading(true);
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
      setBanner({ warn: true, html: `<b>Gagal menghubungi API.</b> Error: <code>${err.message}</code>` });
    } finally {
      setDashboardLoading(false);
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

  const activeThemeDashboard = THEME_DASHBOARD_CARDS[dashboardSlide];

  function moveDashboardSlide(direction) {
    setDashboardSlide(current => (current + direction + THEME_DASHBOARD_CARDS.length) % THEME_DASHBOARD_CARDS.length);
  }

  return (
    <div id="listView">
      <section className="hero">
        <div className="hero-head">
          <div className="brand">Satu Data Aceh</div>
          <nav className="hero-nav">
            <a href="?#datasets">Dataset</a>
            <a href={`?page=feature&feature=${encodeURIComponent("Dokumen Geospasial")}`}>Mapset</a>
            <a href={`?page=feature&feature=${encodeURIComponent("Dataset")}`}>Pemanfaatan Data</a>
            <a href="?#instansi">Instansi</a>
            <a href="?page=topic&topic=Semua">Group</a>
            <a href="?page=all-orgs">Bidang Urusan</a>
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
                <span className="hero-summary-value">{THEME_DASHBOARD_CARDS.length}</span>
                <span className="hero-summary-label">Dashboard Resmi</span>
              </div>
            </div>

            <div className="hero-shortcut-row">
              {EXTERNAL_SHORTCUTS.map(({ key, label, href, Icon }) => (
                <a key={key} className="hero-shortcut-card" href={href} target="_blank" rel="noopener noreferrer">
                  <span className="hero-shortcut-icon"><Icon size={22} /></span>
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-card">
              <div className="hero-panel-title">Informasi terbaru dan terverifikasi</div>
              <div className="hero-panel-sub">Data resmi Aceh dari berbagai OPD dapat diakses melalui portal ini.</div>
            </div>
            <div className="hero-dashboard-switcher" id="dashboards">
              <button type="button" className="hero-dashboard-arrow prev" onClick={() => moveDashboardSlide(-1)} aria-label="Dashboard sebelumnya"></button>
              <div className="hero-panel-card featured">
                <div className="hero-panel-flag">{activeThemeDashboard.flag}</div>
                <div className="hero-panel-title">{activeThemeDashboard.title}</div>
                <div className="hero-panel-sub">{activeThemeDashboard.description}</div>
                <a className="hero-panel-link" href={activeThemeDashboard.href}>Buka Dashboard</a>
                <div className="hero-dashboard-dots">
                  {THEME_DASHBOARD_CARDS.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={"hero-dashboard-dot" + (index === dashboardSlide ? " active" : "")}
                      aria-label={`Ke slide ${index + 1}`}
                      onClick={() => setDashboardSlide(index)}
                    />
                  ))}
                </div>
              </div>
              <button type="button" className="hero-dashboard-arrow next" onClick={() => moveDashboardSlide(1)} aria-label="Dashboard berikutnya"></button>
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
                <div className="topic-icon">
                  {ICONS[topic.label] || ICONS.default}
                </div>
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


      <div className="grid" id="datasets">
        <div className="panel wide">
          <h2>Katalog Dataset Terintegrasi</h2>
          <div className="sub">Klik judul dataset untuk membuka visualisasinya di halaman tersendiri.</div>
          <ul className="list">
            {dashboardLoading ? <li className="dashboard-status-message"><span className="running-dot" aria-hidden="true"></span>Memuat katalog dataset<span className="running-ellipsis" aria-label="sedang memuat"></span></li> : filtered.length === 0 ? <li className="dashboard-status-message"><span className="status-dot" aria-hidden="true"></span>Tidak ada dataset cocok. Coba kata kunci lain atau pilih topik yang berbeda.</li> : null}
            {filtered.slice(0, 60).map(d => (
              <li key={d.uuid}>
                <a className="row-link" href={`?dataset=${d.uuid}`}>
                  <span className="name">
                    <span></span>{d.judul || "Tanpa judul"}
                  </span>
                  <span className="meta">{d.organisasi ? d.organisasi.nama : ""}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h2>Dataset per OPD Terkait</h2>
          <div className="sub">Jumlah dataset yang cocok, dikelompokkan per organisasi</div>
          <svg ref={orgChartRef} width="100%" height="500"></svg>
        </div>

        <div className="panel">
          <h2>Dashboard Resmi Terkait</h2>
          <div className="sub">Klik untuk membuka dashboard aslinya</div>
          <ul className="list">
            {dashboardLoading ? <li className="dashboard-status-message"><span className="running-dot" aria-hidden="true"></span>Memuat dashboard resmi terkait<span className="running-ellipsis" aria-label="sedang memuat"></span></li> : matchedDashboards.length === 0 ? <li className="dashboard-status-message"><span className="status-dot" aria-hidden="true"></span>Belum ada dashboard resmi yang cocok.</li> : null}
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
