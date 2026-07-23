import * as d3 from "d3";

const AI_BASE_URL = typeof import.meta.env === "undefined" ? "" : (import.meta.env.VITE_AI_BASE_URL || "");

export const CONFIG = {
  baseUrl: "https://satudata-proxy.vercel.app",
  aiBaseUrl: AI_BASE_URL,
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

export const HEALTH_KEYWORDS = [
  "kesehatan", "kesehatan ibu", "kesehatan anak", "rumah sakit", "puskesmas",
  "posyandu", "stunting", "imunisasi", "vaksin", "gizi", "dokter", "perawat",
  "tenaga kesehatan", "penyakit", "pasien", "kematian ibu", "kematian bayi",
  "air minum", "sanitasi", "bpjs", "jkn", "farmasi"
];

export const EDUCATION_KEYWORDS = [
  "pendidikan", "sekolah", "siswa", "peserta didik", "murid", "guru",
  "tenaga pendidik", "paud", "taman kanak", "madrasah", "sd ", "smp ",
  "sma", "smk", "mahasiswa", "perguruan tinggi", "universitas", "kuliah",
  "literasi", "melek huruf", "buta huruf", "angka partisipasi sekolah",
  "putus sekolah", "beasiswa", "ijazah", "pendidikan anak usia dini"
];

export const INFRASTRUCTURE_KEYWORDS = [
  "infrastruktur", "jalan", "jembatan", "transportasi", "angkutan",
  "pelabuhan", "bandara", "terminal", "irigasi", "bendungan", "drainase",
  "air minum", "air bersih", "sanitasi", "permukiman", "perumahan",
  "bangunan", "konstruksi", "tata ruang", "jaringan listrik", "telekomunikasi",
  "internet", "broadband", "menara", "penerangan jalan"
];

export const AGRICULTURE_KEYWORDS = [
  "pertanian", "tanaman pangan", "hortikultura", "perkebunan", "peternakan",
  "perikanan", "pangan", "sawah", "padi", "jagung", "panen", "pupuk",
  "nelayan", "produksi pertanian", "komoditas"
];

export const SOCIAL_KEYWORDS = [
  "sosial", "kesejahteraan", "kemiskinan", "bantuan sosial", "bansos", "pkh",
  "disabilitas", "lansia", "panti", "fakir miskin", "perlindungan anak",
  "perempuan", "gender", "keluarga", "kependudukan"
];

export const STATISTICS_KEYWORDS = [
  "statistik", "statistik sektoral", "bps", "sensus", "survei", "publikasi statistik",
  "data statistik", "statistical"
];

export const ENVIRONMENT_KEYWORDS = [
  "lingkungan hidup", "lingkungan", "sampah", "limbah", "kualitas air", "kualitas udara",
  "hutan", "konservasi", "emisi", "iklim", "pencemaran", "perubahan iklim",
  "keanekaragaman hayati", "ruang terbuka hijau"
];

export const META_FIELDS = new Set([
  "bps_kode_provinsi", "bps_nama_provinsi", "kemendagri_kode_provinsi", "kemendagri_nama_provinsi",
  "bps_kode_kabupaten_kota", "bps_nama_kabupaten_kota", "kemendagri_kode_kabupaten_kota", "kemendagri_nama_kabupaten_kota",
  "bps_kode_kecamatan", "bps_nama_kecamatan", "kemendagri_kode_kecamatan", "kemendagri_nama_kecamatan",
  "bps_kode_desa", "bps_nama_desa", "kemendagri_kode_desa", "kemendagri_nama_desa",
  "tahun", "tingkat_penyajian", "created_at", "updated_at", "deleted_at", "id", "uuid", "satuan"
]);

export const LOCAL_DATASETS_KEY = "satudata_local_datasets";

export function getLocalDatasets() {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(window.localStorage.getItem(LOCAL_DATASETS_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveLocalDataset(dataset) {
  const datasets = getLocalDatasets();
  window.localStorage.setItem(LOCAL_DATASETS_KEY, JSON.stringify([dataset, ...datasets]));
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

export function updateLocalDataset(uuid, changes) {
  const datasets = getLocalDatasets().map(dataset => dataset.uuid === uuid ? { ...dataset, ...changes, updated_at: new Date().toISOString() } : dataset);
  window.localStorage.setItem(LOCAL_DATASETS_KEY, JSON.stringify(datasets));
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

export function getDeletedDatasetUuids() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem("satudata_deleted_uuids") || "[]");
  } catch {
    return [];
  }
}

export function getEditedOverrides() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("satudata_edited_overrides") || "{}");
  } catch {
    return {};
  }
}

