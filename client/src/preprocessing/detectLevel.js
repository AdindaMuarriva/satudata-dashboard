/**
 * Classifies data shape into a visualization-oriented level.
 */
export function detectLevel(structure = {}) {
  const { hasKabupaten, hasTahun, hasCategory, hasNumericValue, numericColumns = [] } = structure;
  if (hasKabupaten && hasTahun && hasNumericValue) return "time_series_district";
  if (hasTahun && hasNumericValue) return "province_trend";
  if (hasKabupaten && hasNumericValue) return "district_comparison";
  if (hasCategory && hasNumericValue) return "categorical";
  if (numericColumns.length > 1) return "distribution";
  return "province_summary";
}
