import { useEffect, useRef, useState } from "react";
import {
  extractLabelValue,
  fetchDatasetValues,
  fetchDatasetsMultiPage,
  fetchYearlyTrend,
  isAgricultureRelevant,
  isEducationRelevant,
  isEnvironmentRelevant,
  isHealthRelevant,
  isInfrastructureRelevant,
  isSocialRelevant,
  isStatisticsRelevant,
  isThemeRelevant,
  pickAggregator,
  rowsHaveKabupaten,
  stripAdminPrefix
} from "./api";
import { renderDonutChart, renderHorizontalBarChart, renderMultiTrendChart, renderOrgChart, renderRegionalChoropleth } from "./charts";

const TREND_BATCH_SIZE = 4;

// Klasifikasi pesisir/pedalaman ini APPROKSIMASI administratif berdasarkan
// letak geografis umum kabupaten/kota Aceh (bukan data resmi BPS/Kemendagri).
// Ditandai jelas di UI sebagai perkiraan — sesuaikan kalau punya sumber resmi.
const ACEH_REGION_MAP = {
  "Banda Aceh": "pesisir", "Sabang": "pesisir", "Aceh Besar": "pesisir",
  "Pidie": "pesisir", "Pidie Jaya": "pesisir", "Bireuen": "pesisir",
  "Aceh Utara": "pesisir", "Lhokseumawe": "pesisir", "Aceh Timur": "pesisir",
  "Langsa": "pesisir", "Aceh Tamiang": "pesisir", "Aceh Barat": "pesisir",
  "Aceh Jaya": "pesisir", "Nagan Raya": "pesisir", "Aceh Barat Daya": "pesisir",
  "Aceh Selatan": "pesisir", "Simeulue": "pesisir", "Aceh Singkil": "pesisir",
  "Subulussalam": "pedalaman", "Aceh Tengah": "pedalaman",
  "Bener Meriah": "pedalaman", "Gayo Lues": "pedalaman", "Aceh Tenggara": "pedalaman"
};

