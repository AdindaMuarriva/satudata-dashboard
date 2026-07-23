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
    id: "lahan-4", category: "lahan", title: "Bagaimana perbandingan luas sawah dan lahan bukan sawah?",
    description: "Membandingkan komposisi penggunaan lahan pertanian pada setiap wilayah.",
    keywords: ["sawah", "lahan bukan sawah", "luas lahan", "pertanian"],
    expectedDatasetType: "komposisi_jenis_lahan", recommendedChart: "Pie Chart"
  },
  {
    id: "lahan-5", category: "lahan", title: "Kabupaten mana yang mengalami perubahan luas lahan terbesar?",
    description: "Mengidentifikasi wilayah dengan kenaikan atau penurunan luas lahan paling besar.",
    keywords: ["perubahan lahan", "luas lahan", "kabupaten", "tahun"],
    expectedDatasetType: "perubahan_luas_lahan_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "lahan-6", category: "lahan", title: "Bagaimana sebaran lahan pertanian di Aceh?",
    description: "Melihat persebaran luas lahan pertanian antar kabupaten/kota di Aceh.",
    keywords: ["sebaran lahan", "lahan pertanian", "aceh", "kabupaten"],
    expectedDatasetType: "sebaran_lahan_pertanian", recommendedChart: "Choropleth Map"
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
    id: "tanaman-4", category: "tanaman", title: "Bagaimana perbandingan produktivitas tanaman pangan antar kabupaten?",
    description: "Membandingkan hasil produksi per satuan luas untuk setiap kabupaten/kota.",
    keywords: ["produktivitas", "tanaman pangan", "kabupaten", "hasil panen"],
    expectedDatasetType: "produktivitas_tanaman_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "tanaman-5", category: "tanaman", title: "Komoditas tanaman apa yang produksinya meningkat paling tinggi?",
    description: "Meninjau pertumbuhan produksi setiap komoditas tanaman antar periode.",
    keywords: ["komoditas", "produksi", "meningkat", "tanaman"],
    expectedDatasetType: "pertumbuhan_produksi_komoditas", recommendedChart: "Line Chart"
  },
  {
    id: "tanaman-6", category: "tanaman", title: "Bagaimana luas panen tanaman pangan setiap tahun?",
    description: "Melihat perkembangan luas panen tanaman pangan dari waktu ke waktu.",
    keywords: ["luas panen", "tanaman pangan", "tahun", "produksi"],
    expectedDatasetType: "tren_luas_panen_tanaman", recommendedChart: "Line Chart"
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
    id: "irigasi-3", category: "irigasi", title: "Berapa luas lahan pertanian yang terlayani irigasi?",
    description: "Meninjau cakupan layanan irigasi pada lahan pertanian di setiap wilayah.",
    keywords: ["luas layanan", "irigasi", "lahan pertanian", "kabupaten"],
    expectedDatasetType: "cakupan_layanan_irigasi", recommendedChart: "Bar Chart"
  },
  {
    id: "irigasi-4", category: "irigasi", title: "Bagaimana kondisi jaringan irigasi dari tahun ke tahun?",
    description: "Melihat perubahan kondisi baik, rusak ringan, dan rusak berat pada jaringan irigasi.",
    keywords: ["kondisi irigasi", "jaringan irigasi", "tahun", "rusak"],
    expectedDatasetType: "tren_kondisi_irigasi", recommendedChart: "Line Chart"
  },
  {
    id: "irigasi-5", category: "irigasi", title: "Wilayah mana yang membutuhkan prioritas perbaikan irigasi?",
    description: "Mengidentifikasi wilayah dengan proporsi jaringan irigasi rusak tertinggi.",
    keywords: ["irigasi rusak", "perbaikan", "prioritas", "kabupaten"],
    expectedDatasetType: "prioritas_perbaikan_irigasi", recommendedChart: "Bar Chart"
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
    id: "peternakan-3", category: "peternakan", title: "Jenis ternak apa yang memiliki populasi terbesar?",
    description: "Membandingkan jumlah populasi antar jenis ternak di Aceh.",
    keywords: ["jenis ternak", "populasi ternak", "sapi", "kambing"],
    expectedDatasetType: "komposisi_populasi_ternak", recommendedChart: "Pie Chart"
  },
  {
    id: "peternakan-4", category: "peternakan", title: "Bagaimana produksi telur di setiap kabupaten?",
    description: "Membandingkan produksi telur antar kabupaten/kota.",
    keywords: ["produksi telur", "peternakan", "kabupaten", "unggas"],
    expectedDatasetType: "produksi_telur_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "peternakan-5", category: "peternakan", title: "Bagaimana perkembangan populasi sapi potong?",
    description: "Meninjau perubahan jumlah populasi sapi potong dari waktu ke waktu.",
    keywords: ["sapi potong", "populasi", "peternakan", "tahun"],
    expectedDatasetType: "tren_populasi_sapi", recommendedChart: "Line Chart"
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
    id: "perikanan-3", category: "perikanan", title: "Jenis ikan apa yang produksinya paling tinggi?",
    description: "Membandingkan produksi perikanan berdasarkan jenis ikan atau komoditas.",
    keywords: ["jenis ikan", "produksi ikan", "perikanan", "komoditas"],
    expectedDatasetType: "komposisi_produksi_ikan", recommendedChart: "Pie Chart"
  },
  {
    id: "perikanan-4", category: "perikanan", title: "Bagaimana perbandingan produksi perikanan tangkap dan budidaya?",
    description: "Melihat kontribusi perikanan tangkap dan budidaya terhadap produksi daerah.",
    keywords: ["perikanan tangkap", "budidaya", "produksi perikanan", "ikan"],
    expectedDatasetType: "komposisi_perikanan_tangkap_budidaya", recommendedChart: "Pie Chart"
  },
  {
    id: "perikanan-5", category: "perikanan", title: "Kabupaten mana yang memiliki produksi budidaya perikanan terbesar?",
    description: "Menyusun peringkat produksi perikanan budidaya antar kabupaten/kota.",
    keywords: ["budidaya perikanan", "produksi", "kabupaten", "ikan"],
    expectedDatasetType: "produksi_budidaya_per_wilayah", recommendedChart: "Bar Chart"
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
  },
  {
    id: "pangan-3", category: "pangan", title: "Bagaimana ketersediaan pangan pokok di setiap kabupaten?",
    description: "Membandingkan ketersediaan komoditas pangan pokok antar wilayah.",
    keywords: ["ketersediaan pangan", "pangan pokok", "kabupaten", "komoditas"],
    expectedDatasetType: "ketersediaan_pangan_per_wilayah", recommendedChart: "Bar Chart"
  },
  {
    id: "pangan-4", category: "pangan", title: "Komoditas pangan apa yang produksinya paling besar?",
    description: "Melihat perbandingan produksi berbagai komoditas pangan strategis.",
    keywords: ["komoditas pangan", "produksi pangan", "pangan strategis", "produksi"],
    expectedDatasetType: "komposisi_produksi_pangan", recommendedChart: "Pie Chart"
  },
  {
    id: "pangan-5", category: "pangan", title: "Bagaimana perkembangan harga pangan strategis?",
    description: "Meninjau perubahan harga komoditas pangan strategis dari waktu ke waktu.",
    keywords: ["harga pangan", "pangan strategis", "komoditas", "tahun"],
    expectedDatasetType: "tren_harga_pangan", recommendedChart: "Line Chart"
  }
];

