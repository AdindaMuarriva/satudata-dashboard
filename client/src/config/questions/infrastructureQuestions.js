export const INFRASTRUCTURE_QUESTION_CATEGORIES = [
  { id: "jalan", label: "01", title: "Jalan & Jembatan", description: "Meninjau kondisi, panjang, dan konektivitas jalan serta jembatan." },
  { id: "transportasi", label: "02", title: "Transportasi", description: "Melihat layanan dan sarana transportasi untuk mendukung mobilitas masyarakat." },
  { id: "air-sanitasi", label: "03", title: "Air Bersih & Sanitasi", description: "Menganalisis akses air minum, sanitasi, dan infrastruktur lingkungan dasar." },
  { id: "permukiman", label: "04", title: "Perumahan & Permukiman", description: "Meninjau kondisi perumahan, permukiman, dan prasarana pendukungnya." },
  { id: "konektivitas", label: "05", title: "Utilitas & Konektivitas", description: "Melihat ketersediaan listrik, telekomunikasi, dan konektivitas digital." }
];

export const INFRASTRUCTURE_QUESTIONS = [
  { id: "infrastruktur-jalan", category: "jalan", title: "Kabupaten mana yang memiliki kondisi jalan paling perlu diperhatikan?", description: "Membandingkan kondisi atau panjang jalan antar kabupaten/kota.", keywords: ["jalan", "kondisi jalan", "kabupaten"], expectedDatasetType: "kondisi_jalan_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-tren-jalan", category: "jalan", title: "Bagaimana perkembangan kondisi jalan dari tahun ke tahun?", description: "Meninjau perubahan kondisi infrastruktur jalan pada periode yang tersedia.", keywords: ["jalan", "tahun", "perkembangan"], expectedDatasetType: "tren_kondisi_jalan", recommendedChart: "Line Chart" },
  { id: "infrastruktur-jembatan", category: "jalan", title: "Bagaimana sebaran infrastruktur jembatan di Aceh?", description: "Melihat perbandingan jembatan antar wilayah di Aceh.", keywords: ["jembatan", "infrastruktur", "kabupaten"], expectedDatasetType: "jembatan_per_wilayah", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-angkutan", category: "transportasi", title: "Bagaimana ketersediaan layanan angkutan di setiap wilayah?", description: "Membandingkan layanan angkutan atau sarana transportasi antar wilayah.", keywords: ["angkutan", "transportasi", "wilayah"], expectedDatasetType: "layanan_angkutan", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-pelabuhan", category: "transportasi", title: "Bagaimana kondisi sarana transportasi laut dan udara?", description: "Meninjau indikator pelabuhan, bandara, dan sarana transportasi lainnya.", keywords: ["pelabuhan", "bandara", "transportasi"], expectedDatasetType: "sarana_transportasi", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-konektivitas", category: "transportasi", title: "Wilayah mana yang membutuhkan prioritas peningkatan konektivitas?", description: "Mengidentifikasi kebutuhan konektivitas berdasarkan data transportasi yang tersedia.", keywords: ["konektivitas", "transportasi", "wilayah"], expectedDatasetType: "konektivitas_wilayah", recommendedChart: "Peta Aceh" },
  { id: "infrastruktur-air", category: "air-sanitasi", title: "Bagaimana akses air minum layak di setiap kabupaten/kota?", description: "Membandingkan cakupan akses air minum layak antar wilayah.", keywords: ["air minum", "air bersih", "kabupaten"], expectedDatasetType: "akses_air_minum", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-sanitasi", category: "air-sanitasi", title: "Bagaimana cakupan sanitasi layak di Aceh?", description: "Meninjau perbandingan akses sanitasi layak antar wilayah.", keywords: ["sanitasi", "sanitasi layak", "wilayah"], expectedDatasetType: "akses_sanitasi", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-drainase", category: "air-sanitasi", title: "Bagaimana kondisi drainase dan pengelolaan air di wilayah Aceh?", description: "Melihat indikator drainase serta infrastruktur pengelolaan air.", keywords: ["drainase", "air", "infrastruktur"], expectedDatasetType: "kondisi_drainase", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-rumah", category: "permukiman", title: "Bagaimana kondisi rumah dan permukiman masyarakat?", description: "Menampilkan indikator kondisi perumahan dan permukiman yang tersedia.", keywords: ["rumah", "perumahan", "permukiman"], expectedDatasetType: "kondisi_perumahan", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-permukiman", category: "permukiman", title: "Wilayah mana yang membutuhkan prioritas penanganan permukiman?", description: "Membandingkan indikator permukiman antar kabupaten/kota.", keywords: ["permukiman", "wilayah", "penanganan"], expectedDatasetType: "permukiman_per_wilayah", recommendedChart: "Peta Aceh" },
  { id: "infrastruktur-bangunan", category: "permukiman", title: "Bagaimana ketersediaan prasarana bangunan publik?", description: "Meninjau sarana bangunan dan prasarana publik berdasarkan data yang tersedia.", keywords: ["bangunan", "prasarana", "publik"], expectedDatasetType: "prasarana_bangunan", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-listrik", category: "konektivitas", title: "Bagaimana akses listrik di setiap wilayah?", description: "Membandingkan ketersediaan dan akses listrik antar wilayah.", keywords: ["listrik", "akses listrik", "wilayah"], expectedDatasetType: "akses_listrik", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-internet", category: "konektivitas", title: "Bagaimana sebaran akses internet dan telekomunikasi?", description: "Melihat indikator akses internet dan telekomunikasi di Aceh.", keywords: ["internet", "telekomunikasi", "akses"], expectedDatasetType: "akses_internet", recommendedChart: "Bar Chart" },
  { id: "infrastruktur-digital", category: "konektivitas", title: "Bagaimana perkembangan konektivitas digital di Aceh?", description: "Meninjau perubahan indikator konektivitas digital dari waktu ke waktu.", keywords: ["digital", "internet", "telekomunikasi", "tahun"], expectedDatasetType: "tren_konektivitas_digital", recommendedChart: "Line Chart" }
];

function getInfrastructureCategory(dataset) {
  const text = `${dataset.judul || ""} ${dataset.deskripsi || ""} ${dataset.bidang || ""}`.toLocaleLowerCase("id-ID");
  if (/jalan|jembatan|penerangan jalan/.test(text)) return "jalan";
  if (/transportasi|angkutan|pelabuhan|bandara|terminal/.test(text)) return "transportasi";
  if (/air minum|air bersih|sanitasi|drainase|irigasi|bendungan/.test(text)) return "air-sanitasi";
  if (/perumahan|permukiman|bangunan/.test(text)) return "permukiman";
  return "konektivitas";
}

export function createInfrastructureDatasetQuestions(datasets = []) {
  return datasets.flatMap(dataset => {
    const title = String(dataset.judul || "Data infrastruktur").replace(/\s+/g, " ").trim();
    const dashboardQuestion = String(dataset.dashboardQuestion || "").replace(/\s+/g, " ").trim();
    const hasPeriod = /tahun|year|periode|tren|perkembangan/i.test(`${dataset.judul || ""} ${dataset.deskripsi || ""} ${dataset.dimensi || ""} ${dataset.pengukuran || ""}`);
    const base = {
      category: getInfrastructureCategory(dataset),
      keywords: (dashboardQuestion || title).split(/\s+/).filter(word => word.length > 2),
      datasetUuid: dataset.uuid,
      expectedDatasetType: "dataset_infrastruktur_portal"
    };
    return [
      { ...base, id: `infrastructure-dataset-${dataset.uuid}-overview`, title: dashboardQuestion || `Bagaimana visualisasi ${title}?`, description: dataset.dashboardQuestionDescription || dataset.deskripsi || `Menampilkan visualisasi ${title} berdasarkan data Portal Satu Data Aceh.`, recommendedChart: "Bar Chart" },
      { ...base, id: `infrastructure-dataset-${dataset.uuid}-ranking`, title: `Wilayah atau kategori mana yang memiliki nilai tertinggi pada ${title}?`, description: `Menyusun peringkat berdasarkan data ${title}.`, recommendedChart: "Bar Chart" },
      ...(hasPeriod ? [{ ...base, id: `infrastructure-dataset-${dataset.uuid}-trend`, title: `Bagaimana perkembangan ${title} antar periode?`, description: `Meninjau perubahan ${title} pada waktu yang tersedia.`, recommendedChart: "Line Chart" }] : [])
    ];
  });
}
