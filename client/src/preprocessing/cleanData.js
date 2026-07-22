function cleanString(value) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumericString(value) {
  // Nilai dari portal tidak selalu berupa angka murni: cukup sering satuan
  // ditempelkan ke nilainya (contoh: "1.250,5 km" atau "76,2%"). Simpan
  // teks yang benar-benar kategorikal, tetapi ambil angka ketika sisanya
  // hanya satuan umum/pemisah.
  const compact = value.replace(/\s/g, "").replace(/%$/, "");
  const numericWithUnit = compact.match(/^(-?[\d.,]+)(?:[a-zA-Z]+(?:\^?\d+)?)?$/u);
  const numericPart = numericWithUnit ? numericWithUnit[1] : compact;
  if (!/^-?[\d.,]+$/.test(numericPart)) return value;

  let normalized = numericPart;
  if (numericPart.includes(",") && numericPart.includes(".")) {
    normalized = numericPart.lastIndexOf(",") > numericPart.lastIndexOf(".")
      ? numericPart.replace(/\./g, "").replace(",", ".")
      : numericPart.replace(/,/g, "");
  } else if (numericPart.includes(",")) {
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(numericPart)
      ? numericPart.replace(/,/g, "")
      : numericPart.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(numericPart)) {
    normalized = numericPart.replace(/\./g, "");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : value;
}

export function normalizeValue(value) {
  if (typeof value === "string") {
    const cleaned = cleanString(value);
    if (!cleaned || ["null", "n/a", "na", "-"].includes(cleaned.toLocaleLowerCase("id-ID"))) return null;
    return parseNumericString(cleaned);
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean" || value === null || value === undefined) return value ?? null;
  return cleanString(String(value));
}

function isEmptyRow(row) {
  return !Object.values(row).some(value => value !== null && value !== undefined && value !== "");
}

function stableRowKey(row) {
  return JSON.stringify(Object.keys(row).sort().map(key => [key, row[key]]));
}

/**
 * Removes empty rows and duplicates while normalizing string and numeric values.
 */
export function cleanData(rows = []) {
  const inputRows = Array.isArray(rows) ? rows : [];
  const seen = new Set();
  let emptyRowsRemoved = 0;
  let duplicatesRemoved = 0;

  const data = inputRows.reduce((result, rawRow) => {
    if (!rawRow || typeof rawRow !== "object" || Array.isArray(rawRow)) {
      emptyRowsRemoved += 1;
      return result;
    }
    const cleanedRow = Object.fromEntries(Object.entries(rawRow).map(([key, value]) => [cleanString(key), normalizeValue(value)]));
    if (isEmptyRow(cleanedRow)) {
      emptyRowsRemoved += 1;
      return result;
    }
    const key = stableRowKey(cleanedRow);
    if (seen.has(key)) {
      duplicatesRemoved += 1;
      return result;
    }
    seen.add(key);
    result.push(cleanedRow);
    return result;
  }, []);

  return { data, metadata: { inputRows: inputRows.length, outputRows: data.length, emptyRowsRemoved, duplicatesRemoved } };
}
