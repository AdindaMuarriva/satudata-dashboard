export const SOCIAL_QUESTION_CATEGORIES = [
  { id: "kemiskinan", label: "01", title: "Kemiskinan & Bantuan Sosial", description: "Meninjau kemiskinan, bantuan sosial, dan kondisi kesejahteraan masyarakat." },
  { id: "perempuan-anak", label: "02", title: "Perempuan & Anak", description: "Melihat indikator perlindungan, pemberdayaan, dan kesejahteraan perempuan serta anak." },
  { id: "disabilitas-lansia", label: "03", title: "Disabilitas & Lansia", description: "Memahami kebutuhan layanan bagi penyandang disabilitas dan lanjut usia." },
  { id: "kependudukan", label: "04", title: "Kependudukan & Keluarga", description: "Menganalisis kondisi penduduk, keluarga, dan kelompok masyarakat." },
  { id: "perlindungan", label: "05", title: "Perlindungan & Kesejahteraan Sosial", description: "Meninjau layanan, rehabilitasi, dan program perlindungan sosial." }
];

export const SOCIAL_QUESTIONS = [
  { id: "sosial-kemiskinan", category: "kemiskinan", title: "Kabupaten mana yang memiliki angka kemiskinan tertinggi?", description: "Membandingkan kondisi kemiskinan antar kabupaten/kota di Aceh.", keywords: ["kemiskinan", "miskin", "kabupaten"], expectedDatasetType: "kemiskinan_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-tren-kemiskinan", category: "kemiskinan", title: "Bagaimana perkembangan angka kemiskinan selama beberapa tahun terakhir?", description: "Meninjau perubahan tingkat kemiskinan dari waktu ke waktu.", keywords: ["kemiskinan", "tahun", "perkembangan"], expectedDatasetType: "tren_kemiskinan", recommendedChart: "Line Chart" },
  { id: "sosial-bansos", category: "kemiskinan", title: "Bagaimana sebaran penerima bantuan sosial di Aceh?", description: "Melihat perbandingan penerima bantuan sosial antar wilayah.", keywords: ["bantuan sosial", "bansos", "penerima"], expectedDatasetType: "bansos_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-perempuan", category: "perempuan-anak", title: "Bagaimana kondisi pemberdayaan perempuan di Aceh?", description: "Menampilkan indikator pemberdayaan dan perlindungan perempuan.", keywords: ["perempuan", "gender", "pemberdayaan"], expectedDatasetType: "indikator_perempuan", recommendedChart: "Bar Chart" },
  { id: "sosial-anak", category: "perempuan-anak", title: "Wilayah mana yang membutuhkan prioritas perlindungan anak?", description: "Membandingkan indikator kesejahteraan dan perlindungan anak antar wilayah.", keywords: ["anak", "perlindungan anak", "kabupaten"], expectedDatasetType: "perlindungan_anak_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-gender", category: "perempuan-anak", title: "Bagaimana perkembangan indikator kesetaraan gender?", description: "Meninjau perubahan indikator gender pada periode yang tersedia.", keywords: ["gender", "kesetaraan", "tahun"], expectedDatasetType: "tren_gender", recommendedChart: "Line Chart" },
  { id: "sosial-disabilitas", category: "disabilitas-lansia", title: "Kabupaten mana yang memiliki jumlah penyandang disabilitas tertinggi?", description: "Membandingkan jumlah penyandang disabilitas antar kabupaten/kota.", keywords: ["disabilitas", "penyandang", "kabupaten"], expectedDatasetType: "disabilitas_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-lansia", category: "disabilitas-lansia", title: "Bagaimana sebaran penduduk lanjut usia di Aceh?", description: "Melihat perbandingan jumlah atau proporsi lansia antar wilayah.", keywords: ["lansia", "lanjut usia", "penduduk"], expectedDatasetType: "lansia_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-layanan-disabilitas", category: "disabilitas-lansia", title: "Bagaimana cakupan layanan sosial bagi disabilitas dan lansia?", description: "Meninjau layanan sosial yang tersedia bagi kelompok rentan.", keywords: ["layanan sosial", "disabilitas", "lansia"], expectedDatasetType: "layanan_kelompok_rentan", recommendedChart: "Pie Chart" },
  { id: "sosial-penduduk", category: "kependudukan", title: "Bagaimana jumlah penduduk di setiap kabupaten/kota?", description: "Membandingkan jumlah penduduk antar wilayah di Aceh.", keywords: ["penduduk", "kependudukan", "kabupaten"], expectedDatasetType: "penduduk_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-pertumbuhan", category: "kependudukan", title: "Bagaimana perkembangan pertumbuhan penduduk?", description: "Meninjau pertumbuhan jumlah penduduk dari waktu ke waktu.", keywords: ["pertumbuhan penduduk", "penduduk", "tahun"], expectedDatasetType: "tren_penduduk", recommendedChart: "Line Chart" },
  { id: "sosial-keluarga", category: "kependudukan", title: "Bagaimana kondisi keluarga di Aceh?", description: "Menampilkan indikator keluarga dan kesejahteraan keluarga yang tersedia.", keywords: ["keluarga", "kesejahteraan keluarga", "penduduk"], expectedDatasetType: "indikator_keluarga", recommendedChart: "Bar Chart" },
  { id: "sosial-ppks", category: "perlindungan", title: "Bagaimana sebaran Pemerlu Pelayanan Kesejahteraan Sosial?", description: "Membandingkan kelompok penerima layanan kesejahteraan sosial antar wilayah.", keywords: ["ppks", "kesejahteraan sosial", "pelayanan"], expectedDatasetType: "ppks_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "sosial-rehabilitasi", category: "perlindungan", title: "Bagaimana cakupan layanan rehabilitasi sosial?", description: "Meninjau layanan rehabilitasi sosial yang tersedia bagi masyarakat.", keywords: ["rehabilitasi sosial", "layanan sosial", "masyarakat"], expectedDatasetType: "rehabilitasi_sosial", recommendedChart: "Bar Chart" },
  { id: "sosial-kelompok-rentan", category: "perlindungan", title: "Kelompok rentan mana yang perlu menjadi prioritas layanan sosial?", description: "Melihat komposisi kelompok rentan berdasarkan indikator yang tersedia.", keywords: ["kelompok rentan", "layanan sosial", "perlindungan sosial"], expectedDatasetType: "kelompok_rentan", recommendedChart: "Donut Chart" }
];

function getSocialCategory(dataset) {
  const text = `${dataset.judul || ""} ${dataset.deskripsi || ""} ${dataset.bidang || ""}`.toLocaleLowerCase("id-ID");
  if (/miskin|kemiskinan|bansos|bantuan sosial|pkh/.test(text)) return "kemiskinan";
  if (/perempuan|anak|gender/.test(text)) return "perempuan-anak";
  if (/disabilitas|penyandang|lansia|lanjut usia/.test(text)) return "disabilitas-lansia";
  if (/penduduk|kependudukan|keluarga|kelahiran/.test(text)) return "kependudukan";
  return "perlindungan";
}

export function createSocialDatasetQuestions(datasets = []) {
  return datasets.map(dataset => {
    const title = String(dataset.judul || "Data sosial").replace(/\s+/g, " ").trim();
    const dashboardQuestion = String(dataset.dashboardQuestion || "").replace(/\s+/g, " ").trim();
    return {
      id: `social-dataset-${dataset.uuid}`,
      category: getSocialCategory(dataset),
      title: dashboardQuestion || `Bagaimana visualisasi ${title}?`,
      description: dataset.dashboardQuestionDescription || dataset.deskripsi || `Menampilkan visualisasi ${title} berdasarkan data Portal Satu Data Aceh.`,
      keywords: (dashboardQuestion || title).split(/\s+/).filter(word => word.length > 2),
      datasetUuid: dataset.uuid,
      expectedDatasetType: "dataset_sosial_portal",
      recommendedChart: "Bar Chart"
    };
  });
}
