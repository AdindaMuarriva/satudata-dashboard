function numericValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function filterRows(rows, filters = {}) {
  return rows.filter(row => {
    const matchesYear = !filters.year || row.tahun === undefined || row.tahun === null || String(row.tahun) === String(filters.year);
    const matchesRegion = !filters.region || filters.region === "Seluruh Aceh" || row.kabupaten === filters.region;
    const matchesCommodity = !filters.commodity || filters.commodity === "Semua komoditas" || row.komoditas === filters.commodity;
    return matchesYear && matchesRegion && matchesCommodity;
  });
}

function aggregateBy(rows, labelColumn, valueColumn) {
  const grouped = rows.reduce((result, row) => {
    const label = row[labelColumn] || "Tidak diketahui";
    const value = numericValue(row[valueColumn]);
    if (value === null) return result;
    result.set(label, (result.get(label) || 0) + value);
    return result;
  }, new Map());
  return [...grouped].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function formatValue(value) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function unitLabel(rows = []) {
  const units = [...new Set(rows.map(row => row.satuan).filter(Boolean))];
  return units.length === 1 ? ` ${units[0]}` : "";
}

/**
 * Penjelasan yang ditujukan untuk pembaca awam. Seluruh kalimat dibentuk dari
 * statistik dataset yang sedang difilter, sehingga otomatis berubah bersama
 * tahun/wilayah/kategori dan tidak menebak makna indikator di luar sumber.
 */
export function generateChartExplanation(preprocessingResult, filters = {}, visualization = {}) {
  const rows = filterRows(preprocessingResult?.cleanedData || [], filters);
  const structure = preprocessingResult?.datasetStructure;
  const chartType = visualization.type || "bar";
  const period = filters.year ? `tahun ${filters.year}` : "seluruh periode yang tersedia";
  const region = filters.region && filters.region !== "Seluruh Aceh" ? `wilayah ${filters.region}` : "seluruh wilayah/data yang tersedia";
  const commodity = filters.commodity && filters.commodity !== "Semua komoditas" ? ` kategori ${filters.commodity}` : "";
  const chartGuide = {
    bar: "Setiap batang mewakili wilayah atau kategori. Batang yang lebih panjang berarti nilai indikator lebih besar; urutannya memudahkan melihat peringkat.",
    line: "Setiap titik mewakili satu periode. Garis yang naik berarti nilai meningkat dibanding periode sebelumnya, sedangkan garis yang turun berarti nilai menurun.",
    pie: "Setiap irisan menunjukkan bagian relatif dari total nilai. Irisan lebih besar berarti kontribusinya lebih besar terhadap data yang ditampilkan.",
    donut: "Setiap irisan menunjukkan bagian relatif dari total nilai. Irisan lebih besar berarti kontribusinya lebih besar terhadap data yang ditampilkan.",
    map: "Warna lebih pekat menunjukkan nilai indikator lebih tinggi. Peta dipakai untuk melihat persebaran antar kabupaten/kota, bukan untuk menilai kualitas tanpa melihat definisi indikator."
  }[chartType] || "Chart menampilkan perbandingan nilai pada data yang sedang dipilih.";

  if (!rows.length) return {
    title: "Cara membaca hasil",
    paragraphs: [`Belum ada baris data untuk ${period}. Ubah filter tahun atau pilih dataset lain agar penjelasan dapat dibuat dari data sumber.`],
    guide: chartGuide,
    points: []
  };
  if (!structure?.primaryValueColumn) return {
    title: "Cara membaca hasil",
    paragraphs: [`Visualisasi memakai ${rows.length} observasi untuk ${period}, ${region}${commodity}. Dataset ini tidak memiliki metrik numerik yang dapat dihitung, sehingga chart menunjukkan jumlah observasi per kategori.`],
    guide: chartGuide,
    points: ["Nilai pada chart adalah jumlah catatan, bukan total atau rata-rata suatu indikator.", "Tambahkan kolom nilai numerik pada dataset jika ingin memperoleh peringkat, rata-rata, atau perubahan tren."]
  };

  const insight = generateInsights(preprocessingResult, filters);
  const stats = insight.statistics;
  const unit = unitLabel(rows);
  const largest = stats.largest;
  const smallest = stats.smallest;
  const range = largest && smallest ? largest.value - smallest.value : null;
  const aboveAverage = largest && Number.isFinite(stats.average) && stats.average !== 0 ? ((largest.value - stats.average) / Math.abs(stats.average)) * 100 : null;
  const paragraphs = [
    `Chart ini menggunakan ${stats.dataCount} nilai numerik dari ${rows.length} baris data untuk ${period}, ${region}${commodity}. Satuan yang tercantum pada data adalah${unit || " tidak dicantumkan"}.`,
    largest ? `Nilai tertinggi terdapat pada ${largest.label}, yaitu ${formatValue(largest.value)}${unit}. ${smallest && smallest.label !== largest.label ? `Nilai terendah terdapat pada ${smallest.label}, yaitu ${formatValue(smallest.value)}${unit}.` : ""}` : "Tidak ada nilai yang cukup untuk membuat perbandingan."
  ];
  const points = [];
  if (Number.isFinite(stats.average)) points.push(`Rata-rata nilai pada data yang ditampilkan adalah ${formatValue(stats.average)}${unit}.`);
  if (range !== null && largest?.label !== smallest?.label) points.push(`Selisih antara nilai tertinggi dan terendah adalah ${formatValue(range)}${unit}.`);
  if (aboveAverage !== null) points.push(`${largest.label} berada ${Math.abs(aboveAverage).toFixed(1)}% ${aboveAverage >= 0 ? "di atas" : "di bawah"} rata-rata data yang ditampilkan.`);
  if (stats.trend) {
    const direction = stats.trend.change > 0 ? "naik" : stats.trend.change < 0 ? "turun" : "tetap";
    points.push(`Dari ${stats.trend.previous.year} ke ${stats.trend.current.year}, nilai agregat ${direction} dari ${formatValue(stats.trend.previous.value)} menjadi ${formatValue(stats.trend.current.value)}${unit}.`);
  }
  points.push("Nilai tinggi atau rendah tidak otomatis berarti kondisi lebih baik atau lebih buruk; maknanya harus mengikuti definisi indikator, satuan, dan metode pengukuran pada dataset sumber.");
  return { title: "Penjelasan lengkap chart", paragraphs, guide: chartGuide, points };
}

function createTrendChange(rows, valueColumn) {
  const yearly = aggregateBy(rows.filter(row => row.tahun !== undefined && row.tahun !== null), "tahun", valueColumn)
    .map(item => ({ ...item, year: Number(item.label) }))
    .filter(item => Number.isFinite(item.year))
    .sort((a, b) => a.year - b.year);
  if (yearly.length < 2) return null;
  const previous = yearly[yearly.length - 2];
  const current = yearly[yearly.length - 1];
  const change = current.value - previous.value;
  const percentChange = previous.value === 0 ? null : (change / Math.abs(previous.value)) * 100;
  return { previous, current, change, percentChange };
}

function emptyInsight(preprocessingResult) {
  const rows = preprocessingResult?.cleanedData || [];
  const row = rows[0] || {};
  const location = row.kabupaten || row.kecamatan || row.desa || row.provinsi;
  const period = row.tahun ? ` pada tahun ${row.tahun}` : "";
  const commodity = row.komoditas || row.kategori;
  const context = [
    location ? `wilayah ${location}` : "",
    commodity ? `komoditas/kategori ${commodity}` : "",
    row.satuan ? `satuan ${row.satuan}` : ""
  ].filter(Boolean).join(", ");
  return {
    title: "Ringkasan Dataset",
    summary: rows.length === 1
      ? `Dataset mencatat satu observasi${period}${context ? ` untuk ${context}` : ""}. Karena tidak terdapat metrik kuantitatif yang dapat dihitung, informasi disajikan sebagai deskripsi data dan perbandingan antarwilayah atau antarperiode belum dapat dilakukan.`
      : `Dataset berisi ${rows.length} observasi${context ? ` dengan contoh ${context}` : ""}, tetapi tidak memiliki metrik kuantitatif yang dapat dihitung.`,
    highlights: [],
    statistics: {}
  };
}

/**
 * Produces explainable, rule-based insight from a preprocessed dataset.
 * The input remains presentation-neutral so it can be reused by other domains.
 */
export function generateInsights(preprocessingResult, filters = {}) {
  const structure = preprocessingResult?.datasetStructure;
  if (!structure?.primaryValueColumn) return emptyInsight(preprocessingResult);

  const rows = filterRows(preprocessingResult.cleanedData || [], filters);
  if (!rows.length) {
    const period = filters.year ? `tahun ${filters.year}` : "filter yang dipilih";
    return {
      title: "Data Tidak Tersedia",
      summary: `Tidak ada observasi untuk ${period}. Insight tidak dibuat dari data periode lain.`,
      highlights: [],
      statistics: {}
    };
  }
  const valueColumn = structure.primaryValueColumn;
  const values = rows.map(row => numericValue(row[valueColumn])).filter(value => value !== null);
  if (!values.length) return emptyInsight(preprocessingResult);

  const labelColumn = structure.hasKabupaten
    ? "kabupaten"
    : (structure.columns.includes("komoditas") ? "komoditas" : structure.categoryColumns[0]);
  const ranking = labelColumn ? aggregateBy(rows, labelColumn, valueColumn) : [];
  const largest = ranking[0] || null;
  const smallest = ranking[ranking.length - 1] || null;
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = total / values.length;
  const trend = structure.hasTahun ? createTrendChange(rows, valueColumn) : null;
  const categoryCount = labelColumn ? new Set(rows.map(row => row[labelColumn]).filter(Boolean)).size : 0;
  const highlights = [];

  if (values.length === 1) {
    const row = rows.find(item => numericValue(item[valueColumn]) !== null) || {};
    const location = row.kabupaten || row.provinsi || "Provinsi Aceh";
    const period = row.tahun ? ` pada tahun ${row.tahun}` : "";
    const valueLabel = valueColumn.replace(/_/g, " ");
    return {
      title: "Ringkasan Data",
      summary: `Berdasarkan dataset ini, ${valueLabel} ${location}${period} tercatat sebesar ${formatValue(values[0])}. Karena dataset merupakan ringkasan satu observasi, analisis perbandingan antarwilayah atau antarperiode belum dapat dilakukan.`,
      highlights: [`Nilai yang tersedia: ${formatValue(values[0])}${row.satuan ? ` ${row.satuan}` : ""}.`],
      statistics: {
        total: values[0],
        average: values[0],
        largest: { label: location, value: values[0] },
        smallest: { label: location, value: values[0] },
        ranking: [{ label: location, value: values[0] }],
        categoryCount: 1,
        dataCount: 1,
        trend: null
      }
    };
  }

  if (largest) highlights.push(`Nilai terbesar: ${largest.label} (${formatValue(largest.value)}).`);
  if (smallest && smallest.label !== largest?.label) highlights.push(`Nilai terkecil: ${smallest.label} (${formatValue(smallest.value)}).`);
  if (trend) {
    const direction = trend.change > 0 ? "meningkat" : trend.change < 0 ? "menurun" : "tetap";
    const percent = trend.percentChange === null ? "" : ` (${Math.abs(trend.percentChange).toFixed(1)}%)`;
    highlights.push(`Nilai ${direction} dari ${trend.previous.year} ke ${trend.current.year}${percent}.`);
  }

  const level = preprocessingResult.datasetLevel;
  let title = "Ringkasan Data";
  let summary = `Terdapat ${values.length} nilai numerik yang dapat dianalisis dengan total ${formatValue(total)}.`;
  if (level === "district_comparison" || level === "time_series_district") {
    title = "Ringkasan Perbandingan Kabupaten";
    summary = largest
      ? `Kabupaten ${largest.label} memiliki nilai tertinggi sebesar ${formatValue(largest.value)}.`
      : summary;
  } else if (level === "province_trend") {
    title = "Ringkasan Perkembangan";
    summary = trend
      ? `Nilai ${trend.change >= 0 ? "meningkat" : "menurun"} dibanding tahun sebelumnya.`
      : "Data tren tersedia, tetapi belum cukup periode untuk membandingkan perubahan tahunan.";
  } else if (level === "categorical") {
    title = "Ringkasan Kategori";
    summary = largest ? `Kategori terbesar adalah ${largest.label} dengan nilai ${formatValue(largest.value)}.` : summary;
  }

  return {
    title,
    summary,
    highlights,
    statistics: {
      total,
      average,
      largest,
      smallest,
      ranking: ranking.slice(0, 5),
      categoryCount,
      dataCount: values.length,
      trend
    }
  };
}
