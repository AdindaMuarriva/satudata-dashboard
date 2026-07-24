import test from "node:test";
import assert from "node:assert/strict";
import { preprocessDataset } from "../src/preprocessing/preprocessDataset.js";
import { generateInsights } from "../src/analysis/insightGenerator.js";
import { selectVisualization, selectYearComparison } from "../src/analysis/visualizationEngine.js";
import { matchDataset } from "../src/analysis/datasetMatcher.js";

const rows = [
  { "Kab/Kota": "Aceh Besar", Tahun: "2023", Nilai: "120", Satuan: "orang" },
  { "Kab/Kota": "Aceh Utara", Tahun: "2023", Nilai: "100", Satuan: "orang" },
  { "Kab/Kota": "Aceh Besar", Tahun: "2024", Nilai: "130", Satuan: "orang" },
  { "Kab/Kota": "Aceh Utara", Tahun: "2024", Nilai: "110", Satuan: "orang" }
];

test("pipeline memakai data numerik sumber untuk insight dan chart", () => {
  const processed = preprocessDataset(rows);
  const insight = generateInsights(processed, { year: "2024", region: "Seluruh Aceh", commodity: "Semua komoditas" });
  const chart = selectVisualization(processed, { year: "2024", region: "Seluruh Aceh", commodity: "Semua komoditas", visualization: "Bar Chart" });
  assert.equal(processed.cleanedData.length, 4);
  assert.equal(insight.statistics.largest.label, "Aceh Besar");
  assert.equal(chart.status, "ready");
  assert.equal(chart.data[0].value, 130);
});

test("dataset matcher memilih metadata portal yang relevan", () => {
  const result = matchDataset({ keywords: ["kemiskinan", "kabupaten"] }, [
    { uuid: "jalan", judul: "Panjang Jalan Kabupaten", deskripsi: "Infrastruktur" },
    { uuid: "miskin", judul: "Angka Kemiskinan Kabupaten", deskripsi: "Data kemiskinan Aceh" }
  ]);
  assert.equal(result.status, "matched");
  assert.equal(result.dataset.uuid, "miskin");
});

test("perbandingan antar-tahun memakai seluruh periode, bukan tahun filter aktif", () => {
  const processed = preprocessDataset(rows);
  const comparison = selectYearComparison(processed, { year: "2024", region: "Seluruh Aceh", commodity: "Semua komoditas" });
  assert.equal(comparison.status, "ready");
  assert.deepEqual(comparison.data.map(item => item.year), [2023, 2024]);
  assert.deepEqual(comparison.data.map(item => item.value), [220, 240]);
});

test("rentang tahun pembanding menandai batas rentang tanpa menyembunyikan tahun lain", () => {
  const processed = preprocessDataset(rows);
  const comparison = selectYearComparison(processed, { year: "2024", comparisonYear: "2023-2024", region: "Seluruh Aceh", commodity: "Semua komoditas" });
  assert.equal(comparison.status, "ready");
  assert.deepEqual(comparison.data.map(item => item.year), [2023, 2024]);
  assert.deepEqual(comparison.highlightYears, [2024, 2023]);
  assert.match(comparison.notice, /rentang 2023–2024/);
});

test("perbandingan antar-tahun memberi pemberitahuan bila hanya ada satu tahun", () => {
  const processed = preprocessDataset(rows.filter(row => row.Tahun === "2024"));
  const comparison = selectYearComparison(processed, { region: "Seluruh Aceh", commodity: "Semua komoditas" });
  assert.equal(comparison.status, "unavailable");
  assert.match(comparison.message, /hanya memiliki data pada tahun 2024/);
});
