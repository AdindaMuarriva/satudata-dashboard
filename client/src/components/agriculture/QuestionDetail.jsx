import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import AnalysisPlaceholder from "./AnalysisPlaceholder";
import AnalysisFilters from "./AnalysisFilters";
import { CONFIG, fetchDatasetValues, fetchDatasetsMultiPage } from "../../api";
import { matchDataset } from "../../analysis/datasetMatcher";
import { preprocessDataset } from "../../preprocessing/preprocessDataset";

const DEFAULT_FILTERS = { year: String(new Date().getFullYear()), comparisonYear: "", region: "Seluruh Aceh", commodity: "Semua komoditas", visualization: "Bar Chart" };

function normalizeYears(years = []) {
  return [...new Set(years.map(item => item?.year ?? item).map(value => String(value ?? "").match(/\b(19|20)\d{2}\b/)?.[0]).filter(Boolean))]
    .sort((left, right) => Number(right) - Number(left));
}

function yearsFromRows(rows = []) {
  return normalizeYears(rows.flatMap(row => Object.entries(row || {}).filter(([column]) => /(^|[_\s-])(tahun|year|periode)([_\s-]|$)/i.test(column)).map(([, value]) => value)));
}

function defaultYearForDevice(years, fallbackYear) {
  const deviceYear = String(new Date().getFullYear());
  return years.includes(deviceYear) ? deviceYear : years.includes(String(fallbackYear)) ? String(fallbackYear) : years[0] || String(fallbackYear);
}

function defaultComparisonYear(years) {
  const sorted = [...years].sort((left, right) => Number(left) - Number(right));
  return sorted.length > 1 ? `${sorted[0]}-${sorted.at(-1)}` : "";
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
  const [refreshToken, setRefreshToken] = useState(0);
  const resolvedQuestionRef = useRef(null);

  useEffect(() => {
    const refresh = () => setRefreshToken(current => current + 1);
    const refreshId = window.setInterval(refresh, CONFIG.pollingIntervalMs);
    window.addEventListener("satudata-local-datasets-updated", refresh);
    return () => {
      window.clearInterval(refreshId);
      window.removeEventListener("satudata-local-datasets-updated", refresh);
    };
  }, []);

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
        // Ambil semua periode agar visualisasi perbandingan antar-tahun selalu
        // memakai data terbaru, sementara chart utama tetap difilter di renderer.
        let response = await fetchDatasetValues(datasetId, "");
        const metadataYears = normalizeYears(response.years);
        if (metadataYears.length) {
          setAvailableYears(metadataYears);
          const defaultYear = defaultYearForDevice(metadataYears, filters.year);
          setFilters(current => {
            const year = defaultYearForDevice(metadataYears, current.year);
            const comparisonYear = current.comparisonYear === defaultComparisonYear(metadataYears)
              ? current.comparisonYear
              : defaultComparisonYear(metadataYears);
            return { ...current, year, comparisonYear };
          });
          if (initialQuestion && defaultYear !== filters.year) {
            setPipelineNotice(`Menampilkan tahun ${defaultYear} yang tersedia pada dataset.`);
            return;
          }
        }
        if (!response.rows.length && metadataYears[0]) {
          response = await fetchDatasetValues(datasetId, metadataYears[0]);
        }
        if (!response.rows.length && metadataYears[0]) {
          setPipelineNotice(`Data untuk tahun ${filters.year} tidak tersedia. Menampilkan tahun ${metadataYears[0]}.`);
          setFilters(current => ({ ...current, year: metadataYears[0] }));
          return;
        }
        if (!response.rows.length) response = await fetchDatasetValues(datasetId, "");
        if (!response.rows.length) {
          // Some portal datasets have metadata but no datasource rows. This is
          // not a preprocessing failure: keep the pipeline usable and show a
          // precise empty-data message in the visualization area.
          const processed = preprocessDataset([]);
          if (!active) return;
          setPipelineNotice("Dataset ditemukan, tetapi belum memiliki baris data yang dapat dianalisis untuk periode yang tersedia.");
          setPreprocessingResult(processed);
          setPipelineStatus({ dataset: "success", preprocessing: "success", visualization: "unavailable" });
          return;
        }

        const rowYears = yearsFromRows(response.rows);
        if (rowYears.length) {
          const datasetYears = normalizeYears([...metadataYears, ...rowYears]);
          setAvailableYears(datasetYears);
          setFilters(current => {
            const year = defaultYearForDevice(datasetYears, current.year);
            const comparisonYear = current.comparisonYear === defaultComparisonYear(datasetYears)
              ? current.comparisonYear
              : defaultComparisonYear(datasetYears);
            return { ...current, year, comparisonYear };
          });
        }
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
  }, [question, filters.year, refreshToken]);

  return <main className="agriculture-dashboard-page">
    <button type="button" className="analysis-back-button dashboard-back-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Kembali ke Daftar Pertanyaan</button>
    <section className="agriculture-detail-hero"><span>{analysisLabel}</span><h1>{question.title}</h1><p>Chart dan penjelasan dibuat hanya dari baris data dataset sumber yang tersedia di Portal Satu Data Aceh.</p></section>
    <AnalysisFilters filters={filters} availableYears={availableYears} onChange={(key, value) => setFilters(current => {
      if (key !== "year") return { ...current, [key]: value };
      const comparisonYear = defaultComparisonYear(availableYears);
      return { ...current, year: value, comparisonYear };
    })} onReset={() => setFilters(current => {
      const year = defaultYearForDevice(availableYears, current.year);
      return { ...DEFAULT_FILTERS, year, comparisonYear: defaultComparisonYear(availableYears), visualization: question.recommendedChart || "Bar Chart" };
    })} />
    <AnalysisPlaceholder filters={filters} selectedDataset={selectedDataset} matchResult={matchResult} preprocessingResult={preprocessingResult} pipelineStatus={pipelineStatus} pipelineError={pipelineError} pipelineNotice={pipelineNotice} />
  </main>;
}