export function saveDatasetChanges(uuid, changes) {
  if (String(uuid).startsWith("local-")) {
    const datasets = getLocalDatasets().map(dataset => 
      dataset.uuid === uuid ? { ...dataset, ...changes, updated_at: new Date().toISOString() } : dataset
    );
    window.localStorage.setItem(LOCAL_DATASETS_KEY, JSON.stringify(datasets));
  } else {
    const overrides = getEditedOverrides();
    const currentOverride = overrides[uuid] || {};
    overrides[uuid] = { ...currentOverride, ...changes, uuid, updated_at: new Date().toISOString() };
    window.localStorage.setItem("satudata_edited_overrides", JSON.stringify(overrides));
  }
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

export function deleteDataset(uuid) {
  if (String(uuid).startsWith("local-")) {
    const datasets = getLocalDatasets().filter(dataset => dataset.uuid !== uuid);
    window.localStorage.setItem(LOCAL_DATASETS_KEY, JSON.stringify(datasets));
    
    const overrides = getEditedOverrides();
    if (overrides[uuid]) {
      delete overrides[uuid];
      window.localStorage.setItem("satudata_edited_overrides", JSON.stringify(overrides));
    }
  } else {
    const deleted = getDeletedDatasetUuids();
    if (!deleted.includes(uuid)) {
      window.localStorage.setItem("satudata_deleted_uuids", JSON.stringify([...deleted, uuid]));
    }
  }
  window.dispatchEvent(new Event("satudata-local-datasets-updated"));
}

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
  const first = await fetchJSON(`/api/datasets?limit=${CONFIG.datasetPageSize}&page=1`);
  const apiTotalCount = Number(pick(first, ["count", "total"], 0)) || unwrapArray(first).length;
  const pageCount = Math.max(1, Math.ceil(apiTotalCount / CONFIG.datasetPageSize));
  const remainingPages = Array.from({ length: pageCount - 1 }, (_, index) => index + 2);
  const remaining = await Promise.all(remainingPages.map(page => fetchJSON(`/api/datasets?limit=${CONFIG.datasetPageSize}&page=${page}`)
    .catch(error => { console.warn(`Gagal ambil halaman ${page}:`, error.message); return null; })));
  const combined = [first, ...remaining].filter(Boolean).flatMap(unwrapArray);

  const localDatasets = getLocalDatasets();
  const deletedUuids = new Set(getDeletedDatasetUuids());
  const overrides = getEditedOverrides();

  // Hitung jumlah dataset API yang ditandai hapus
  const remoteDeletedCount = combined.filter(d => deletedUuids.has(d.uuid)).length;

  let all = [...localDatasets, ...combined];
  all = all.map(d => {
    if (overrides[d.uuid]) {
      // Override admin hanya berisi field yang diubah. Pertahankan metadata
      // dari portal agar dataset tetap dapat dicocokkan dan divisualisasikan.
      return { ...d, ...overrides[d.uuid] };
    }
    return d;
  }).filter(d => !deletedUuids.has(d.uuid));

  const totalCount = (apiTotalCount || combined.length) + localDatasets.length - remoteDeletedCount;

  return { rows: all, totalCount };
}

export async function fetchDatasetMeta(uuid) {
  const overrides = getEditedOverrides();
  const localDataset = getLocalDatasets().find(item => item.uuid === uuid);
  if (localDataset) return localDataset;
  const remoteDataset = await fetchJSON(`/api/datasets/${uuid}`);
  return overrides[uuid] ? { ...remoteDataset, ...overrides[uuid] } : remoteDataset;
}

