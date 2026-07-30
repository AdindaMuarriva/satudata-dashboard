import { useMemo } from "react";
import { BarChart3, ChartNoAxesColumnIncreasing, Database, Map, PieChart, Sparkles, TrendingUp } from "lucide-react";
import VisualizationRenderer from "./VisualizationRenderer";
import { generateChartExplanation, generateInsights } from "../../analysis/insightGenerator";
import { selectVisualization } from "../../analysis/visualizationEngine";

const STAGES = [
  { key: "dataset", label: "Dataset", text: "Memilih dataset yang paling relevan.", icon: Database },
  { key: "preprocessing", label: "Preprocessing", text: "Membersihkan dan menyiapkan data terpilih.", icon: Sparkles },
  { key: "visualization", label: "Visualisasi", text: "Rekomendasi grafik ditentukan dari struktur data.", icon: BarChart3 }
];

const VISUALIZATION_ICONS = { "Bar Chart": BarChart3, "Line Chart": TrendingUp, "Pie Chart": PieChart, "Donut Chart": PieChart, Histogram: ChartNoAxesColumnIncreasing, "Peta Aceh": Map };

function statusLabel(status) {
  return { loading: "Memuat", success: "Selesai", error: "Gagal", unavailable: "Tidak ada data", idle: "Menunggu" }[status] || "Menunggu";
}

