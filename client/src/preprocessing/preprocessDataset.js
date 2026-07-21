import { cleanData } from "./cleanData.js";
import { normalizeColumns } from "./normalizeColumns.js";
import { detectDatasetType } from "./detectDatasetType.js";
import { detectLevel } from "./detectLevel.js";

/**
 * Memastikan input adalah array of object.
 * Menangani: null, undefined, object tunggal, {rows:[...]}, {data:[...]}.
 */
function toRowArray(rawData) {
  if (Array.isArray(rawData)) return rawData;
  if (!rawData || typeof rawData !== "object") return [];
  // {data: {rows: [...]}} atau {rows: [...]}
  if (rawData.data && Array.isArray(rawData.data.rows)) return rawData.data.rows;
  if (Array.isArray(rawData.data)) return rawData.data;
  if (Array.isArray(rawData.rows)) return rawData.rows;
  if (Array.isArray(rawData.records)) return rawData.records;
  if (Array.isArray(rawData.values)) return rawData.values;
  if (Array.isArray(rawData.result)) return rawData.result;
  // Object tunggal → bungkus jadi array
  return [rawData];
}

/**
 * Main preprocessing pipeline. Accepts raw datasource rows and produces a
 * presentation-neutral result for later visualization or analysis stages.
 */
export function preprocessDataset(rawData = []) {
  // [LOG] Input mentah sebelum apapun
  console.log("[Preprocessing] Raw Dataset:", rawData);

  // Adaptasi: pastikan input adalah array of object
  const inputRows = toRowArray(rawData);
  if (inputRows.length === 0) {
    console.warn("[Preprocessing] Input kosong atau tidak dapat dikonversi ke array.");
  }

  // --- Tahap 1: normalizeColumns ---
  let normalized;
  try {
    normalized = normalizeColumns(inputRows);
    console.log("[Preprocessing] After normalize:", {
      columns: normalized.columns,
      rowCount: normalized.data.length,
      columnMap: normalized.columnMap
    });
  } catch (error) {
    console.error("[Preprocessing] normalizeColumns() GAGAL:", error.message, "| Input:", inputRows.slice(0, 2));
    throw new Error(`normalizeColumns gagal: ${error.message}`);
  }

  // --- Tahap 2: cleanData ---
  let cleaned;
  try {
    cleaned = cleanData(normalized.data);
    // Pastikan cleanData selalu mengembalikan array
    if (!cleaned || !Array.isArray(cleaned.data)) {
      console.warn("[Preprocessing] cleanData() mengembalikan data bukan array, dipaksa ke [].");
      cleaned = { data: [], metadata: { inputRows: 0, outputRows: 0, emptyRowsRemoved: 0, duplicatesRemoved: 0 } };
    }
    console.log("[Preprocessing] After clean:", {
      inputRows: cleaned.metadata.inputRows,
      outputRows: cleaned.metadata.outputRows,
      emptyRowsRemoved: cleaned.metadata.emptyRowsRemoved,
      duplicatesRemoved: cleaned.metadata.duplicatesRemoved
    });
  } catch (error) {
    console.error("[Preprocessing] cleanData() GAGAL:", error.message, "| Input:", normalized.data.slice(0, 2));
    throw new Error(`cleanData gagal: ${error.message}`);
  }

  // --- Tahap 3: detectDatasetType ---
  let datasetStructure;
  try {
    // Pastikan berjalan walaupun hanya ada 1 baris (dataset tingkat provinsi)
    const rowsForDetect = cleaned.data.length > 0 ? cleaned.data : inputRows;
    datasetStructure = detectDatasetType(rowsForDetect, normalized.columns);
    console.log("[Preprocessing] Dataset Structure:", datasetStructure);
  } catch (error) {
    console.error("[Preprocessing] detectDatasetType() GAGAL:", error.message, "| Input rows:", cleaned.data.length);
    // Fallback: struktur minimal agar pipeline tidak berhenti
    datasetStructure = {
      rowCount: cleaned.data.length,
      columns: normalized.columns,
      numericColumns: [],
      categoryColumns: [],
      hasKabupaten: false,
      hasTahun: false,
      hasCategory: false,
      hasNumericValue: false,
      primaryValueColumn: null
    };
    console.warn("[Preprocessing] Menggunakan struktur fallback karena detectDatasetType() gagal.");
  }

  // --- Tahap 4: detectLevel ---
  let datasetLevel;
  try {
    // Pastikan tidak gagal saat kolom tidak ada atau hanya 1 observasi
    datasetLevel = detectLevel(datasetStructure);
    console.log("[Preprocessing] Dataset Level:", datasetLevel);
  } catch (error) {
    console.error("[Preprocessing] detectLevel() GAGAL:", error.message, "| Structure:", datasetStructure);
    datasetLevel = "province_summary";
    console.warn("[Preprocessing] Menggunakan level fallback 'province_summary'.");
  }

  return {
    cleanedData: cleaned.data,
    normalizedColumns: { columns: normalized.columns, columnMap: normalized.columnMap },
    datasetLevel,
    datasetStructure,
    preprocessingMetadata: {
      ...cleaned.metadata,
      originalColumns: Object.keys(normalized.columnMap),
      normalizedColumns: normalized.columns
    }
  };
}
