const DIMENSION_COLUMNS = new Set(["kabupaten", "kecamatan", "desa", "provinsi", "tahun", "satuan", "id", "uuid"]);

function isNumericColumn(rows, column) {
  const values = rows.map(row => row[column]).filter(value => value !== null && value !== undefined && value !== "");
  return values.length > 0 && values.every(value => typeof value === "number" && Number.isFinite(value));
}

/**
 * Profiles the normalized rows. It does not infer domain meaning beyond shape.
 */
export function detectDatasetType(rows = [], columns = []) {
  const data = Array.isArray(rows) ? rows : [];
  const availableColumns = columns.length ? columns : [...new Set(data.flatMap(row => Object.keys(row || {})))];
  const numericColumns = availableColumns.filter(column => isNumericColumn(data, column));
  const categoryColumns = availableColumns.filter(column => !numericColumns.includes(column) && !DIMENSION_COLUMNS.has(column));
  const hasKabupaten = availableColumns.includes("kabupaten");
  const hasTahun = availableColumns.includes("tahun");
  const hasCategory = availableColumns.includes("komoditas") || availableColumns.includes("kategori") || categoryColumns.length > 0;
  const hasNumericValue = numericColumns.length > 0;

  return {
    rowCount: data.length,
    columns: availableColumns,
    numericColumns,
    categoryColumns,
    hasKabupaten,
    hasTahun,
    hasCategory,
    hasNumericValue,
    primaryValueColumn: availableColumns.includes("nilai") && numericColumns.includes("nilai") ? "nilai" : numericColumns[0] || null
  };
}
