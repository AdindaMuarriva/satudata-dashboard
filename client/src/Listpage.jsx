import { useEffect, useRef, useState } from "react";
import {
  CONFIG, THEME_KEYWORDS, fetchJSON, fetchDatasetsMultiPage, unwrapArray,
  isThemeRelevant, pick
} from "./api";
import { renderOrgChart } from "./charts";

const CHIPS = [
  { label: "Semua", kw: "" },
  { label: "Sosial", kw: "sosial" },
  { label: "Kependudukan", kw: "kependudukan" },
  { label: "Perempuan & Anak", kw: "perempuan" },
  { label: "Disabilitas", kw: "disabilitas" },
  { label: "Lansia", kw: "lansia" },
  { label: "Kemiskinan", kw: "kemiskinan" }
];

export default function ListPage({ tooltipRef }) {
  const [allDatasets, setAllDatasets] = useState([]);
  const [themeDatasets, setThemeDatasets] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [orgNames, setOrgNames] = useState([]);
  const [status, setStatus] = useState({ ok: true, text: "Menghubungkan..." });
  const [banner, setBanner] = useState({ warn: false, html: "" });

  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("");
  const [org, setOrg] = useState("__all__");

  const orgChartRef = useRef(null);

  async function load() {
    try {
      const [{ rows: datasetRows, totalCount: tc }, kabkotaJson, orgsJson, dashboardJson] = await Promise.all([
        fetchDatasetsMultiPage(),
        fetchJSON(CONFIG.endpoints.kabkota),
        fetchJSON(CONFIG.endpoints.organizations),
        fetchJSON(CONFIG.endpoints.dashboard)
      ]);

      const themed = datasetRows.filter(isThemeRelevant);
      setAllDatasets(datasetRows);
      setThemeDatasets(themed);
      setDashboards(unwrapArray(dashboardJson));
      setTotalCount(tc || datasetRows.length);
      setOrgNames([...new Set(themed.map(d => d.organisasi && d.organisasi.nama).filter(Boolean))].sort());

      setStatus({ ok: true, text: "Live · " + new Date().toLocaleTimeString("id-ID") });
      setBanner({
        warn: false,
        html: `<b>Terhubung.</b> ${datasetRows.length} dataset dimuat (total katalog: ${tc}) · update terakhir ${new Date().toLocaleTimeString("id-ID")}.`
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

  const filtered = themeDatasets.filter(d => {
    if (chip && !JSON.stringify(d).toLowerCase().includes(chip)) return false;
    if (search && !JSON.stringify(d).toLowerCase().includes(search.toLowerCase())) return false;
    if (org !== "__all__" && (d.organisasi && d.organisasi.nama) !== org) return false;
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

  return (
    <div id="listView">
      <header>
        <div className="titles">
          <h1>Sosial &amp; Kependudukan Aceh</h1>
          <p>Dinas Sosial · Dinas Registrasi Kependudukan · Dinas Pemberdayaan Perempuan &amp; Perlindungan Anak — Satu Data Aceh</p>
        </div>
        <div className="status">
          <span className={"dot" + (status.ok ? "" : " err")}></span>
          <span>{status.text}</span>
        </div>
      </header>

      <div className={"banner" + (banner.warn ? " warn" : "")} dangerouslySetInnerHTML={{ __html: banner.html || "Terhubung via proxy. Klik judul dataset untuk membuka halaman detailnya." }} />

      <div className="chips">
        {CHIPS.map(c => (
          <span key={c.kw} className={"chip" + (chip === c.kw ? " active" : "")} onClick={() => setChip(c.kw)}>
            {c.label}
          </span>
        ))}
      </div>

      <div className="filters">
        <label>Cari dataset
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="mis. KIA, akta, bansos, PKH" />
        </label>
        <label>Organisasi (OPD)
          <select value={org} onChange={e => setOrg(e.target.value)}>
            <option value="__all__">Semua OPD</option>
            {orgNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="label">Dataset Ditemukan</div><div className="value">{filtered.length}</div></div>
        <div className="stat-card"><div className="label">Total Katalog Dataset</div><div className="value">{totalCount || allDatasets.length}</div></div>
        <div className="stat-card"><div className="label">OPD Terkait Tema Ini</div><div className="value">{orgNames.length}</div></div>
        <div className="stat-card"><div className="label">Dashboard Resmi Cocok</div><div className="value">{matchedDashboards.length}</div></div>
      </div>

      <div className="grid">
        <div className="panel wide">
          <h2>Dataset Sosial &amp; Kependudukan</h2>
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

        <div className="panel">
          <h2>Dataset per OPD Terkait</h2>
          <div className="sub">Jumlah dataset yang cocok, dikelompokkan per organisasi</div>
          <svg ref={orgChartRef} width="100%" height="280"></svg>
        </div>

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