const AGRICULTURE_DATASET_PATTERN = /\b(pertanian|tanaman|hortikultura|perkebunan|peternakan|perikanan|pangan|sawah|padi|jagung|panen|pupuk|nelayan|komoditas|ternak|ikan|beras|kedelai|ubi|kelapa|kakao|karet|kopi|tebu|cengkeh|tembakau|gambir)\b/ui;

function getDatasetCategory(dataset) {
  const text = `${dataset.judul || ""} ${dataset.deskripsi || ""} ${dataset.bidang || ""}`.toLocaleLowerCase("id-ID");
  if (/perikanan|nelayan|ikan/.test(text)) return "perikanan";
  if (/peternakan|ternak|telur|daging|hewan/.test(text)) return "peternakan";
  if (/irigasi/.test(text)) return "irigasi";
  if (/pangan|beras|padi|jagung|kedelai|ubi|konsumsi/.test(text)) return "pangan";
  if (/luas lahan|lahan pertanian/.test(text)) return "lahan";
  return "tanaman";
}

/**
 * Membuat satu pertanyaan untuk setiap dataset pertanian yang tersedia di portal.
 * UUID disimpan agar halaman analisis selalu menggunakan dataset yang tepat,
 * bukan sekadar dataset dengan kata kunci yang mirip.
 */
export function createDatasetQuestions(datasets = []) {
  const seen = new Set();
  return datasets
    .filter(dataset => {
      const text = `${dataset?.judul || ""} ${dataset?.deskripsi || ""} ${dataset?.bidang || ""}`;
      return dataset?.uuid && (AGRICULTURE_DATASET_PATTERN.test(text) || dataset.kode_bidang_urusan === "3.27");
    })
    .filter(dataset => {
      if (seen.has(dataset.uuid)) return false;
      seen.add(dataset.uuid);
      return true;
    })
    .flatMap(dataset => {
      const title = String(dataset.judul || "Data pertanian").replace(/\s+/g, " ").trim();
      const dashboardQuestion = String(dataset.dashboardQuestion || "").replace(/\s+/g, " ").trim();
      const hasPeriod = /tahun|year|periode|tren|perkembangan/i.test(`${dataset.judul || ""} ${dataset.deskripsi || ""} ${dataset.dimensi || ""} ${dataset.pengukuran || ""}`);
      const base = {
        category: getDatasetCategory(dataset),
        keywords: (dashboardQuestion || title).split(/\s+/).filter(word => word.length > 2),
        datasetUuid: dataset.uuid,
        expectedDatasetType: "dataset_portal"
      };
      return [
        { ...base, id: `dataset-${dataset.uuid}-overview`, title: dashboardQuestion || `Bagaimana visualisasi ${title}?`, description: dataset.dashboardQuestionDescription || dataset.deskripsi || `Menampilkan visualisasi ${title} berdasarkan data Portal Satu Data Aceh.`, recommendedChart: "Bar Chart" },
        { ...base, id: `dataset-${dataset.uuid}-ranking`, title: `Wilayah atau kategori mana yang memiliki nilai tertinggi pada ${title}?`, description: `Menyusun peringkat berdasarkan data ${title}.`, recommendedChart: "Bar Chart" },
        ...(hasPeriod ? [{ ...base, id: `dataset-${dataset.uuid}-trend`, title: `Bagaimana perkembangan ${title} antar periode?`, description: `Meninjau perubahan ${title} pada waktu yang tersedia.`, recommendedChart: "Line Chart" }] : [])
      ];
    });
}
