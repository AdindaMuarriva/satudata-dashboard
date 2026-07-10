import * as d3 from "d3";

export const CONFIG = {
  baseUrl: "https://satudata-proxy.vercel.app",
  pollingIntervalMs: 30000,
  datasetPagesToFetch: 8,
  datasetPageSize: 100,
  acehTopoUrl: "https://raw.githubusercontent.com/ghapsara/indonesia-atlas/master/kabupaten-kota/Aceh/aceh-simplified-topo.json",
  endpoints: {
    dashboard: "/api/dashboard",
    kabkota: "/api/kabkota?limit=200&page=0",
    categories: "/api/categories?limit=20&page=1",
    organizations: "/api/organizations?limit=50&page=1"
  }
};

export const THEME_KEYWORDS = [
  "sosial", "kependudukan", "perempuan", "anak", "disabilitas", "lansia",
  "kemiskinan", "bansos", "pkh", "akta", "kia", "ktp", "kk", "yatim",
  "panti", "rehabilitasi sosial", "korban bencana sosial", "fakir miskin",
  "penyandang", "gender", "perlindungan anak", "keluarga"
];

export const META_FIELDS = new Set([
  "bps_kode_provinsi", "bps_nama_provinsi", "kemendagri_kode_provinsi", "kemendagri_nama_provinsi",
  "bps_kode_kabupaten_kota", "bps_nama_kabupaten_kota", "kemendagri_kode_kabupaten_kota", "kemendagri_nama_kabupaten_kota",
  "bps_kode_kecamatan", "bps_nama_kecamatan", "kemendagri_kode_kecamatan", "kemendagri_nama_kecamatan",
  "bps_kode_desa", "bps_nama_desa", "kemendagri_kode_desa", "kemendagri_nama_desa",
  "tahun", "tingkat_penyajian", "created_at", "updated_at", "deleted_at", "id", "uuid", "satuan"
]);

export async function fetchJSON(path) {
  const res = await fetch(CONFIG.baseUrl + path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

export function unwrapArray(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== "object") return [];
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.rows)) return json.data.rows;
  for (const key of ["results", "items", "records", "rows", "list"]) {
    if (Array.isArray(json[key])) return json[key];
  }
  return [];
}

export function pick(obj, keys, fallback = "—") {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return fallback;
}

export function stripAdminPrefix(name) {
  return (name || "").replace(/^(Kabupaten|Kota|Kabupatan)\s+/i, "").trim();
}

// Kolom "nilai" beda nama tiap dataset (persentase, jumlah, dst), jadi
// dideteksi otomatis: apapun yang bukan META_FIELDS dianggap kandidat nilai.
export function extractLabelValue(row) {
  const geoLabel =
    row.bps_nama_kabupaten_kota || row.kemendagri_nama_kabupaten_kota ||
    row.bps_nama_kecamatan || row.kemendagri_nama_kecamatan ||
    row.bps_nama_desa || row.kemendagri_nama_desa ||
    (row.tahun ? `Tahun ${row.tahun}` : null) ||
    row.tingkat_penyajian || "?";

  let category = null;
  let value = NaN;
  for (const key in row) {
    if (META_FIELDS.has(key)) continue;
    const v = row[key];
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "number") { if (isNaN(value)) value = v; continue; }
    if (typeof v === "string") {
      if (!isNaN(+v)) { if (isNaN(value)) value = +v; }
      else if (!category) { category = v; }
    }
  }

  const label = category ? `${geoLabel} — ${category}` : geoLabel;
  return { label, value, tahun: row.tahun, satuan: row.satuan, category, geoLabel };
}

export function rowsHaveKabupaten(rawRows) {
  return rawRows.some(r => r.bps_nama_kabupaten_kota || r.kemendagri_nama_kabupaten_kota);
}

// Skala warna bersama, dipakai konsisten oleh peta dan chart ranking.
export function buildColorScale(parsed) {
  const values = parsed.map(p => p.value).filter(v => !isNaN(v));
  const domain = [d3.min(values) ?? 0, d3.max(values) ?? 1];
  return d3.scaleSequential(d3.interpolateYlGnBu).domain(domain.slice().reverse());
}

export function isThemeRelevant(d) {
  const haystack = [
    d.judul, d.deskripsi, d.bidang, d.pengukuran,
    d.organisasi && d.organisasi.nama,
    d.organisasi && d.organisasi.keterangan
  ].filter(Boolean).join(" ").toLowerCase();
  return THEME_KEYWORDS.some(kw => haystack.includes(kw));
}

export function pickAggregator(meta) {
  const text = ((meta.satuan || "") + " " + (meta.judul || "")).toLowerCase();
  const avgKeywords = ["persen", "%", "indeks", "index", "rasio", "skor", "tingkat", "proporsi", "rata-rata"];
  return avgKeywords.some(k => text.includes(k)) ? "avg" : "sum";
}

export async function fetchDatasetsMultiPage() {
  const pages = [];
  for (let p = 1; p <= CONFIG.datasetPagesToFetch; p++) {
    pages.push(
      fetchJSON(`/api/datasets?limit=${CONFIG.datasetPageSize}&page=${p}`)
        .catch(err => { console.warn(`Gagal ambil halaman ${p}:`, err.message); return null; })
    );
  }
  const results = await Promise.all(pages);
  let combined = [];
  let totalCount = 0;
  results.forEach(r => {
    if (!r) return;
    combined = combined.concat(unwrapArray(r));
    totalCount = +pick(r, ["count"], totalCount) || totalCount;
  });
  return { rows: combined, totalCount };
}

export async function fetchDatasetMeta(uuid) {
  return fetchJSON(`/api/datasets/${uuid}`);
}

export async function fetchDatasetValues(uuid, tahun) {
  const path = `/api/datasets/${uuid}/datasources/json?tahun=${tahun}&limit=500&page=0&sortByColumn=&sortByType=`;
  const json = await fetchJSON(path);
  const years = (json.metadata && json.metadata.years) ? json.metadata.years.map(y => y.year) : [];
  return { rows: unwrapArray(json), years };
}

export async function fetchYearlyTrend(uuid, years, aggregator) {
  const sortedYears = [...years].sort((a, b) => +a - +b);
  const trendYears = sortedYears.length > 20 ? sortedYears.slice(-20) : sortedYears;

  const results = await Promise.all(trendYears.map(y =>
    fetchDatasetValues(uuid, y).then(r => ({ year: +y, rows: r.rows })).catch(() => ({ year: +y, rows: [] }))
  ));

  return results.map(({ year, rows }) => {
    const vals = rows.map(extractLabelValue).map(r => r.value).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const value = aggregator === "avg" ? d3.mean(vals) : d3.sum(vals);
    return { year, value };
  }).filter(Boolean).sort((a, b) => a.year - b.year);
}

let acehTopoCache = null;
export async function loadAcehTopo() {
  if (acehTopoCache) return acehTopoCache;
  const res = await fetch(CONFIG.acehTopoUrl);
  acehTopoCache = await res.json();
  return acehTopoCache;
}