export async function fetchDatasetValues(uuid, tahun) {
  const overrides = getEditedOverrides();
  const dataset = overrides[uuid] || getLocalDatasets().find(item => item.uuid === uuid);
  if (dataset) {
    const rows = (dataset.csvRows || []).filter(row => !tahun || !row.tahun || String(row.tahun) === String(tahun));
    const years = [...new Set((dataset.csvRows || []).map(row => row.tahun).filter(Boolean))].map(year => ({ year }));
    return { rows, years };
  }
  const limit = 500;
  const maxPages = 200;
  const allRows = [];
  let years = [];
  for (let page = 0; page < maxPages; page += 1) {
    const path = `/api/datasets/${uuid}/datasources/json?tahun=${encodeURIComponent(tahun || "")}&limit=${limit}&page=${page}&sortByColumn=&sortByType=`;
    const json = await fetchJSON(path);
    const pageRows = unwrapArray(json);
    if (page === 0) years = (json.metadata && json.metadata.years) ? json.metadata.years.map(y => y.year) : [];
    allRows.push(...pageRows);
    const total = Number(json.count || json.total || json.metadata?.count);
    if (!pageRows.length || pageRows.length < limit || (Number.isFinite(total) && allRows.length >= total)) break;
  }
  if (allRows.length >= limit * maxPages) console.warn(`Pengambilan data ${uuid} berhenti pada batas ${maxPages * limit} baris.`);
  return { rows: allRows, years };
}

export async function requestAiExplanation(payload) {
  if (!CONFIG.aiBaseUrl) return null;
  const response = await fetch(`${CONFIG.aiBaseUrl.replace(/\/$/, "")}/ai/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `AI -> HTTP ${response.status}`);
  const result = await response.json();
  return typeof result.explanation === "string" ? result.explanation.trim() : null;
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

export function isHealthRelevant(d) {
  const haystack = [
    d.judul, d.deskripsi, d.bidang, d.pengukuran,
    d.topik && d.topik.nama,
    d.organisasi && d.organisasi.nama,
    d.organisasi && d.organisasi.keterangan
  ].filter(Boolean).join(" ").toLowerCase();
  return HEALTH_KEYWORDS.some(kw => haystack.includes(kw));
}

export function isEducationRelevant(d) {
  const haystack = [
    d.judul, d.deskripsi, d.bidang, d.pengukuran,
    d.topik && d.topik.nama,
    d.organisasi && d.organisasi.nama,
    d.organisasi && d.organisasi.keterangan
  ].filter(Boolean).join(" ").toLowerCase();
  return EDUCATION_KEYWORDS.some(kw => haystack.includes(kw));
}

export function isInfrastructureRelevant(d) {
  const haystack = [
    d.judul, d.deskripsi, d.bidang, d.pengukuran,
    d.topik && d.topik.nama,
    d.organisasi && d.organisasi.nama,
    d.organisasi && d.organisasi.keterangan
  ].filter(Boolean).join(" ").toLowerCase();
  return INFRASTRUCTURE_KEYWORDS.some(kw => haystack.includes(kw));
}

function matchesThemeKeywords(dataset, keywords) {
  const haystack = [
    dataset.judul, dataset.deskripsi, dataset.bidang, dataset.pengukuran,
    dataset.topik && dataset.topik.nama,
    dataset.organisasi && dataset.organisasi.nama,
    dataset.organisasi && dataset.organisasi.keterangan
  ].filter(Boolean).join(" ").toLowerCase();
  return keywords.some(keyword => haystack.includes(keyword));
}

export const isAgricultureRelevant = dataset => matchesThemeKeywords(dataset, AGRICULTURE_KEYWORDS);
export const isSocialRelevant = dataset => matchesThemeKeywords(dataset, SOCIAL_KEYWORDS);
export const isStatisticsRelevant = dataset => matchesThemeKeywords(dataset, STATISTICS_KEYWORDS);
export const isEnvironmentRelevant = dataset => matchesThemeKeywords(dataset, ENVIRONMENT_KEYWORDS);
