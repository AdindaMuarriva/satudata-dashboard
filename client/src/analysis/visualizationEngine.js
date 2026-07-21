const DATASET_LEVEL_VISUALIZATIONS = {
  district_comparison: "bar",
  province_summary: "kpi",
  province_trend: "line",
  time_series_district: "line",
  categorical: "donut",
  distribution: "histogram"
};

const VISUALIZATION_REQUESTS = {
  "Bar Chart": "bar",
  "Line Chart": "line",
  "Pie Chart": "pie",
  "Donut Chart": "donut",
  Histogram: "histogram",
  "Peta Aceh": "map"
};
const TECHNICAL_DIMENSION_PATTERN = /(^|_)(id|uuid|kode|code|created_at|updated_at)($|_)/;

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
    const matchesYear = !filters.year || row.tahun === undefined || row.tahun === null || String(row.tahun) === String(filters.year);
    const matchesRegion = !filters.region || filters.region === "Seluruh Aceh" || row.kabupaten === filters.region;
    const matchesCommodity = !filters.commodity || filters.commodity === "Semua komoditas" || row.komoditas === filters.commodity;
    return matchesYear && matchesRegion && matchesCommodity;
  });
}

function countBy(rows, labelColumn) {
  const groups = rows.reduce((result, row) => {
    const label = row[labelColumn] || "Tidak diketahui";
    result.set(label, (result.get(label) || 0) + 1);
    return result;
  }, new Map());
  return [...groups].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function distinctValueCount(rows, column) {
  return new Set(rows.map(row => row[column]).filter(value => value !== undefined && value !== null && value !== "")).size;
}

function selectLabelColumn(rows, structure, { allowYear = false } = {}) {
  const preferred = ["kabupaten", "kecamatan", "desa", "komoditas", "kategori", ...(structure.categoryColumns || [])];
  const candidates = [...new Set(preferred)]
    .filter(column => structure.columns.includes(column) && column !== structure.primaryValueColumn)
    .filter(column => allowYear || column !== "tahun")
    .filter(column => !TECHNICAL_DIMENSION_PATTERN.test(column))
    .map(column => ({ column, count: distinctValueCount(rows, column) }))
    .filter(item => item.count > 1);
  return candidates.sort((a, b) => b.count - a.count)[0]?.column || null;
}

function observationData(rows, valueColumn) {
  return rows.reduce((data, row, index) => {
    const value = numberValue(row[valueColumn]);
    if (value !== null) data.push({ label: `Observasi ${index + 1}`, value });
    return data;
  }, []);
}

function groupedData(rows, structure, valueColumn) {
  const labelColumn = selectLabelColumn(rows, structure);
  return {
    labelColumn,
    data: labelColumn ? aggregate(rows, labelColumn, valueColumn) : observationData(rows, valueColumn)
  };
}

function categoricalData(rows, structure) {
  const labelColumn = selectLabelColumn(rows, structure);
  return {
    labelColumn,
    data: labelColumn ? countBy(rows, labelColumn) : rows.map((_, index) => ({ label: `Observasi ${index + 1}`, value: 1 }))
  };
}

function datasetUnit(rows) {
  const units = [...new Set(rows.map(row => row.satuan).filter(Boolean))];
  return units.length === 1 ? units[0] : units.length > 1 ? units.join(", ") : "";
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
  const automaticType = DATASET_LEVEL_VISUALIZATIONS[preprocessingResult?.datasetLevel];
  const visualizationType = VISUALIZATION_REQUESTS[filters.visualization] || automaticType;
  if (!structure || !visualizationType) {
    return { status: "unavailable", message: "Visualization not available for this dataset." };
  }

  const sourceRows = preprocessingResult.cleanedData || [];
  const rows = filterRows(sourceRows, filters);
  const valueColumn = structure.primaryValueColumn;
  console.log("[Visualization] Row counts:", {
    beforeFiltering: sourceRows.length,
    afterFiltering: rows.length,
    requestedType: filters.visualization || "automatic",
    filterFallback: "tidak digunakan"
  });
  if (!rows.length) {
    const period = filters.year ? `tahun ${filters.year}` : "filter yang dipilih";
    return { status: "unavailable", message: `Tidak ada data untuk ${period}. Visualisasi tidak ditampilkan agar tidak menampilkan data dari periode lain.` };
  }

  if (!structure.primaryValueColumn) {
    const categorical = categoricalData(rows, structure);
    const requestedComposition = visualizationType === "pie" || visualizationType === "donut";
    const canCompose = categorical.data.length > 1;
    const type = requestedComposition && canCompose ? visualizationType : "bar";
    const reason = visualizationType === "histogram"
      ? "Histogram memerlukan nilai numerik. Ditampilkan jumlah observasi per kategori sebagai Bar Chart."
      : visualizationType === "line"
        ? "Line Chart memerlukan nilai numerik per periode. Ditampilkan jumlah observasi per kategori sebagai Bar Chart."
        : requestedComposition && !canCompose
          ? `${filters.visualization} memerlukan minimal dua kategori. Ditampilkan Bar Chart sebagai pengganti.`
          : "Dataset tidak memiliki metrik numerik; visualisasi menampilkan jumlah observasi per kategori.";
    return {
      status: "ready",
      type,
      title: type === "bar" ? "Jumlah Observasi per Kategori" : "Komposisi Observasi",
      data: categorical.data,
      sourceRowCount: rows.length,
      renderedDataCount: categorical.data.length,
      unit: datasetUnit(rows),
      notice: reason
    };
  }

  if (visualizationType === "line") {
    const yearCount = distinctValueCount(rows, "tahun");
    if (structure.columns.includes("tahun") && yearCount > 1) {
      const data = aggregate(rows, "tahun", valueColumn).map(item => ({ ...item, year: Number(item.label) })).filter(item => Number.isFinite(item.year)).sort((a, b) => a.year - b.year);
      if (data.length > 1) return { status: "ready", type: "line", title: "Perkembangan Nilai", data, sourceRowCount: rows.length, renderedDataCount: data.length, unit: datasetUnit(rows) };
    }
    const fallback = groupedData(rows, structure, valueColumn);
    return { status: "ready", type: "bar", title: "Perbandingan Nilai", data: fallback.data, sourceRowCount: rows.length, renderedDataCount: fallback.data.length, unit: datasetUnit(rows), notice: "Line Chart memerlukan minimal dua periode. Ditampilkan Bar Chart sebagai pengganti." };
  }
  if (visualizationType === "map") {
    const regionalData = structure.columns.includes("kabupaten") ? aggregate(rows, "kabupaten", valueColumn) : [];
    if (regionalData.length) return { status: "ready", type: "map", title: "Peta Nilai per Kabupaten/Kota", data: regionalData.map(item => ({ ...item, geoLabel: item.label })), sourceRowCount: rows.length, renderedDataCount: regionalData.length, unit: datasetUnit(rows) };
    const fallback = groupedData(rows, structure, valueColumn);
    return { status: "ready", type: "bar", title: "Perbandingan Nilai", data: fallback.data, sourceRowCount: rows.length, renderedDataCount: fallback.data.length, unit: datasetUnit(rows), notice: "Peta Aceh memerlukan kolom kabupaten/kota. Ditampilkan Bar Chart sebagai pengganti." };
  }
  if (visualizationType === "pie" || visualizationType === "donut") {
    const grouped = groupedData(rows, structure, valueColumn);
    if (grouped.data.length > 1) return { status: "ready", type: visualizationType, title: "Komposisi Nilai", data: grouped.data, sourceRowCount: rows.length, renderedDataCount: grouped.data.length, unit: datasetUnit(rows) };
    return { status: "ready", type: "bar", title: "Nilai Dataset", data: grouped.data, sourceRowCount: rows.length, renderedDataCount: grouped.data.length, unit: datasetUnit(rows), notice: `${filters.visualization || "Chart komposisi"} memerlukan minimal dua kategori. Ditampilkan Bar Chart sebagai pengganti.` };
  }
  if (visualizationType === "histogram") {
    const data = createHistogram(rows, valueColumn);
    return { status: "ready", type: "histogram", title: "Distribusi Nilai", data, sourceRowCount: rows.length, renderedDataCount: data.length, unit: datasetUnit(rows) };
  }
  const grouped = groupedData(rows, structure, valueColumn);
  return { status: "ready", type: "bar", title: "Perbandingan Nilai", data: grouped.data, sourceRowCount: rows.length, renderedDataCount: grouped.data.length, unit: datasetUnit(rows) };
}