// Pertanyaan kunci per tema — hanya diisi untuk tema yang datanya realistis
// bisa dijawab (butuh breakdown kabupaten/kota di dataset sumbernya).
const KEY_QUESTIONS = {
  masyarakat: [
    { id: "ipm-below-average", visual: "ranking", keywords: ["ipm", "indeks pembangunan manusia"], text: "Kabupaten/kota mana di Aceh yang masih memiliki Indeks Pembangunan Manusia (IPM) di bawah rata-rata provinsi, sehingga memerlukan intervensi pembangunan yang lebih intensif?" },
    { id: "population-growth-service", visual: "ranking", keywords: ["pertumbuhan penduduk", "penduduk", "pelayanan"], text: "Wilayah mana yang mengalami pertumbuhan penduduk tinggi, tetapi belum diimbangi dengan peningkatan pelayanan publik dan infrastruktur dasar?" },
    { id: "dependency-ratio", visual: "ranking", keywords: ["rasio", "usia produktif", "ketergantungan"], text: "Kabupaten/kota mana yang memiliki rasio penduduk usia produktif dan nonproduktif yang berpotensi menjadi beban pembangunan daerah?" },
    { id: "welfare-regions", visual: "comparison", keywords: ["kesejahteraan", "penduduk", "kemiskinan"], text: "Apakah terdapat kesenjangan kesejahteraan antara wilayah pesisir, kepulauan, dan pedalaman di Aceh?" },
    { id: "social-priority", visual: "composition", keywords: ["kependudukan", "kesejahteraan", "rentan"], text: "Daerah mana yang perlu menjadi prioritas pembangunan sosial berdasarkan kombinasi indikator kependudukan, kesejahteraan, dan kelompok rentan?" }
  ],
  kesehatan: [
    { id: "stunting", visual: "ranking", keywords: ["stunting"], text: "Kabupaten/kota mana yang masih memiliki prevalensi stunting di atas target nasional, sehingga memerlukan percepatan program penurunan stunting?" },
    { id: "health-workers", visual: "ranking", keywords: ["tenaga kesehatan", "dokter", "perawat"], text: "Wilayah mana yang mengalami kekurangan tenaga kesehatan dibandingkan dengan jumlah penduduk yang dilayani?" },
    { id: "health-facilities", visual: "comparison", keywords: ["rumah sakit", "puskesmas", "pustu"], text: "Apakah distribusi Rumah Sakit, Puskesmas, dan Pustu sudah menjangkau seluruh wilayah Aceh secara merata?" },
    { id: "immunization", visual: "ranking", keywords: ["imunisasi"], text: "Kabupaten/kota mana yang memiliki cakupan imunisasi dasar lengkap terendah, sehingga berpotensi meningkatkan risiko penyakit yang dapat dicegah?" },
    { id: "maternal-infant", visual: "comparison", keywords: ["kematian ibu", "kematian bayi", "fasilitas kesehatan"], text: "Bagaimana hubungan antara ketersediaan fasilitas kesehatan dengan angka kematian ibu dan bayi di Aceh?" }
  ],
  pendidikan: [
    { id: "aps", visual: "ranking", keywords: ["angka partisipasi sekolah", "aps"], text: "Kabupaten/kota mana yang masih memiliki Angka Partisipasi Sekolah (APS) terendah, sehingga berpotensi meningkatkan angka putus sekolah?" },
    { id: "teacher-ratio", visual: "ranking", keywords: ["guru", "peserta didik", "rasio"], text: "Wilayah mana yang mengalami kekurangan tenaga pendidik berdasarkan rasio guru terhadap peserta didik?" },
    { id: "school-access", visual: "comparison", keywords: ["sekolah", "akses pendidikan"], text: "Apakah pembangunan sekolah baru telah menjangkau daerah dengan akses pendidikan yang masih rendah?" },
    { id: "education-facilities", visual: "ranking", keywords: ["sarana", "prasarana", "pendidikan"], text: "Kabupaten/kota mana yang memiliki kondisi sarana dan prasarana pendidikan yang masih belum memenuhi standar pelayanan minimal?" },
    { id: "education-ipm", visual: "comparison", keywords: ["pendidikan", "ipm"], text: "Bagaimana hubungan antara tingkat pendidikan masyarakat dengan Indeks Pembangunan Manusia (IPM) di setiap kabupaten/kota Aceh?" }
  ],
  infrastruktur: [
    { id: "road-damage", visual: "ranking", keywords: ["jalan rusak", "jalan"], text: "Kabupaten/kota mana yang masih memiliki persentase jalan rusak tertinggi, sehingga menghambat mobilitas masyarakat dan distribusi barang?" },
    { id: "water-sanitation", visual: "ranking", keywords: ["air minum", "sanitasi"], text: "Wilayah mana yang belum memiliki akses air minum layak dan sanitasi layak sesuai target nasional?" },
    { id: "remote-infrastructure", visual: "comparison", keywords: ["tertinggal", "kepulauan", "terpencil"], text: "Apakah pembangunan infrastruktur telah diprioritaskan pada wilayah tertinggal, kepulauan, dan daerah terpencil di Aceh?" },
    { id: "road-bridge-priority", visual: "ranking", keywords: ["jalan", "jembatan"], text: "Kabupaten/kota mana yang membutuhkan prioritas pembangunan jalan dan jembatan untuk meningkatkan konektivitas ekonomi?" },
    { id: "infrastructure-impact", visual: "trend", keywords: ["infrastruktur", "ekonomi"], text: "Bagaimana pengaruh pembangunan infrastruktur terhadap pertumbuhan ekonomi dan pelayanan publik di setiap kabupaten/kota Aceh?" }
  ],
  pertanian: [
    { id: "rice-decline", visual: "trend", keywords: ["padi", "produksi padi"], text: "Kabupaten/kota mana yang mengalami penurunan produksi padi dalam lima tahun terakhir sehingga berpotensi mengganggu ketahanan pangan daerah?" },
    { id: "commodity-productivity", visual: "trend", keywords: ["produktivitas", "komoditas"], text: "Komoditas pertanian apa yang mengalami penurunan produktivitas paling signifikan, dan wilayah mana yang terdampak?" },
    { id: "agriculture-land", visual: "ranking", keywords: ["lahan pertanian", "lahan"], text: "Wilayah mana yang memiliki potensi lahan pertanian, namun belum dimanfaatkan secara optimal?" },
    { id: "climate-agriculture", visual: "trend", keywords: ["iklim", "tanaman", "perkebunan"], text: "Bagaimana dampak perubahan iklim terhadap produksi tanaman pangan dan perkebunan di Aceh?" },
    { id: "modernization", visual: "ranking", keywords: ["produktif", "petani", "pertanian"], text: "Kabupaten/kota mana yang perlu diprioritaskan dalam program modernisasi pertanian dan peningkatan produktivitas petani?" }
  ],
  sosial: [
    { id: "poverty", visual: "ranking", keywords: ["kemiskinan", "miskin"], text: "Kabupaten/kota mana yang masih memiliki angka kemiskinan tertinggi sehingga menjadi prioritas program pengentasan kemiskinan?" },
    { id: "social-assistance", visual: "comparison", keywords: ["bantuan sosial", "bansos", "miskin"], text: "Apakah penyaluran bantuan sosial telah tepat sasaran berdasarkan jumlah penduduk miskin di setiap kabupaten/kota?" },
    { id: "disability-elderly", visual: "ranking", keywords: ["disabilitas", "lansia"], text: "Wilayah mana yang memiliki jumlah penyandang disabilitas dan lanjut usia tertinggi sehingga memerlukan layanan sosial yang lebih memadai?" },
    { id: "ppks", visual: "trend", keywords: ["ppks", "pemerlu pelayanan"], text: "Kabupaten/kota mana yang mengalami peningkatan jumlah Pemerlu Pelayanan Kesejahteraan Sosial (PPKS) dalam beberapa tahun terakhir?" },
    { id: "extreme-poverty", visual: "trend", keywords: ["kemiskinan ekstrem", "perlindungan sosial"], text: "Bagaimana efektivitas program perlindungan sosial dalam menurunkan angka kemiskinan ekstrem di Aceh?" }
  ],
  statistik: [
    { id: "economic-growth", visual: "ranking", keywords: ["pertumbuhan ekonomi", "pdrb"], text: "Kabupaten/kota mana yang mengalami pertumbuhan ekonomi di bawah rata-rata Provinsi Aceh, sehingga memerlukan percepatan pembangunan?" },
    { id: "pdrb-unemployment-poverty", visual: "comparison", keywords: ["pdrb", "pengangguran", "kemiskinan"], text: "Bagaimana hubungan antara PDRB, tingkat pengangguran terbuka, dan angka kemiskinan pada setiap kabupaten/kota?" },
    { id: "unemployment", visual: "ranking", keywords: ["pengangguran"], text: "Wilayah mana yang memiliki tingkat pengangguran tertinggi, sehingga memerlukan perluasan kesempatan kerja?" },
    { id: "economic-slowdown", visual: "trend", keywords: ["pertumbuhan ekonomi", "pdrb"], text: "Kabupaten/kota mana yang mengalami perlambatan pertumbuhan ekonomi selama beberapa tahun terakhir?" },
    { id: "development-gap", visual: "composition", keywords: ["kesenjangan", "indikator"], text: "Indikator statistik apa yang menunjukkan kesenjangan pembangunan paling besar antar kabupaten/kota di Aceh?" }
  ],
  lingkungan: [
    { id: "iklh", visual: "ranking", keywords: ["iklh", "indeks kualitas lingkungan"], text: "Kabupaten/kota mana yang memiliki Indeks Kualitas Lingkungan Hidup (IKLH) terendah, sehingga memerlukan kebijakan pemulihan lingkungan?" },
    { id: "waste", visual: "ranking", keywords: ["sampah", "pengelolaan sampah"], text: "Wilayah mana yang menghasilkan volume sampah terbesar, namun masih memiliki tingkat pengelolaan sampah yang rendah?" },
    { id: "disaster", visual: "trend", keywords: ["banjir", "longsor", "kebakaran"], text: "Kabupaten/kota mana yang mengalami peningkatan kejadian banjir, longsor, atau kebakaran hutan dalam beberapa tahun terakhir?" },
    { id: "forest-change", visual: "trend", keywords: ["hutan", "alih fungsi"], text: "Bagaimana perkembangan alih fungsi kawasan hutan terhadap kondisi lingkungan di Aceh?" },
    { id: "climate-mitigation", visual: "ranking", keywords: ["iklim", "bencana", "lingkungan"], text: "Wilayah mana yang menjadi prioritas mitigasi perubahan iklim dan pengurangan risiko bencana berdasarkan kondisi lingkungan hidupnya?" }
  ]
};

function dashboardTitle(datasets, theme) {
  if (theme === "kesehatan") return "Analisis Komparatif Indikator Kesehatan Masyarakat Aceh";
  if (theme === "pendidikan") return "Analisis Komparatif Indikator Pendidikan Aceh";
  if (theme === "infrastruktur") return "Analisis Komparatif Indikator Infrastruktur Aceh";
  if (theme === "pertanian") return "Analisis Komparatif Indikator Pertanian Aceh";
  if (theme === "sosial") return "Analisis Komparatif Indikator Sosial Aceh";
  if (theme === "statistik") return "Analisis Komparatif Data Statistik Aceh";
  if (theme === "lingkungan") return "Analisis Komparatif Indikator Lingkungan Hidup Aceh";
  const text = datasets.map(item => item.judul || "").join(" ").toLowerCase();
  if (text.includes("kemiskinan") || text.includes("bansos") || text.includes("sosial")) {
    return "Analisis Komparatif Indikator Kesejahteraan dan Ketahanan Sosial Masyarakat Aceh";
  }
  return "Analisis Komparatif Indikator Masyarakat Aceh";
}

function getHealthGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("ibu") || text.includes("anak") || text.includes("stunting") || text.includes("posyandu")) return "Ibu, Anak & Gizi";
  if (text.includes("rumah sakit") || text.includes("puskesmas") || text.includes("dokter") || text.includes("perawat")) return "Fasilitas & Tenaga";
  if (text.includes("penyakit") || text.includes("imunisasi") || text.includes("vaksin")) return "Pencegahan Penyakit";
  if (text.includes("sanitasi") || text.includes("air minum")) return "Kesehatan Lingkungan";
  if (text.includes("bpjs") || text.includes("jkn") || text.includes("jaminan")) return "Jaminan Kesehatan";
  return "Kesehatan lainnya";
}

function getCommunityGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("perempuan") || text.includes("anak") || text.includes("gender")) return "Perempuan & Anak";
  if (text.includes("disabilitas") || text.includes("penyandang")) return "Disabilitas";
  if (text.includes("lansia")) return "Lansia";
  if (text.includes("miskin") || text.includes("kemiskinan") || text.includes("bansos")) return "Kemiskinan";
  if (text.includes("penduduk") || text.includes("kependudukan") || text.includes("keluarga")) return "Kependudukan";
  return "Sosial lainnya";
}

function getEducationGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("paud") || text.includes("taman kanak") || text.includes("usia dini")) return "Pendidikan Anak Usia Dini";
  if (text.includes("guru") || text.includes("pendidik") || text.includes("tenaga kependidikan")) return "Guru & Tenaga Kependidikan";
  if (text.includes("siswa") || text.includes("murid") || text.includes("peserta didik") || text.includes("mahasiswa")) return "Peserta Didik";
  if (text.includes("sekolah") || text.includes("kelas") || text.includes("ruang") || text.includes("fasilitas")) return "Satuan & Sarana Pendidikan";
  if (text.includes("universitas") || text.includes("perguruan tinggi") || text.includes("kuliah")) return "Pendidikan Tinggi";
  if (text.includes("literasi") || text.includes("melek huruf") || text.includes("partisipasi") || text.includes("putus sekolah")) return "Akses & Capaian Pendidikan";
  return "Pendidikan lainnya";
}

function getInfrastructureGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("jalan") || text.includes("jembatan") || text.includes("penerangan jalan")) return "Jalan & Jembatan";
  if (text.includes("transportasi") || text.includes("angkutan") || text.includes("pelabuhan") || text.includes("bandara") || text.includes("terminal")) return "Transportasi";
  if (text.includes("air minum") || text.includes("air bersih") || text.includes("sanitasi") || text.includes("drainase")) return "Air Bersih & Sanitasi";
  if (text.includes("irigasi") || text.includes("bendungan") || text.includes("sungai")) return "Sumber Daya Air";
  if (text.includes("perumahan") || text.includes("permukiman") || text.includes("bangunan")) return "Perumahan & Permukiman";
  if (text.includes("listrik") || text.includes("telekomunikasi") || text.includes("internet") || text.includes("menara")) return "Utilitas & Konektivitas";
  return "Infrastruktur lainnya";
}

function getAgricultureGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("tanaman") || text.includes("padi") || text.includes("jagung") || text.includes("sawah")) return "Tanaman Pangan";
  if (text.includes("hortikultura") || text.includes("sayur") || text.includes("buah")) return "Hortikultura";
  if (text.includes("perkebunan")) return "Perkebunan";
  if (text.includes("ternak") || text.includes("peternakan")) return "Peternakan";
  if (text.includes("ikan") || text.includes("perikanan") || text.includes("nelayan")) return "Perikanan";
  return "Pertanian lainnya";
}

function getSocialGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("miskin") || text.includes("kemiskinan") || text.includes("bansos") || text.includes("pkh")) return "Kemiskinan & Bantuan Sosial";
  if (text.includes("perempuan") || text.includes("anak") || text.includes("gender")) return "Perempuan & Anak";
  if (text.includes("disabilitas") || text.includes("penyandang")) return "Disabilitas";
  if (text.includes("lansia")) return "Lansia";
  if (text.includes("penduduk") || text.includes("keluarga") || text.includes("kependudukan")) return "Kependudukan & Keluarga";
  return "Sosial lainnya";
}

function getStatisticsGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("sensus")) return "Sensus";
  if (text.includes("survei")) return "Survei";
  if (text.includes("kependudukan") || text.includes("penduduk")) return "Statistik Kependudukan";
  if (text.includes("ekonomi") || text.includes("harga") || text.includes("inflasi")) return "Statistik Ekonomi";
  if (text.includes("publikasi")) return "Publikasi Statistik";
  return "Statistik lainnya";
}

function getEnvironmentGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("sampah") || text.includes("limbah")) return "Sampah & Limbah";
  if (text.includes("air") || text.includes("sungai")) return "Kualitas Air";
  if (text.includes("udara") || text.includes("emisi") || text.includes("pencemaran")) return "Kualitas Udara & Emisi";
  if (text.includes("hutan") || text.includes("konservasi") || text.includes("hayati")) return "Hutan & Keanekaragaman Hayati";
  if (text.includes("iklim") || text.includes("cuaca")) return "Iklim";
  return "Lingkungan lainnya";
}

function getThemeFilter(theme) {
  if (theme === "kesehatan") return isHealthRelevant;
  if (theme === "pendidikan") return isEducationRelevant;
  if (theme === "infrastruktur") return isInfrastructureRelevant;
  if (theme === "pertanian") return isAgricultureRelevant;
  if (theme === "sosial") return isSocialRelevant;
  if (theme === "statistik") return isStatisticsRelevant;
  if (theme === "lingkungan") return isEnvironmentRelevant;
  return isThemeRelevant;
}

function getThemeGroup(theme) {
  if (theme === "kesehatan") return getHealthGroup;
  if (theme === "pendidikan") return getEducationGroup;
  if (theme === "infrastruktur") return getInfrastructureGroup;
  if (theme === "pertanian") return getAgricultureGroup;
  if (theme === "sosial") return getSocialGroup;
  if (theme === "statistik") return getStatisticsGroup;
  if (theme === "lingkungan") return getEnvironmentGroup;
  return getCommunityGroup;
}

