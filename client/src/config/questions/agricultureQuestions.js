export const AGRICULTURE_QUESTION_CATEGORIES = [
  { id: "lahan", label: "01", title: "Lahan Pertanian", description: "Memahami sebaran, kapasitas, dan perubahan lahan pertanian." },
  { id: "tanaman", label: "02", title: "Produksi Tanaman", description: "Membandingkan produksi, panen, dan komoditas tanaman pangan." },
  { id: "irigasi", label: "03", title: "Irigasi", description: "Meninjau ketersediaan dan kondisi dukungan irigasi pertanian." },
  { id: "peternakan", label: "04", title: "Peternakan", description: "Melihat potensi ternak dan perkembangan produksi peternakan." },
  { id: "perikanan", label: "05", title: "Perikanan", description: "Mengeksplorasi produksi dan potensi perikanan daerah." },
  { id: "pangan", label: "06", title: "Ketahanan Pangan", description: "Meninjau indikator penting untuk mendukung ketahanan pangan." }
];

export const AGRICULTURE_QUESTIONS = [
  {
    id: "lahan-1", category: "lahan", title: "Berapa luas lahan pertanian di setiap kabupaten?",
    description: "Membandingkan luas lahan pertanian antar kabupaten/kota pada satu periode.",
    keywords: ["luas lahan", "lahan pertanian", "kabupaten", "hektare"],
    expectedDatasetType: "luas_lahan_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "lahan-2", category: "lahan", title: "Bagaimana perkembangan luas lahan selama 5 tahun terakhir?",
    description: "Meninjau perubahan luas lahan pertanian dari waktu ke waktu.",
    keywords: ["luas lahan", "perkembangan", "tahun", "lahan pertanian"],
    expectedDatasetType: "tren_luas_lahan", recommendedChart: "Line Chart"
  },
  {
    id: "lahan-3", category: "lahan", title: "Kabupaten mana yang memiliki lahan pertanian terbesar?",
    description: "Menyusun peringkat kabupaten/kota berdasarkan luas lahan pertanian.",
    keywords: ["lahan pertanian", "luas lahan", "kabupaten", "terbesar"],
    expectedDatasetType: "ranking_luas_lahan", recommendedChart: "Bar Chart"
  },
  {
    id: "tanaman-1", category: "tanaman", title: "Kabupaten mana yang memiliki produksi padi terbesar?",
    description: "Membandingkan produksi padi antar kabupaten/kota.",
    keywords: ["produksi padi", "padi", "gabah", "kabupaten"],
    expectedDatasetType: "produksi_padi_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "tanaman-2", category: "tanaman", title: "Bagaimana perkembangan hasil panen?",
    description: "Meninjau tren hasil panen pertanian pada beberapa periode.",
    keywords: ["hasil panen", "panen", "produksi", "tahun"],
    expectedDatasetType: "tren_hasil_panen", recommendedChart: "Line Chart"
  },
  {
    id: "tanaman-3", category: "tanaman", title: "Tanaman apa yang paling banyak dibudidayakan?",
    description: "Membandingkan komoditas tanaman berdasarkan luas tanam atau produksi.",
    keywords: ["komoditas", "tanaman", "budidaya", "produksi"],
    expectedDatasetType: "komposisi_komoditas_tanaman", recommendedChart: "Pie Chart"
  },
  {
    id: "irigasi-1", category: "irigasi", title: "Bagaimana kondisi irigasi pertanian?",
    description: "Merangkum cakupan dan kondisi infrastruktur irigasi pertanian.",
    keywords: ["irigasi", "jaringan irigasi", "kondisi", "pertanian"],
    expectedDatasetType: "kondisi_irigasi", recommendedChart: "KPI Card"
  },
  {
    id: "irigasi-2", category: "irigasi", title: "Kabupaten mana yang memiliki irigasi terbaik?",
    description: "Membandingkan indikator irigasi antar kabupaten/kota.",
    keywords: ["irigasi", "kabupaten", "terbaik", "jaringan irigasi"],
    expectedDatasetType: "ranking_irigasi_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "peternakan-1", category: "peternakan", title: "Kabupaten mana yang memiliki populasi ternak terbesar?",
    description: "Menyusun peringkat populasi ternak antar kabupaten/kota.",
    keywords: ["populasi ternak", "peternakan", "kabupaten", "sapi"],
    expectedDatasetType: "populasi_ternak_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "peternakan-2", category: "peternakan", title: "Bagaimana perkembangan produksi peternakan?",
    description: "Meninjau perubahan produksi peternakan dari waktu ke waktu.",
    keywords: ["produksi peternakan", "ternak", "perkembangan", "tahun"],
    expectedDatasetType: "tren_produksi_peternakan", recommendedChart: "Line Chart"
  },
  {
    id: "perikanan-1", category: "perikanan", title: "Kabupaten mana yang memiliki produksi perikanan terbesar?",
    description: "Membandingkan produksi perikanan antar kabupaten/kota.",
    keywords: ["produksi perikanan", "perikanan", "ikan", "kabupaten"],
    expectedDatasetType: "produksi_perikanan_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "perikanan-2", category: "perikanan", title: "Bagaimana perkembangan hasil perikanan?",
    description: "Meninjau tren hasil produksi perikanan pada beberapa periode.",
    keywords: ["hasil perikanan", "produksi perikanan", "ikan", "tahun"],
    expectedDatasetType: "tren_hasil_perikanan", recommendedChart: "Line Chart"
  },
  {
    id: "pangan-1", category: "pangan", title: "Bagaimana perkembangan produksi pangan strategis?",
    description: "Meninjau tren produksi komoditas pangan strategis.",
    keywords: ["produksi pangan", "pangan strategis", "komoditas", "tahun"],
    expectedDatasetType: "tren_produksi_pangan", recommendedChart: "Line Chart"
  },
  {
    id: "pangan-2", category: "pangan", title: "Daerah mana yang memiliki potensi produksi pangan terbesar?",
    description: "Membandingkan potensi produksi pangan antar wilayah.",
    keywords: ["potensi pangan", "produksi pangan", "wilayah", "kabupaten"],
    expectedDatasetType: "potensi_produksi_pangan_per_wilayah", recommendedChart: "Choropleth Map"
  }
];
