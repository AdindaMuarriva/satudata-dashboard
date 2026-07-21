/**
 * Rule-based dataset matcher for Decision Support Dashboard.
 * This module intentionally only evaluates metadata. It does not fetch data,
 * mutate a dataset, or run preprocessing.
 */

export const DATASET_MATCH_WEIGHTS = {
  title: 0.5,
  description: 0.2,
  tags: 0.2,
  datasetType: 0.1
};

export const DEFAULT_MINIMUM_SCORE = 15;

function normalizeText(value) {
  if (Array.isArray(value)) return value.map(normalizeText).filter(Boolean).join(" ");
  return String(value || "")
    .toLocaleLowerCase("id-ID")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) return [];
  return [...new Set(keywords.map(normalizeText).filter(Boolean))];
}

function keywordCoverage(keywords, sourceText) {
  if (!keywords.length || !sourceText) return 0;
  return keywords.filter(keyword => sourceText.includes(keyword)).length / keywords.length;
}

function datasetTypeCoverage(expectedDatasetType, dataset) {
  if (!expectedDatasetType) return 0;
  const expected = normalizeText(expectedDatasetType);
  const availableTypes = [
    dataset.expectedDatasetType,
    dataset.datasetType,
    dataset.type,
    dataset.metadata?.datasetType,
    dataset.metadata?.type
  ].map(normalizeText).filter(Boolean);

  if (!availableTypes.length) return 0;
  return availableTypes.some(type => type === expected || type.includes(expected) || expected.includes(type)) ? 1 : 0;
}

/**
 * Scores one dataset from 0 to 100 using question metadata.
 * Dataset title, description and tags may use either the generic field names
 * or Portal Satu Data-style aliases (judul, deskripsi, topik).
 */
export function scoreDataset(question, dataset) {
  const keywords = normalizeKeywords(question?.keywords);
  const title = normalizeText(dataset?.title || dataset?.judul);
  const description = normalizeText(dataset?.description || dataset?.deskripsi);
  const tags = normalizeText(
    dataset?.tags || dataset?.tag ||
    [dataset?.topik?.nama, dataset?.bidang, dataset?.bidang_urusan, dataset?.kode_bidang_urusan]
      .filter(Boolean).join(" ")
  );

  const matches = {
    title: keywordCoverage(keywords, title),
    description: keywordCoverage(keywords, description),
    tags: keywordCoverage(keywords, tags),
    datasetType: datasetTypeCoverage(question?.expectedDatasetType, dataset)
  };
  const score = Object.entries(DATASET_MATCH_WEIGHTS).reduce(
    (total, [field, weight]) => total + matches[field] * weight,
    0
  ) * 100;

  return {
    dataset,
    score: Number(score.toFixed(2)),
    matchBreakdown: Object.fromEntries(Object.entries(matches).map(([field, coverage]) => [
      field,
      { coverage: Number((coverage * 100).toFixed(2)), weightedScore: Number((coverage * DATASET_MATCH_WEIGHTS[field] * 100).toFixed(2)) }
    ]))
  };
}

/**
 * Returns all candidates in descending relevance order.
 */
export function rankDatasets(question, datasets = []) {
  if (!question || !Array.isArray(datasets)) return [];
  try {
    return datasets
      .filter(dataset => dataset && typeof dataset === "object")
      .map(dataset => scoreDataset(question, dataset))
      .sort((left, right) => right.score - left.score);
  } catch (error) {
    console.error("[datasetMatcher] rankDatasets error:", error.message);
    return [];
  }
}

/**
 * Returns the best relevant dataset, or a stable no-match result.
 */
export function matchDataset(question, datasets = [], options = {}) {
  const minimumScore = options.minimumScore ?? DEFAULT_MINIMUM_SCORE;
  let candidates;
  try {
    candidates = rankDatasets(question, datasets);
  } catch (error) {
    console.error("[datasetMatcher] matchDataset error saat rankDatasets:", error.message);
    candidates = [];
  }
  const bestMatch = candidates[0];

  if (!bestMatch || bestMatch.score < minimumScore) {
    return {
      status: "no_match",
      message: candidates.length
        ? `Tidak ada dataset yang cukup relevan (skor tertinggi: ${bestMatch?.score ?? 0}%)`
        : "Tidak ada dataset yang tersedia untuk dicocokkan",
      dataset: null,
      score: bestMatch?.score ?? 0,
      matchBreakdown: bestMatch?.matchBreakdown ?? null,
      candidates
    };
  }

  return {
    status: "matched",
    message: "Dataset relevan ditemukan",
    dataset: bestMatch.dataset,
    score: bestMatch.score,
    matchBreakdown: bestMatch.matchBreakdown,
    candidates
  };
}
