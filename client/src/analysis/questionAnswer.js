function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function entityLabel(label, type) {
  const text = String(label || "Tidak diketahui");
  if (type === "kabupaten" && !/^(kabupaten|kota)\b/i.test(text)) return `Kabupaten/Kota ${text}`;
  return text;
}

function unitFrom(preprocessingResult) {
  const units = [...new Set((preprocessingResult?.cleanedData || []).map((row) => row.satuan).filter(Boolean))];
  return units.length === 1 ? ` ${units[0]}` : "";
}

export function getQuestionIntent(question = "") {
  const text = String(question).toLocaleLowerCase("id-ID");
  return {
    asksRegion: /\b(kabupaten|kab\.?|kota|wilayah|daerah)\b/.test(text),
    asksCategory: /\b(kategori|komoditas|jenis|kelompok)\b/.test(text),
    asksTrend: /\b(tren|perkembangan|naik|turun|antar[ -]?tahun|dari tahun)\b/.test(text),
    direction: /\b(terendah|terkecil|paling sedikit|minim(?:um)?)\b/.test(text) ? "lowest" : "highest"
  };
}

// Jawaban inti selalu dibentuk dari label dan nilai hasil agregasi, bukan dari
// keluaran model bahasa. Dengan begitu "kabupaten mana" tidak dapat berubah
// menjadi jawaban berupa angka atau nama indikator.
export function buildQuestionAnswer(question, preprocessingResult, insight) {
  const intent = getQuestionIntent(question);
  const stats = insight?.statistics || {};
  const unit = unitFrom(preprocessingResult);

  if (intent.asksTrend && stats.trend) {
    const { previous, current, change } = stats.trend;
    const direction = change > 0 ? "naik" : change < 0 ? "turun" : "tetap";
    return `Nilai agregat ${direction} dari ${formatNumber(previous.value)}${unit} pada ${previous.year} menjadi ${formatNumber(current.value)}${unit} pada ${current.year}.`;
  }

  const result = intent.direction === "lowest" ? stats.smallest : stats.largest;
  if (!result || !Number.isFinite(result.value) || !result.label || result.label === "Tidak diketahui") {
    return "Dataset yang dipilih belum memiliki label dan nilai yang cukup untuk menjawab pertanyaan ini secara akurat.";
  }

  if (intent.asksRegion) {
    return `${entityLabel(result.label, "kabupaten")} memiliki nilai ${intent.direction === "lowest" ? "terendah" : "tertinggi"}, yaitu ${formatNumber(result.value)}${unit}.`;
  }
  if (intent.asksCategory) {
    return `Kategori ${entityLabel(result.label, "kategori")} memiliki nilai ${intent.direction === "lowest" ? "terendah" : "tertinggi"}, yaitu ${formatNumber(result.value)}${unit}.`;
  }
  return insight?.summary || `Nilai ${intent.direction === "lowest" ? "terendah" : "tertinggi"} adalah ${formatNumber(result.value)}${unit}.`;
}