function countBy(datasets, getLabel, limit = 6) {
  return Object.entries(datasets.reduce((counts, dataset) => {
    const label = getLabel(dataset);
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, limit);
}

function normalizeYears(years = []) {
  return [...new Set(years.map(item => String(item?.year ?? item)).filter(year => /^\d{4}$/.test(year)))].sort((a, b) => Number(b) - Number(a));
}

function summarizeRegions(rows) {
  const values = rows.map(row => Number(row.value)).filter(Number.isFinite).sort((a, b) => a - b);
  const midpoint = Math.floor(values.length / 2);
  return {
    count: values.length,
    average: values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0,
    median: values.length ? (values.length % 2 ? values[midpoint] : (values[midpoint - 1] + values[midpoint]) / 2) : 0
  };
}

async function loadInBatches(items, task, onBatchLoaded) {
  const results = [];
  for (let start = 0; start < items.length; start += TREND_BATCH_SIZE) {
    const batch = items.slice(start, start + TREND_BATCH_SIZE);
    results.push(...await Promise.all(batch.map(item => task(item).catch(error => {
      console.warn("Dataset tren dilewati:", error.message);
      return null;
    }))));
    onBatchLoaded?.(results.filter(Boolean));
  }
  return results;
}

export default function MasyarakatDashboardPage({ tooltipRef, theme = "masyarakat" }) {
  const [datasets, setDatasets] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionResult, setQuestionResult] = useState(null);
  const [questionError, setQuestionError] = useState("");
  const [questionYear, setQuestionYear] = useState("");
  const [questionYears, setQuestionYears] = useState([]);
  const trendRef = useRef(null);
  const orgChartRef = useRef(null);
  const groupChartRef = useRef(null);
  const unitChartRef = useRef(null);
  const questionChartRef = useRef(null);
  const regionalMapRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setTrendLoading(true);
      setSeries([]);
      setError("");
      try {
        const { rows } = await fetchDatasetsMultiPage();
        const themedDatasets = rows.filter(getThemeFilter(theme));
        if (!mounted) return;

        // Tampilkan seluruh ringkasan dan chart kategori lebih dulu. Grafik tren
        // dimuat per batch agar halaman tidak menunggu semua nilai dataset selesai.
        setDatasets(themedDatasets);
        setLoading(false);

        await loadInBatches(themedDatasets, async dataset => {
          const initialYear = /^\d{4}$/.test(String(dataset.dimensi))
            ? dataset.dimensi
            : new Date().getFullYear();
          const initial = await fetchDatasetValues(dataset.uuid, initialYear);
          const years = initial.years.length ? initial.years : [initialYear];
          const data = await fetchYearlyTrend(dataset.uuid, years, pickAggregator(dataset));
          return {
            uuid: dataset.uuid,
            title: dataset.judul || "Tanpa judul",
            satuan: dataset.satuan || "nilai",
            data
          };
        }, loadedSeries => {
          if (mounted) setSeries(loadedSeries);
        });
      } catch (err) {
        console.error(`Gagal memuat dashboard ${theme}:`, err);
        if (mounted) setError(`Dashboard ${theme} gagal dimuat. Silakan coba lagi.`);
      } finally {
        if (mounted) {
          setLoading(false);
          setTrendLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [theme]);

  // Hasil pencarian: dataset & tren yang ditampilkan mengikuti kata kunci yang
  // diketik user, tapi tetap dalam cakupan tema dashboard ini (datasets di atas
  // sudah difilter per tema saat load). Kalau search kosong, semua ditampilkan.
  const normalizedSearch = search.trim().toLowerCase();
  const visibleDatasets = normalizedSearch
    ? datasets.filter(dataset => {
        const haystack = [
          dataset.judul,
          dataset.deskripsi,
          dataset.organisasi?.nama,
          dataset.topik?.nama,
          dataset.satuan
        ].filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : datasets;
  const visibleUuids = new Set(visibleDatasets.map(dataset => dataset.uuid));
  const visibleSeries = normalizedSearch ? series.filter(item => visibleUuids.has(item.uuid)) : series;

  // Rincian OPD penyumbang dataset yang sedang tampil — supaya jelas dashboard
  // ini gabungan data dari instansi mana saja, bukan cuma angka total.
  const orgBreakdown = Object.entries(
    visibleDatasets.reduce((acc, dataset) => {
      const name = dataset.organisasi?.nama;
      if (!name) return acc;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  useEffect(() => {
    if (visibleSeries.length && trendRef.current) renderMultiTrendChart(trendRef.current, visibleSeries, tooltipRef.current, { indexed: true, maxSeries: 6 });
  }, [visibleSeries, tooltipRef]);

  useEffect(() => {
    if (visibleDatasets.length && orgChartRef.current) renderOrgChart(orgChartRef.current, visibleDatasets, tooltipRef.current);
  }, [visibleDatasets, tooltipRef]);

  const groupCounts = countBy(visibleDatasets, getThemeGroup(theme));
  const unitCounts = countBy(visibleDatasets, item => item.satuan || "Belum dicantumkan", 5);
  const comparableTrends = visibleSeries.map(item => {
    const first = item.data?.[0];
    const last = item.data?.[item.data.length - 1];
    if (!first || !last || !Number(first.value)) return null;
    return { ...item, change: ((Number(last.value) - Number(first.value)) / Math.abs(Number(first.value))) * 100 };
  }).filter(Boolean);
  const risingTrends = comparableTrends.filter(item => item.change > 1).length;
  const fallingTrends = comparableTrends.filter(item => item.change < -1).length;
  const largestChange = [...comparableTrends].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
  const dominantGroup = groupCounts[0];
  const dominantUnit = unitCounts[0];

  useEffect(() => {
    if (groupCounts.length && groupChartRef.current) renderDonutChart(groupChartRef.current, groupCounts, tooltipRef.current);
  }, [visibleDatasets, tooltipRef]);

  useEffect(() => {
    if (unitCounts.length && unitChartRef.current) renderHorizontalBarChart(unitChartRef.current, unitCounts, tooltipRef.current);
  }, [visibleDatasets, tooltipRef]);

  // Bentuk diagram dipilih berdasarkan bentuk pertanyaannya: peringkat wilayah
  // memakai batang, perkembangan waktu memakai garis, dan komposisi isu
  // memakai donat. Jadi grafik tidak sekadar dekorasi, tetapi menjawab konteks.
  const questionChartData = questionResult?.type === "top-bottom"
    ? questionResult.regionalComparison
    : questionResult?.type === "regional"
      ? questionResult.regionalComparison
    : questionResult?.type === "vulnerable"
      ? questionResult.regionalComparison
      : questionResult?.type === "coastal-inland"
        ? [
            { label: "Wilayah pesisir", value: questionResult.pesisir.avg || 0 },
            { label: "Wilayah pedalaman", value: questionResult.pedalaman.avg || 0 }
          ]
      : null;

  useEffect(() => {
    if (!questionChartRef.current || !questionResult) return;

    if (questionChartData?.length) {
      renderHorizontalBarChart(questionChartRef.current, questionChartData, tooltipRef.current);
    } else if (questionResult.type === "trend-5y") {
      renderMultiTrendChart(
        questionChartRef.current,
        questionResult.movers.map(item => ({
          uuid: item.title,
          title: item.title,
          satuan: item.satuan,
          data: item.data
        })),
        tooltipRef.current,
        { indexed: false, maxSeries: 5 }
      );
    } else if (questionResult.type === "factors" && questionResult.groupCounts.length) {
      renderDonutChart(questionChartRef.current, questionResult.groupCounts, tooltipRef.current);
    }
  }, [questionResult, tooltipRef]);

  useEffect(() => {
    const hasRegionalComparison = ["top-bottom", "vulnerable", "regional"].includes(questionResult?.type)
      && questionResult.regionalComparison?.length;
    if (!hasRegionalComparison || !regionalMapRef.current) return;
    renderRegionalChoropleth(regionalMapRef.current, questionResult.regionalComparison, questionResult.satuan, tooltipRef.current)
      .catch(error => console.warn("Peta perbandingan wilayah tidak dapat dimuat:", error.message));
  }, [questionResult, tooltipRef]);

  const organizations = new Set(visibleDatasets.map(item => item.organisasi?.nama).filter(Boolean)).size;
  const themeLabel = {
    kesehatan: "kesehatan", pendidikan: "pendidikan", infrastruktur: "infrastruktur",
    pertanian: "pertanian", sosial: "sosial", statistik: "statistik", lingkungan: "lingkungan hidup"
  }[theme] || "masyarakat";
  const themeDescription = {
    kesehatan: "Visualisasi ini menggabungkan dataset kesehatan, fasilitas layanan, tenaga kesehatan, gizi, pencegahan penyakit, dan kesehatan lingkungan dari portal Satu Data Aceh.",
    pendidikan: "Visualisasi ini menggabungkan dataset pendidikan, peserta didik, guru, satuan pendidikan, sarana belajar, pendidikan anak usia dini, dan akses pendidikan dari portal Satu Data Aceh.",
    infrastruktur: "Visualisasi ini menggabungkan dataset jalan, jembatan, transportasi, air bersih, sanitasi, irigasi, perumahan, dan konektivitas dari portal Satu Data Aceh.",
    pertanian: "Visualisasi ini menggabungkan dataset tanaman pangan, hortikultura, perkebunan, peternakan, perikanan, dan produksi pangan dari portal Satu Data Aceh.",
    sosial: "Visualisasi ini menggabungkan dataset kesejahteraan sosial, kemiskinan, bantuan sosial, kelompok rentan, perempuan, anak, dan kependudukan dari portal Satu Data Aceh.",
    statistik: "Visualisasi ini menggabungkan dataset statistik sektoral, sensus, survei, publikasi, kependudukan, dan ekonomi dari portal Satu Data Aceh.",
    lingkungan: "Visualisasi ini menggabungkan dataset sampah, limbah, kualitas air dan udara, hutan, iklim, serta keanekaragaman hayati dari portal Satu Data Aceh."
  }[theme] || "Visualisasi ini menggabungkan dataset bertema sosial, kependudukan, perempuan dan anak, disabilitas, lansia, serta kemiskinan dari portal Satu Data Aceh.";
  const compositionTitle = {
    kesehatan: "Komposisi Fokus Kesehatan", pendidikan: "Komposisi Fokus Pendidikan", infrastruktur: "Komposisi Fokus Infrastruktur",
    pertanian: "Komposisi Fokus Pertanian", sosial: "Komposisi Fokus Sosial", statistik: "Komposisi Data Statistik", lingkungan: "Komposisi Fokus Lingkungan"
  }[theme] || "Komposisi Kelompok Masyarakat";
  const coverageTitle = {
    kesehatan: "Kesehatan", pendidikan: "Pendidikan", infrastruktur: "Infrastruktur", pertanian: "Pertanian", sosial: "Sosial", statistik: "Statistik", lingkungan: "Lingkungan Hidup"
  }[theme] || "Masyarakat";
  const title = dashboardTitle(datasets, theme);
  const questions = KEY_QUESTIONS[theme] || [];

  // Cari dataset pertama (dari daftar kandidat) yang datanya punya breakdown
  // per kabupaten/kota, lalu kembalikan nilai yang sudah diparse per wilayah.
  async function findRegionalDataset(candidates, selectedYear = "") {
    for (const dataset of candidates.slice(0, 12)) {
      try {
        const guessYear = /^\d{4}$/.test(String(dataset.dimensi)) ? dataset.dimensi : new Date().getFullYear();
        let { rows, years } = await fetchDatasetValues(dataset.uuid, selectedYear || guessYear);
        const availableYears = normalizeYears(years);
        if (!rows.length && availableYears.length && !selectedYear) {
          const retry = await fetchDatasetValues(dataset.uuid, availableYears[0]);
          rows = retry.rows;
        }
        if (rows.length && rowsHaveKabupaten(rows)) {
          const parsed = rows.map(extractLabelValue).filter(r => !isNaN(r.value));
          if (parsed.length >= 2) return { dataset, parsed, years: availableYears };
        }
      } catch (err) {
        console.warn("Lewati dataset saat mencari data per kabupaten/kota:", err.message);
      }
    }
    return null;
  }

  async function exploreQuestion(id, selectedYear = questionYear) {
    setActiveQuestion(id);
    setQuestionLoading(true);
    setQuestionResult(null);
    setQuestionError("");
    setQuestionYears([]);
    try {
      const question = questions.find(item => item.id === id);
      if (question) {
        const rankedCandidates = [...visibleDatasets].sort((a, b) => {
          const score = dataset => {
            const text = `${dataset.judul || ""} ${dataset.deskripsi || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
            return question.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? 1 : 0), 0);
          };
          return score(b) - score(a);
        });

        if (question.visual === "trend") {
          const matchedSeries = visibleSeries.filter(item => {
            const text = item.title.toLowerCase();
            return question.keywords.some(keyword => text.includes(keyword));
          });
          const candidates = matchedSeries.length ? matchedSeries : visibleSeries;
          const movers = candidates.filter(item => item.data?.length >= 2).map(item => {
            const data = item.data.slice(-5);
            const first = data[0], last = data[data.length - 1];
            return { title: item.title, satuan: item.satuan, data, from: first, to: last, change: first?.value ? ((last.value - first.value) / Math.abs(first.value)) * 100 : null };
          }).filter(item => item.change !== null).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 5);
          if (!movers.length) {
            setQuestionError("Data tren antar tahun belum cukup untuk menjawab pertanyaan ini.");
            return;
          }
          setQuestionResult({ type: "trend-5y", movers, question });
          return;
        }

        if (question.visual === "composition") {
          setQuestionResult({ type: "factors", groupCounts, unitCounts, question });
          return;
        }

        const found = await findRegionalDataset(rankedCandidates, selectedYear);
        if (!found) {
          setQuestionError("Belum ada dataset dengan rincian kabupaten/kota yang dapat digunakan untuk menjawab pertanyaan ini.");
          return;
        }
        const regionalComparison = [...found.parsed].sort((a, b) => b.value - a.value);
        const asksForLowest = /(terendah|di bawah|kekurangan|belum|tertinggal|prioritas)/i.test(question.text);
        const primary = asksForLowest ? regionalComparison[regionalComparison.length - 1] : regionalComparison[0];
        setQuestionYears(found.years);
        setQuestionResult({
          type: "regional",
          question,
          dataset: found.dataset,
          regionalComparison,
          regionalStats: summarizeRegions(regionalComparison),
          primary,
          satuan: found.dataset.satuan || "nilai",
          year: selectedYear || found.years[0] || "terbaru",
          datasetCount: visibleDatasets.length
        });
        return;
      }

      if (id === "top-bottom") {
        const found = await findRegionalDataset(visibleDatasets, selectedYear);
        if (!found) { setQuestionError("Belum ada dataset bertema masyarakat dengan rincian per kabupaten/kota untuk pertanyaan ini."); return; }
        const sorted = [...found.parsed].sort((a, b) => b.value - a.value);
        const regionalComparison = sorted;
        const bottom = sorted[sorted.length - 1];
        setQuestionYears(found.years);
        setQuestionResult({ type: "top-bottom", dataset: found.dataset, top: sorted[0], bottom, regionalComparison, regionalStats: summarizeRegions(regionalComparison), satuan: found.dataset.satuan || "nilai", year: selectedYear || found.years[0] || "terbaru", datasetCount: visibleDatasets.length });
      } else if (id === "trend-5y") {
        const withTrend = comparableTrends.filter(item => item.data && item.data.length >= 2);
        const movers = [...withTrend]
          .map(item => {
            const recent = item.data.slice(-5);
            const first = recent[0], last = recent[recent.length - 1];
            const change = first?.value ? ((last.value - first.value) / Math.abs(first.value)) * 100 : null;
            return { title: item.title, satuan: item.satuan, data: recent, from: first, to: last, change };
          })
          .filter(item => item.change !== null)
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
          .slice(0, 5);
        if (!movers.length) { setQuestionError("Data tren antar tahun belum cukup untuk indikator yang sedang tampil."); return; }
        setQuestionResult({ type: "trend-5y", movers });
      } else if (id === "vulnerable") {
        const candidates = visibleDatasets.filter(d => ["Perempuan & Anak", "Disabilitas", "Lansia"].includes(getCommunityGroup(d)));
        const found = await findRegionalDataset(candidates.length ? candidates : visibleDatasets, selectedYear);
        if (!found) { setQuestionError("Belum ada dataset penduduk rentan (perempuan/anak/lansia/disabilitas) dengan rincian per kabupaten/kota."); return; }
        const regionalComparison = [...found.parsed].sort((a, b) => b.value - a.value);
        const sorted = regionalComparison.slice(0, 5);
        setQuestionYears(found.years);
        setQuestionResult({ type: "vulnerable", dataset: found.dataset, ranking: sorted, regionalComparison, regionalStats: summarizeRegions(regionalComparison), satuan: found.dataset.satuan || "nilai", year: selectedYear || found.years[0] || "terbaru", datasetCount: visibleDatasets.length });
      } else if (id === "coastal-inland") {
        const found = await findRegionalDataset(visibleDatasets, selectedYear);
        if (!found) { setQuestionError("Belum ada dataset dengan rincian per kabupaten/kota untuk dibandingkan antarwilayah."); return; }
        const groups = { pesisir: [], pedalaman: [], "tidak diketahui": [] };
        found.parsed.forEach(row => {
          const clean = stripAdminPrefix(row.geoLabel?.split(" — ")[0] || row.geoLabel);
          const region = ACEH_REGION_MAP[clean] || "tidak diketahui";
          groups[region].push(row.value);
        });
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        setQuestionResult({
          type: "coastal-inland",
          dataset: found.dataset,
          satuan: found.dataset.satuan || "nilai",
          pesisir: { avg: avg(groups.pesisir), n: groups.pesisir.length },
          pedalaman: { avg: avg(groups.pedalaman), n: groups.pedalaman.length },
          unknownCount: groups["tidak diketahui"].length,
          year: selectedYear || found.years[0] || "terbaru",
          datasetCount: visibleDatasets.length
        });
        setQuestionYears(found.years);
      } else if (id === "factors") {
        setQuestionYears([]);
        setQuestionResult({ type: "factors", groupCounts, unitCounts });
      }
    } finally {
      setQuestionLoading(false);
    }
  }

  return (
    <main className="community-dashboard-page">
      <nav className="dashboard-page-nav" aria-label="Navigasi portal">
        <a href="?">Beranda</a>
        <a href="?#datasets">Dataset</a>
        <a href="?#dashboards">Semua Dashboard</a>
        <a href="?#instansi">Instansi</a>
        <a href="?page=topic&topic=Semua">Group Data</a>
        <a href="?page=all-orgs">Bidang Urusan</a>
        <a href="?page=feature&feature=Dokumen%20Geospasial">Mapset</a>
      </nav>
      <a className="back-link dashboard-home-link" href="?" aria-label="Kembali ke halaman beranda Satu Data Aceh">← Kembali ke beranda</a>
      <section className="community-dashboard-hero">
        <span>DASHBOARD {themeLabel.toUpperCase()}</span>
        <h1>{title}</h1>
        <p>{themeDescription} Dashboard memuat data terbaru saat halaman dibuka.</p>
        <div className="topic-search-bar">
          <input
            type="search"
            placeholder={`Cari indikator atau pertanyaan seputar ${themeLabel}... (mis. "stunting", "jalan rusak", "kemiskinan")`}
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
      </section>

      {loading ? <div className="search-result-message"><p>Menyiapkan perbandingan dataset {themeLabel}...</p></div> : error ? <div className="search-result-message"><p>{error}</p></div> : normalizedSearch && visibleDatasets.length === 0 ? (
        <div className="search-result-message"><p>Tidak ada dataset {themeLabel} yang cocok dengan kata kunci "{search}". Coba kata kunci lain.</p></div>
      ) : (
        <>
          {normalizedSearch && (
            <div className="banner">
              Menampilkan {visibleDatasets.length} dari {datasets.length} dataset {themeLabel} untuk pencarian "{search}"
            </div>
          )}

          <section className="community-source-panel panel wide" aria-label="Sumber gabungan dataset">
            <div className="comparison-chart-heading">
              <div>
                <h2>Dashboard Ini Menggabungkan Data Dari {orgBreakdown.length} OPD</h2>
                <div className="sub">Rincian jumlah dataset yang disumbangkan tiap instansi ke dashboard {themeLabel} ini.</div>
              </div>
            </div>
            {orgBreakdown.length === 0 ? (
              <p className="community-empty">Belum ada dataset dengan informasi OPD untuk ditampilkan.</p>
            ) : (
              <ul className="instansi-list">
                {orgBreakdown.map(org => (
                  <li key={org.name}>
                    <span>{org.name}</span>
                    <span className="badge">{org.count} dataset</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {questions.length > 0 && (
            <section className="panel community-insight-panel" aria-label="Pertanyaan kunci dashboard">
              <div className="comparison-chart-heading">
                <div>
                  <h2>Pertanyaan Kunci</h2>
                  <div className="sub">Klik salah satu pertanyaan untuk melihat jawabannya berdasarkan dataset yang sedang tampil.</div>
                </div>
              </div>
              <div className="community-insight-grid" style={{ gridTemplateColumns: "1fr" }}>
                {questions.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setQuestionYear("");
                      exploreQuestion(q.id, "");
                    }}
                    className={"row-link"}
                    style={{ width: "100%", textAlign: "left", cursor: "pointer", border: activeQuestion === q.id ? "1.5px solid var(--accent)" : undefined }}
                  >
                    <span className="name">{q.text}</span>
                    <span className="meta">{activeQuestion === q.id ? (questionLoading ? "Memuat..." : "Lihat jawaban ↓") : "Klik untuk lihat jawaban"}</span>
                  </button>
                ))}
              </div>

             {activeQuestion && (
               <div className="community-insight-note" style={{ marginTop: 16 }}>
                  {questionYears.length > 0 && !questionLoading && (
                    <label className="question-year-filter">
                      <span>Filter tahun</span>
                      <select
                        value={questionYear}
                        onChange={event => {
                          const year = event.target.value;
                          setQuestionYear(year);
                          exploreQuestion(activeQuestion, year);
                        }}
                      >
                        <option value="">Tahun terbaru tersedia</option>
                        {questionYears.map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </label>
                  )}
                  {questionLoading && <p>Menganalisis dataset untuk menjawab pertanyaan ini...</p>}
                  {!questionLoading && questionError && <p>{questionError}</p>}

                  {!questionLoading && questionResult?.type === "top-bottom" && (
                    <div>
                      <p>Berdasarkan dataset <b>{questionResult.dataset.judul}</b> ({questionResult.dataset.organisasi?.nama || "OPD tidak tercantum"}), tahun <b>{questionResult.year}</b>:</p>
                      <p>Tertinggi: <b>{questionResult.top.geoLabel}</b> — {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.top.value)} {questionResult.satuan}</p>
                      <p>Terendah: <b>{questionResult.bottom.geoLabel}</b> — {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.bottom.value)} {questionResult.satuan}</p>
                      <p><i>Catatan: hasil ini berdasarkan satu indikator representatif yang ditemukan pada dataset masyarakat yang sedang tampil, bukan indeks kesejahteraan gabungan resmi.</i></p>
                    </div>
                  )}

                  {!questionLoading && questionResult?.type === "trend-5y" && (
                    <div>
                      <p>Perubahan pada hingga 5 titik data terakhir untuk indikator dengan pergerakan paling besar:</p>
                      <ul>
                        {questionResult.movers.map(m => (
                          <li key={m.title}>
                            <b>{m.title}</b>: {m.from.year} ({new Intl.NumberFormat("id-ID").format(m.from.value)}) → {m.to.year} ({new Intl.NumberFormat("id-ID").format(m.to.value)}) — {m.change > 0 ? "naik" : "turun"} {Math.abs(m.change).toFixed(1)}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!questionLoading && questionResult?.type === "vulnerable" && (
                    <div>
                      <p>Berdasarkan dataset <b>{questionResult.dataset.judul}</b>, tahun <b>{questionResult.year}</b>, 5 wilayah dengan angka tertinggi:</p>
                      <ol>
                        {questionResult.ranking.map(r => (
                          <li key={r.geoLabel}>{r.geoLabel} — {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(r.value)} {questionResult.satuan}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {!questionLoading && questionResult?.type === "coastal-inland" && (
                    <div>
                      <p>Berdasarkan dataset <b>{questionResult.dataset.judul}</b> ({questionResult.satuan}), tahun <b>{questionResult.year}</b>:</p>
                      <p>Rata-rata wilayah pesisir ({questionResult.pesisir.n} wilayah): <b>{questionResult.pesisir.avg != null ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.pesisir.avg) : "—"}</b></p>
                      <p>Rata-rata wilayah pedalaman ({questionResult.pedalaman.n} wilayah): <b>{questionResult.pedalaman.avg != null ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.pedalaman.avg) : "—"}</b></p>
                      {questionResult.unknownCount > 0 && <p><i>{questionResult.unknownCount} wilayah belum masuk klasifikasi pesisir/pedalaman.</i></p>}
                      <p><i>Klasifikasi pesisir/pedalaman bersifat perkiraan geografis umum, bukan data resmi administratif.</i></p>
                    </div>
                  )}

                  {!questionLoading && questionResult?.type === "factors" && (
                    <div>
                      <p>Dashboard ini belum bisa melakukan analisis korelasi statistik antar-indikator, jadi angka "faktor paling berpengaruh" secara kausal tidak bisa dijawab dari data yang ada. Yang bisa ditunjukkan secara deskriptif adalah isu mana yang paling banyak didata:</p>
                      <ol>
                        {questionResult.groupCounts.slice(0, 5).map(g => (
                          <li key={g.label}>{g.label} — {g.value} dataset</li>
                        ))}
                      </ol>
                      <p><i>Ini menunjukkan cakupan data, bukan bukti sebab-akibat. Analisis faktor yang valid butuh uji statistik (mis. regresi) di luar cakupan dashboard ini.</i></p>
                    </div>
                  )}

                  {!questionLoading && questionResult?.type === "regional" && (
                    <div>
                      <p>Berdasarkan dataset <b>{questionResult.dataset.judul}</b>, tahun <b>{questionResult.year}</b>:</p>
                      <p>Wilayah yang paling perlu diperhatikan pada indikator ini adalah <b>{questionResult.primary.geoLabel}</b> — {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.primary.value)} {questionResult.satuan}.</p>
                      <p><i>Peta dan ranking di bawah membandingkan seluruh kabupaten/kota yang tersedia pada indikator yang sama. Interpretasi nilai tinggi/rendah mengikuti definisi dataset sumber.</i></p>
                    </div>
                  )}

                  {!questionLoading && ["top-bottom", "vulnerable", "regional"].includes(questionResult?.type) && (
                    <section className="regional-analysis">
                      <div className="regional-analysis-head">
                        <div>
                          <h3>Gambaran Spasial Kabupaten/Kota Aceh</h3>
                          <p>Warna yang lebih pekat menunjukkan nilai yang lebih tinggi pada indikator dan tahun yang dipilih.</p>
                        </div>
                        <span>{questionResult.regionalStats.count} wilayah dibandingkan</span>
                      </div>
                      <div className="regional-stat-grid">
                        <article><strong>{new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.regionalStats.average)}</strong><span>Rata-rata seluruh wilayah</span></article>
                        <article><strong>{new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(questionResult.regionalStats.median)}</strong><span>Nilai tengah wilayah</span></article>
                        <article><strong>{questionResult.top?.geoLabel || questionResult.ranking?.[0]?.geoLabel || questionResult.regionalComparison?.[0]?.geoLabel}</strong><span>Wilayah dengan nilai tertinggi</span></article>
                      </div>
                      <div className="regional-map-wrap" ref={regionalMapRef}></div>
                      <p className="regional-method-note">Peta dan ranking memakai indikator yang sama agar perbandingan antarwilayah tetap setara. Nilai tinggi tidak otomatis berarti kondisi lebih baik; maknanya mengikuti definisi indikator sumber.</p>
                    </section>
                  )}

                  {questionChartData?.length > 0 && (
                    <div className="community-question-chart">
                      <h3>{questionResult?.type === "coastal-inland" ? "Diagram Rata-rata Antarwilayah" : "Ranking Lengkap Kabupaten/Kota"}</h3>
                      <p>{questionResult?.type === "coastal-inland" ? "Membandingkan rerata wilayah pesisir dan pedalaman." : "Membandingkan seluruh wilayah yang tersedia pada dataset untuk tahun terpilih."} Dataset ini dipilih dari cakupan {questionResult?.datasetCount || visibleDatasets.length} dataset yang sedang tampil. Arahkan kursor ke batang untuk melihat nilai lengkap.</p>
                      <div ref={questionChartRef}></div>
                    </div>
                  )}

                  {questionResult?.type === "trend-5y" && (
                    <div className="community-question-chart">
                      <h3>Diagram Tren Indikator</h3>
                      <p>Setiap garis menunjukkan perkembangan indikator dengan perubahan terbesar dalam lima periode terakhir.</p>
                      <div ref={questionChartRef}></div>
                    </div>
                  )}

                  {questionResult?.type === "factors" && (
                    <div className="community-question-chart">
                      <h3>Diagram Komposisi Cakupan Isu</h3>
                      <p>Diagram donat menunjukkan proporsi dataset per isu sosial; ini menggambarkan cakupan data, bukan hubungan sebab-akibat.</p>
                      <div ref={questionChartRef}></div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="community-stat-grid" aria-label={`Ringkasan dashboard ${themeLabel}`}>
            <article><strong>{visibleDatasets.length}</strong><span>Dataset {themeLabel}</span></article>
            <article><strong>{organizations}</strong><span>OPD penyedia data</span></article>
            <article><strong>{visibleSeries.length}</strong><span>Dataset pada grafik tren</span></article>
          </section>

          <section className="panel community-insight-panel" aria-label="Kesimpulan dashboard">
            <div className="comparison-chart-heading">
              <div>
                <h2>Kesimpulan Dashboard</h2>
                <div className="sub">Ringkasan otomatis berdasarkan cakupan dataset dan tren yang sudah berhasil dimuat.</div>
              </div>
              {trendLoading && <span className="comparison-tip">Tren masih dilengkapi</span>}
            </div>
            <div className="community-insight-grid">
              <article><strong>{dominantGroup?.label || "—"}</strong><span>Kelompok terbanyak: {dominantGroup?.value || 0} dataset</span></article>
              <article><strong>{dominantUnit?.label || "—"}</strong><span>Satuan yang paling sering digunakan: {dominantUnit?.value || 0} dataset</span></article>
              <article><strong>{risingTrends} naik · {fallingTrends} turun</strong><span>Dari {comparableTrends.length} indikator yang dapat dibandingkan antarwaktu</span></article>
            </div>
            <p className="community-insight-note">
              {largestChange
                ? <>Perubahan relatif paling besar sementara terlihat pada <b>{largestChange.title}</b> ({largestChange.change > 0 ? "+" : ""}{largestChange.change.toFixed(1)}%).</>
                : "Kesimpulan perubahan tren akan muncul setelah minimal dua periode data tersedia."}
            </p>
          </section>

          <section className="community-dashboard-grid">
            <section className="panel community-trend-panel">
              <div className="comparison-chart-heading">
                <div>
                  <h2>Perbandingan Tren Indikator</h2>
                  <div className="sub">Membandingkan hingga 6 indikator dengan riwayat terpanjang. Semua garis dimulai dari indeks 100 agar perubahan antar satuan mudah dibandingkan.</div>
                </div>
                <span className="comparison-tip">Arahkan kursor ke titik grafik</span>
              </div>
              {series.length ? <div ref={trendRef}></div> : trendLoading ? <p className="community-empty">Menyiapkan grafik tren...</p> : <p className="community-empty">Data tren belum tersedia untuk dataset {themeLabel} yang ditemukan.</p>}
            </section>

            <section className="panel community-org-panel">
              <h2>Dataset per OPD</h2>
              <div className="sub">Perbandingan jumlah seluruh dataset {themeLabel} dari setiap instansi.</div>
              <svg ref={orgChartRef} width="100%" height="500"></svg>
            </section>
          </section>

          <section className="community-extra-chart-grid">
            <section className="panel">
                <h2>{compositionTitle}</h2>
              <div className="sub">Perbandingan cakupan dataset berdasarkan kelompok sasaran dan isu {themeLabel}.</div>
              <div ref={groupChartRef}></div>
            </section>
            <section className="panel">
              <h2>Jenis Satuan Indikator</h2>
              <div className="sub">Perbandingan bentuk pengukuran pada dataset {themeLabel}.</div>
              <div ref={unitChartRef}></div>
            </section>
          </section>

          <section className="panel community-dataset-panel">
            <div className="comparison-chart-heading">
              <div>
                <h2>Cakupan Dataset {coverageTitle}</h2>
                <div className="sub">Seluruh dataset yang digunakan sebagai cakupan dashboard ini.</div>
              </div>
              <span className="community-dataset-count">{visibleDatasets.length} dataset</span>
            </div>
            <ul className="community-dataset-list">
              {visibleDatasets.map(dataset => (
                <li key={dataset.uuid}>
                  <a href={`?dataset=${dataset.uuid}`}>{dataset.judul || "Tanpa judul"}</a>
                  <span>{dataset.organisasi?.nama || "Instansi belum tercantum"}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
