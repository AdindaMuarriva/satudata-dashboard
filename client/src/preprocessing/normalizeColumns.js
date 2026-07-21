const COLUMN_ALIASES = {
  kabupaten: ["kabupaten", "kab kota", "kabkota", "kabupaten kota", "kabupaten kota nama", "nama kabupaten", "nama kabupaten kota", "bps nama kabupaten kota", "kemendagri nama kabupaten kota"],
  tahun: ["tahun", "year", "periode tahun"],
  kecamatan: ["kecamatan", "nama kecamatan", "bps nama kecamatan", "kemendagri nama kecamatan"],
  desa: ["desa", "gampong", "nama desa", "bps nama desa", "kemendagri nama desa"],
  provinsi: ["provinsi", "nama provinsi", "bps nama provinsi", "kemendagri nama provinsi"],
  komoditas: ["komoditas", "jenis komoditas", "tanaman", "jenis tanaman", "nama komoditas"],
  kategori: ["kategori", "jenis", "kelompok", "klasifikasi"],
  nilai: ["nilai", "jumlah", "total", "value"],
  satuan: ["satuan", "unit"]
};

function canonicalize(name) {
  return String(name || "").toLocaleLowerCase("id-ID")
    .replace(/[_\-/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSnakeCase(name) {
  return canonicalize(name).replace(/\s+/g, "_");
}

function findNormalizedName(columnName) {
  const source = canonicalize(columnName);
  for (const [normalized, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(source)) return normalized;
  }
  return toSnakeCase(columnName) || "kolom";
}

function uniqueName(candidate, usedNames) {
  if (!usedNames.has(candidate)) return candidate;
  let suffix = 2;
  while (usedNames.has(`${candidate}_${suffix}`)) suffix += 1;
  return `${candidate}_${suffix}`;
}

/**
 * Converts source column names to stable application names and returns the map.
 */
export function normalizeColumns(rows = []) {
  const sourceColumns = [...new Set((Array.isArray(rows) ? rows : []).flatMap(row => Object.keys(row || {})))];
  const usedNames = new Set();
  const columnMap = sourceColumns.reduce((map, sourceColumn) => {
    const normalizedColumn = uniqueName(findNormalizedName(sourceColumn), usedNames);
    usedNames.add(normalizedColumn);
    map[sourceColumn] = normalizedColumn;
    return map;
  }, {});

  const data = (Array.isArray(rows) ? rows : []).map(row => Object.entries(row || {}).reduce((normalizedRow, [sourceColumn, value]) => {
    normalizedRow[columnMap[sourceColumn]] = value;
    return normalizedRow;
  }, {}));

  return { data, columns: Object.values(columnMap), columnMap };
}
