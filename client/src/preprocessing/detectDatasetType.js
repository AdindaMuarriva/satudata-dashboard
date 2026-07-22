const DIMENSION_COLUMNS = new Set(["kabupaten", "kecamatan", "desa", "provinsi", "tahun", "satuan", "id", "uuid"]);
const IDENTIFIER_COLUMN_PATTERN = /(^|_)(id|uuid|kode|code|created_at|updated_at|tahun)($|_)/;
const MEASUREMENT_COLUMN_PATTERN = /(^|_)(nilai|produksi|luas|jumlah|total|populasi|volume|berat|hasil|kapasitas|persentase|rasio|indeks|angka|panjang|lebar|tinggi|luas|kondisi|cakupan|akses|pelayanan|layanan|fasilitas|sarana|prasarana|ruas|jembatan|kendaraan|pelanggan|sambungan|unit)($|_)/;

function isNumericColumn(rows, column) {
  const values = rows.map(row => row[column]).filter(value => value !== null && value !== undefined && value !== "");
  if (!values.length) return false;
  const numericValues = values.filter(value => typeof value === "number" && Number.isFinite(value));
  // Satu sel seperti "Tidak tersedia" tidak boleh membuat seluruh metrik
  // portal gagal terbaca. Ambang mayoritas mencegah kolom kategori yang
  // kebetulan mengandung angka dianggap sebagai ukuran.
  return numericValues.length > 0 && numericValues.length / values.length >= 0.6;
}

function measurementScore(column) {
  if (column === "nilai") return 100;
  if (IDENTIFIER_COLUMN_PATTERN.test(column)) return -100;
  if (MEASUREMENT_COLUMN_PATTERN.test(column)) return 50;
  return 0;
}

/**
 * Profiles the normalized rows. It does not infer domain meaning beyond shape.
 */
export function detectDatasetType(rows = [], columns = []) {
  const data = Array.isArray(rows) ? rows : [];
  const availableColumns = columns.length ? columns : [...new Set(data.flatMap(row => Object.keys(row || {})))];
  const numericColumns = availableColumns.filter(column => isNumericColumn(data, column));
  const measurementColumns = numericColumns.filter(column => measurementScore(column) >= 0);
  const primaryValueColumn = [...measurementColumns]
    .sort((left, right) => measurementScore(right) - measurementScore(left))[0] || null;
  const categoryColumns = availableColumns.filter(column => !numericColumns.includes(column) && !DIMENSION_COLUMNS.has(column));
  const hasKabupaten = availableColumns.includes("kabupaten");
  const hasTahun = availableColumns.includes("tahun");
  const hasCategory = availableColumns.includes("komoditas") || availableColumns.includes("kategori") || categoryColumns.length > 0;
  const hasNumericValue = measurementColumns.length > 0;

  return {
    rowCount: data.length,
    columns: availableColumns,
    numericColumns,
    measurementColumns,
    categoryColumns,
    hasKabupaten,
    hasTahun,
    hasCategory,
    hasNumericValue,
    primaryValueColumn
  };
}
