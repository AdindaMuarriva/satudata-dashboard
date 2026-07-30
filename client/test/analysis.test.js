import test from "node:test";
import assert from "node:assert/strict";
import { preprocessDataset } from "../src/preprocessing/preprocessDataset.js";
import { generateInsights } from "../src/analysis/insightGenerator.js";
import { getDatasetFilterOptions, selectVisualization, selectYearComparison } from "../src/analysis/visualizationEngine.js";
import { matchDataset } from "../src/analysis/datasetMatcher.js";
import { buildQuestionAnswer, validateQuestionAgainstDataset } from "../src/analysis/questionAnswer.js";

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

test("perbandingan antar-tahun memakai agregasi nilai asli per tahun", () => {
  const processed = preprocessDataset(rows);
  const comparison = selectYearComparison(processed, {
    year: "2024",
    comparisonYear: "2023-2024",
    region: "Seluruh Aceh",
    commodity: "Semua komoditas"
  });

  assert.equal(comparison.status, "ready");
  assert.equal(comparison.type, "line");
  assert.deepEqual(comparison.data, [
    { label: 2023, value: 220, year: 2023 },
    { label: 2024, value: 240, year: 2024 }
  ]);
});

test("jawaban pertanyaan kabupaten menyebut kabupaten, bukan hanya nilai", () => {
  const processed = preprocessDataset(rows);
  const insight = generateInsights(processed, { region: "Seluruh Aceh", commodity: "Semua komoditas" });
  const answer = buildQuestionAnswer("Kabupaten mana yang memiliki hasil panen tertinggi?", processed, insight);
  assert.match(answer, /Kabupaten\/Kota Aceh Besar/);
  assert.match(answer, /250/);
});

test("dataset matcher memilih metadata portal yang relevan", () => {
  const result = matchDataset({ keywords: ["kemiskinan", "kabupaten"] }, [
    { uuid: "jalan", judul: "Panjang Jalan Kabupaten", deskripsi: "Infrastruktur" },
    { uuid: "miskin", judul: "Angka Kemiskinan Kabupaten", deskripsi: "Data kemiskinan Aceh" }
  ]);
  assert.equal(result.status, "matched");
  assert.equal(result.dataset.uuid, "miskin");
});

test("filter wilayah dibuat dari nilai dataset, bukan daftar contoh", () => {
  const processed = preprocessDataset(rows);
  assert.deepEqual(getDatasetFilterOptions(processed), {
    regions: ["Aceh Besar", "Aceh Utara"],
    commodities: [],
    categories: []
  });
});

test("pertanyaan ditolak bila struktur dataset tidak mendukungnya", () => {
  const oneYear = preprocessDataset(rows.filter(row => row.Tahun === "2024"));
  assert.match(validateQuestionAgainstDataset("Bagaimana perkembangan data dari tahun ke tahun?", oneYear), /minimal dua periode/);
  assert.match(validateQuestionAgainstDataset("Komoditas apa yang terbesar?", oneYear), /kategori atau komoditas/);

  const provincial = preprocessDataset([{ Tahun: "2024", Nilai: "42", Satuan: "persen" }]);
  assert.match(validateQuestionAgainstDataset("Kabupaten mana yang tertinggi?", provincial), /kabupaten\/kota/);
});

test("dataset dengan kecocokan kata yang terlalu rendah tidak dipilih", () => {
  const result = matchDataset({ keywords: ["jalan", "abc", "def", "ghi", "jkl"] }, [
    { uuid: "jalan", judul: "Panjang Jalan", deskripsi: "Data infrastruktur" }
  ]);
  assert.equal(result.status, "no_match");
});