function formatDate(value) {
  if (!value) return "Belum tercantum";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function datasetUnits(preprocessingResult) {
  const units = [...new Set((preprocessingResult?.cleanedData || []).map(row => row.satuan).filter(Boolean))];
  return units.length ? units.join(", ") : "Tidak tercantum";
}

export default function AnalysisPlaceholder({ filters, selectedDataset, matchResult, preprocessingResult, pipelineStatus, pipelineError, pipelineNotice }) {
  const VisualizationIcon = VISUALIZATION_ICONS[filters.visualization] || BarChart3;
  const insight = useMemo(() => generateInsights(preprocessingResult, filters), [preprocessingResult, filters]);
  const chartModel = useMemo(() => selectVisualization(preprocessingResult, filters), [preprocessingResult, filters]);
  const explanation = useMemo(() => generateChartExplanation(preprocessingResult, filters, chartModel), [preprocessingResult, filters, chartModel]);
  const datasetHasNoRows = pipelineStatus.visualization === "unavailable" && preprocessingResult && !preprocessingResult.cleanedData?.length;

  if (datasetHasNoRows) {
    return <p className="analysis-pipeline-message">Dataset ditemukan, tetapi belum memiliki baris data yang dapat dianalisis untuk periode yang tersedia.</p>;
  }

  return (
    <>
      <section className="analysis-stage-grid" aria-label="Status proses analisis">
        {STAGES.map(({ key, label, text, icon: Icon }) => (
          <article key={label} className="analysis-stage">
            <Icon size={21} aria-hidden="true" />
            <div><strong>{label}</strong><span>{text}</span></div>
            <em>{statusLabel(pipelineStatus[key] || "idle")}</em>
          </article>
        ))}
      </section>

      {(pipelineNotice || pipelineError) && <p className={`analysis-pipeline-message ${pipelineError ? "error" : ""}`}>{pipelineError || pipelineNotice}</p>}

      <div className="analysis-visualization-grid">
      <section className="analysis-placeholder-panel">
        <div className="placeholder-panel-heading"><VisualizationIcon size={23} aria-hidden="true" /><div><h2>Visualisasi Analisis</h2><p>{filters.visualization} untuk {filters.region} pada tahun {filters.year}. Nilai pada chart berasal dari baris data yang berhasil diproses.</p></div></div>
        <div className="analysis-selection-summary" aria-live="polite"><span>{filters.year}</span><span>{filters.region}</span><span>{filters.commodity}</span><span>{filters.visualization}</span></div>
        {preprocessingResult ? <VisualizationRenderer preprocessingResult={preprocessingResult} filters={filters} /> : <div className="analysis-chart-skeleton" aria-label={`Memuat ${filters.visualization}`}></div>}
      </section>

      <section className="analysis-placeholder-panel analysis-map-panel">
        <div className="placeholder-panel-heading"><Map size={23} aria-hidden="true" /><div><h2>Peta Sebaran Wilayah</h2><p>Persebaran nilai per kabupaten/kota untuk tahun {filters.year}.</p></div></div>
        {preprocessingResult ? <VisualizationRenderer preprocessingResult={preprocessingResult} filters={filters} mapOnly /> : <div className="analysis-chart-skeleton" aria-label="Memuat peta sebaran wilayah"></div>}
      </section>
      </div>

      {preprocessingResult ? <section className="analysis-placeholder-panel year-comparison-panel" aria-live="polite">
        <div className="placeholder-panel-heading"><TrendingUp size={23} aria-hidden="true" /><div><h2>Perbandingan Antar-Tahun</h2><p>Menampilkan seluruh tahun dalam rentang pembanding. Filter wilayah dan komoditas tetap diterapkan.</p></div></div>
        <VisualizationRenderer preprocessingResult={preprocessingResult} filters={filters} yearComparison />
      </section> : null}

      {preprocessingResult ? <section className="analysis-placeholder-panel chart-explanation-panel" aria-live="polite">
        <div className="placeholder-panel-heading"><span className="insight-icon" role="img" aria-label="Penjelasan">💡</span><div><h2>{explanation.title}</h2><p>{explanation.guide}</p></div></div>
        <div className="chart-explanation-body">
          {explanation.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {explanation.points.length ? <ul className="analysis-insight-list">{explanation.points.map(point => <li key={point}>{point}</li>)}</ul> : null}
          <p className="chart-explanation-source">Penjelasan ini diperbarui otomatis setiap filter tahun, wilayah, kategori, atau jenis visualisasi berubah.</p>
        </div>
      </section> : null}

      <section className="analysis-detail-grid">
        <article className="analysis-placeholder-panel">
          <div className="placeholder-panel-heading"><span className="insight-icon" role="img" aria-label="Insight">💡</span><div><h2>{insight.title}</h2><p>{insight.summary}</p></div></div>
          {insight.highlights.length ? <ul className="analysis-insight-list">{insight.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul> : null}
          {Object.keys(insight.statistics).length ? <div className="analysis-insight-stats"><span>Total <b>{new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(insight.statistics.total)}</b></span><span>Rata-rata <b>{new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(insight.statistics.average)}</b></span><span>Data <b>{insight.statistics.dataCount}</b></span><span>Kategori <b>{insight.statistics.categoryCount}</b></span></div> : null}
        </article>
        <article className="analysis-placeholder-panel">
          <div className="placeholder-panel-heading"><Database size={23} aria-hidden="true" /><div><h2>Metadata Dataset</h2><p>Identitas, cakupan, dan baris sumber yang dipakai dalam analisis ini.</p></div></div>
          {selectedDataset ? <dl className="dataset-debug-metadata"><div><dt>Dataset sumber visualisasi</dt><dd>{selectedDataset.title || selectedDataset.judul || "Tanpa judul"}</dd></div><div><dt>OPD / instansi</dt><dd>{selectedDataset.organisasi?.nama || "Belum tercantum"}</dd></div><div><dt>Periode yang dibaca</dt><dd>{filters.year || "Seluruh periode yang tersedia"}</dd></div><div><dt>Satuan data</dt><dd>{datasetUnits(preprocessingResult) || selectedDataset.satuan || selectedDataset.pengukuran || "Tidak tercantum"}</dd></div><div><dt>Baris dianalisis</dt><dd>{preprocessingResult?.cleanedData?.length ?? 0} dari {preprocessingResult?.preprocessingMetadata?.inputRows ?? 0} baris sumber</dd></div><div><dt>Kolom yang digunakan</dt><dd>{preprocessingResult?.datasetStructure?.columns?.join(", ") || "Belum terdeteksi"}</dd></div><div><dt>Pembaruan terakhir</dt><dd>{formatDate(selectedDataset.updated_at || selectedDataset.original_updated_at || selectedDataset.created_at)}</dd></div><div><dt>Metode pembacaan</dt><dd>Nilai dihitung dari baris dataset setelah pembersihan duplikasi dan data kosong.</dd></div><div><dt>Skor kecocokan</dt><dd>{matchResult?.score ?? 0}%</dd></div><div><dt>Sumber</dt><dd>Portal Satu Data Aceh</dd></div></dl> : <div className="placeholder-lines"><span></span><span></span><span></span></div>}
        </article>
      </section>
    </>
  );
}
