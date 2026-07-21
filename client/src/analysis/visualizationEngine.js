const DATASET_LEVEL_VISUALIZATIONS = {
  district_comparison: "bar",
  province_summary: "kpi",
  province_trend: "line",
  time_series_district: "line",
  categorical: "donut",
  distribution: "histogram"
};

function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function aggregate(rows, labelColumn, valueColumn) {
  const groups = rows.reduce((result, row) => {
    const label = row[labelColumn] || "Tidak diketahui";
    const value = numberValue(row[valueColumn]);
    if (value === null) return result;
    result.set(label, (result.get(label) || 0) + value);
    return result;
  }, new Map());
  return [...groups].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function filterRows(rows, filters = {}) {
  return rows.filter(row => {
    const matchesRegion = !filters.region || filters.region === "Seluruh Aceh" || row.kabupaten === filters.region;
    const matchesCommodity = !filters.commodity || filters.commodity === "Semua komoditas" || row.komoditas === filters.commodity;
    return matchesRegion && matchesCommodity;
  });
}

function createHistogram(rows, valueColumn) {
  const values = rows.map(row => numberValue(row[valueColumn])).filter(value => value !== null);
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = Math.max((max - min) / 5, 1);
  const bins = Array.from({ length: 5 }, (_, index) => ({
    label: `${Math.round(min + index * binSize)}–${Math.round(min + (index + 1) * binSize)}`,
    value: 0
  }));
  values.forEach(value => bins[Math.min(Math.floor((value - min) / binSize), bins.length - 1)].value += 1);
  return bins;
}

/**
 * Maps a preprocessed dataset to a small, renderer-neutral visualization model.
 */
export function selectVisualization(preprocessingResult, filters = {}) {
  const structure = preprocessingResult?.datasetStructure;
  const visualizationType = DATASET_LEVEL_VISUALIZATIONS[preprocessingResult?.datasetLevel];
  if (!structure || !visualizationType || !structure.primaryValueColumn) {
    return { status: "unavailable", message: "Visualization not available for this dataset." };
  }

  const rows = filterRows(preprocessingResult.cleanedData || [], filters);
  const valueColumn = structure.primaryValueColumn;
  if (!rows.length) return { status: "unavailable", message: "Visualization not available for this dataset." };

  if (visualizationType === "bar") {
    return { status: "ready", type: "bar", title: "Perbandingan Kabupaten", data: aggregate(rows, "kabupaten", valueColumn) };
  }
  if (visualizationType === "line") {
    const data = aggregate(rows, "tahun", valueColumn).map(item => ({ ...item, year: Number(item.label) })).sort((a, b) => a.year - b.year);
    return { status: "ready", type: "line", title: "Perkembangan Nilai", data };
  }
  if (visualizationType === "donut") {
    const labelColumn = structure.columns.includes("komoditas") ? "komoditas" : structure.categoryColumns[0];
    return { status: "ready", type: "donut", title: "Komposisi Kategori", data: aggregate(rows, labelColumn, valueColumn) };
  }
  if (visualizationType === "kpi") {
    const value = rows.reduce((total, row) => total + (numberValue(row[valueColumn]) || 0), 0);
    return { status: "ready", type: "kpi", title: "Ringkasan Nilai", value, valueColumn };
  }
  return { status: "ready", type: "histogram", title: "Distribusi Nilai", data: createHistogram(rows, valueColumn) };
}
