import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import AnalysisPlaceholder from "./AnalysisPlaceholder";
import AnalysisFilters from "./AnalysisFilters";
import { fetchDatasetValues, fetchDatasetsMultiPage } from "../../api";
import { matchDataset } from "../../analysis/datasetMatcher";
import { preprocessDataset } from "../../preprocessing/preprocessDataset";

const DEFAULT_FILTERS = { year: String(new Date().getFullYear()), region: "Seluruh Aceh", commodity: "Semua komoditas", visualization: "Bar Chart" };

function normalizeYears(years = []) {
  return [...new Set(years.map(item => item?.year ?? item).map(value => String(value ?? "").match(/\b(19|20)\d{2}\b/)?.[0]).filter(Boolean))]
    .sort((left, right) => Number(right) - Number(left));
}

function yearsFromRows(rows = []) {
  return normalizeYears(rows.flatMap(row => Object.entries(row || {}).filter(([column]) => /(^|[_\s-])(tahun|year|periode)([_\s-]|$)/i.test(column)).map(([, value]) => value)));
}

export default function QuestionDetail({ question, onBack, analysisLabel = "ANALISIS PERTANIAN" }) {
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, visualization: question.recommendedChart || DEFAULT_FILTERS.visualization }));
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [preprocessingResult, setPreprocessingResult] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState({ dataset: "idle", preprocessing: "idle", visualization: "idle" });
  const [pipelineError, setPipelineError] = useState("");
  const [pipelineNotice, setPipelineNotice] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const resolvedQuestionRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function runPipeline() {
      const initialQuestion = resolvedQuestionRef.current !== question.id;
      if (initialQuestion) resolvedQuestionRef.current = question.id;
      setSelectedDataset(null); setMatchResult(null); setPreprocessingResult(null); setPipelineError(""); setPipelineNotice("");
      setPipelineStatus({ dataset: "loading", preprocessing: "idle", visualization: "idle" });
      try {
        const { rows: datasets } = await fetchDatasetsMultiPage();
        if (!datasets.length) throw new Error("Daftar dataset portal tidak tersedia.");
        const direct = question.datasetUuid ? datasets.find(dataset => dataset.uuid === question.datasetUuid) : null;
        const result = direct ? { status: "matched", dataset: direct, score: 100 } : matchDataset(question, datasets);
        if (result.status !== "matched" || !result.dataset) throw new Error("Tidak ada dataset portal yang cukup relevan untuk pertanyaan ini. Data contoh tidak digunakan.");
        if (!active) return;
        setSelectedDataset(result.dataset); setMatchResult(result);
        setPipelineStatus({ dataset: "success", preprocessing: "loading", visualization: "idle" });

        const datasetId = result.dataset.uuid || result.dataset.id;
        if (!datasetId) throw new Error("Dataset sumber tidak memiliki ID yang valid.");
        let response = await fetchDatasetValues(datasetId, filters.year);
        const metadataYears = normalizeYears(response.years);
        if (metadataYears.length) setAvailableYears(metadataYears);
        if (initialQuestion && metadataYears[0] && metadataYears[0] !== filters.year) {
          setPipelineNotice(`Menampilkan tahun terbaru yang tersedia: ${metadataYears[0]}.`);
          setFilters(current => ({ ...current, year: metadataYears[0] }));
          return;
        }
        if (!response.rows.length && metadataYears[0]) {
          setPipelineNotice(`Data untuk tahun ${filters.year} tidak tersedia. Menampilkan tahun ${metadataYears[0]}.`);
          setFilters(current => ({ ...current, year: metadataYears[0] }));
          return;
        }
        if (!response.rows.length) response = await fetchDatasetValues(datasetId, "");
        if (!response.rows.length) throw new Error("Dataset ditemukan, tetapi belum memiliki baris data yang dapat dianalisis.");

        const rowYears = yearsFromRows(response.rows);
        if (rowYears.length) setAvailableYears(current => normalizeYears([...current, ...rowYears]));
        const processed = preprocessDataset(response.rows);
        if (!processed.cleanedData.length) throw new Error("Baris data sumber tidak dapat diproses.");
        const hasTrend = processed.datasetStructure.hasTahun && new Set(processed.cleanedData.map(row => row.tahun).filter(Boolean)).size > 1;
        if (filters.visualization === "Line Chart" && !hasTrend) setPipelineNotice("Dataset ini tidak memiliki minimal dua periode; chart perbandingan ditampilkan sebagai pengganti tren.");
        if (!active) return;
        setPreprocessingResult(processed);
        setPipelineStatus({ dataset: "success", preprocessing: "success", visualization: "success" });
      } catch (error) {
        if (!active) return;
        setPipelineError(error.message || "Analisis tidak dapat dilakukan.");
        setPipelineStatus({ dataset: "error", preprocessing: "error", visualization: "idle" });
      }
    }
    runPipeline();
    return () => { active = false; };
  }, [question, filters.year]);

  return <main className="agriculture-dashboard-page">
    <button type="button" className="analysis-back-button dashboard-back-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Kembali ke Daftar Pertanyaan</button>
    <section className="agriculture-detail-hero"><span>{analysisLabel}</span><h1>{question.title}</h1><p>Chart dan penjelasan dibuat hanya dari baris data dataset sumber yang tersedia di Portal Satu Data Aceh.</p></section>
    <AnalysisFilters filters={filters} availableYears={availableYears} onChange={(key, value) => setFilters(current => ({ ...current, [key]: value }))} onReset={() => setFilters(current => ({ ...DEFAULT_FILTERS, year: availableYears[0] || current.year, visualization: question.recommendedChart || "Bar Chart" }))} />
    <AnalysisPlaceholder filters={filters} selectedDataset={selectedDataset} matchResult={matchResult} preprocessingResult={preprocessingResult} pipelineStatus={pipelineStatus} pipelineError={pipelineError} pipelineNotice={pipelineNotice} />
  </main>;
}
