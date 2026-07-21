function numericValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function filterRows(rows, filters = {}) {
  return rows.filter(row => {
    const matchesRegion = !filters.region || filters.region === "Seluruh Aceh" || row.kabupaten === filters.region;
    const matchesCommodity = !filters.commodity || filters.commodity === "Semua komoditas" || row.komoditas === filters.commodity;
    return matchesRegion && matchesCommodity;
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

function emptyInsight() {
  return {
    title: "Insight belum tersedia",
    summary: "Belum cukup data untuk menghasilkan insight.",
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
  if (!structure?.primaryValueColumn) return emptyInsight();

  const rows = filterRows(preprocessingResult.cleanedData || [], filters);
  const valueColumn = structure.primaryValueColumn;
  const values = rows.map(row => numericValue(row[valueColumn])).filter(value => value !== null);
  if (!values.length) return emptyInsight();

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
