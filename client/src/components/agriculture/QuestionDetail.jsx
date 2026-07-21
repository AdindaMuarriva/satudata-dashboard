import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import AnalysisPlaceholder from "./AnalysisPlaceholder";
import AnalysisFilters from "./AnalysisFilters";
import { fetchDatasetValues, fetchDatasetsMultiPage } from "../../api";
import { matchDataset } from "../../analysis/datasetMatcher";
import { preprocessDataset } from "../../preprocessing/preprocessDataset";

const DEFAULT_FILTERS = {
  year: String(new Date().getFullYear()),
  region: "Seluruh Aceh",
  commodity: "Semua komoditas",
  visualization: "Bar Chart"
};

function createDummyDataset(question) {
  return {
    id: `dummy-${question.id}`,
    title: `Data Contoh: ${question.title}`,
    description: question.description,
    tags: question.keywords,
    datasetType: question.expectedDatasetType,
    organization: "Contoh Satu Data Aceh",
    resources: [],
    isDummy: true,
    data: [
      { "Kab/Kota": "Aceh Besar", Tahun: "2024", Komoditas: "Padi", Nilai: "1.250,5" },
      { "Kab/Kota": "Aceh Utara", Tahun: "2024", Komoditas: "Padi", Nilai: "1.120" },
      { "Kab/Kota": "Pidie", Tahun: "2023", Komoditas: "Padi", Nilai: "980" },
      { "Kab/Kota": "Aceh Besar", Tahun: "2024", Komoditas: "Padi", Nilai: "1.250,5" },
      {}
    ]
  };
}

export default function QuestionDetail({ question, onBack }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [relatedDatasets, setRelatedDatasets] = useState([]);
  const [analysisDatasets, setAnalysisDatasets] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [preprocessingResult, setPreprocessingResult] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState({ dataset: "idle", preprocessing: "idle", visualization: "idle" });
  const [pipelineError, setPipelineError] = useState("");
  const [pipelineNotice, setPipelineNotice] = useState("");
  const handleFilterChange = (key, value) => setFilters(current => ({ ...current, [key]: value }));

  useEffect(() => {
    let active = true;

    async function runPipeline() {
      setSelectedDataset(null);
      setRelatedDatasets([]);
      setAnalysisDatasets([]);
      setMatchResult(null);
      setPreprocessingResult(null);
      setPipelineError("");
      setPipelineNotice("");
      setPipelineStatus({ dataset: "loading", preprocessing: "idle", visualization: "idle" });

      // [LOG] Tahap 1: Question yang dipilih
      console.log("[Pipeline] 1. Question dipilih:", question);

      let dataset;
      let result;
      let datasetsForAnalysis = [];
      try {
        const { rows } = await fetchDatasetsMultiPage();

        // [LOG] Tahap 2: Jumlah dataset dari API
        console.log("[Pipeline] 2. Jumlah dataset dari API:", rows.length, "dataset");

        if (!rows.length) throw new Error("Daftar dataset dari API tidak tersedia");

        // [LOG] Tahap 3: Hasil rankDatasets
        const { rankDatasets } = await import("../../analysis/datasetMatcher");
        const ranked = rankDatasets(question, rows);
        console.log("[Pipeline] 3. Hasil rankDatasets (5 teratas):", ranked.slice(0, 5).map(r => ({ judul: r.dataset?.judul, score: r.score })));
        const related = ranked.filter(candidate => candidate.score >= 15).map(candidate => candidate.dataset);
        setRelatedDatasets(related);
        datasetsForAnalysis = related;

        // [LOG] Tahap 4: Hasil matchDataset
        result = matchDataset(question, rows);
        console.log("[Pipeline] 4. Hasil matchDataset:", { status: result.status, score: result.score, message: result.message });

        if (result.status === "no_match") {
          // [FIX] Jangan langsung error — gunakan fallback dummy dataset
          console.warn("[Pipeline] matchDataset no_match (skor terlalu rendah). Menggunakan fallback dataset contoh.");
          dataset = createDummyDataset(question);
          result = matchDataset(question, [dataset]);
          setRelatedDatasets([dataset]);
          datasetsForAnalysis = [dataset];
          if (!active) return;
          setPipelineNotice(`Tidak ada dataset yang cukup relevan di portal (skor tertinggi: ${ranked[0]?.score ?? 0}%). Dataset contoh digunakan untuk menguji alur analisis.`);
        } else {
          dataset = result.dataset;
        }
      } catch (error) {
        // [LOG] Tahap API gagal → fallback
        console.warn("[Pipeline] Fetch API gagal:", error.message, "→ menggunakan fallback dataset contoh.");
        dataset = createDummyDataset(question);
        result = matchDataset(question, [dataset]);
        setRelatedDatasets([dataset]);
        datasetsForAnalysis = [dataset];
        if (!active) return;
        setPipelineNotice(`API tidak tersedia. Dataset contoh digunakan untuk menguji alur analisis. (${error.message})`);
      }

      // [LOG] Tahap 5: Dataset terpilih
      console.log("[Pipeline] 5. Dataset terpilih:", { judul: dataset?.judul || dataset?.title, uuid: dataset?.uuid, isDummy: dataset?.isDummy });

      if (!active) return;
      setSelectedDataset(dataset);
      setMatchResult(result);
      setPipelineStatus({ dataset: dataset.isDummy ? "fallback" : "success", preprocessing: "loading", visualization: "idle" });

      try {
        let rawData;
        if (dataset.isDummy) {
          rawData = dataset.data;
          console.log("[Pipeline] 6. Menggunakan data dummy (isDummy=true).");
        } else {
          // Validasi: pastikan dataset memiliki uuid
          const datasetId = dataset.uuid || dataset.id;
          if (!datasetId) {
            throw new Error("Dataset tidak memiliki ID yang valid untuk pengambilan data");
          }

          // [LOG] Tahap 6: URL datasource yang digunakan
          const datasourcePath = `/api/datasets/${datasetId}/datasources/json?tahun=${filters.year}&limit=500&page=0&sortByColumn=&sortByType=`;
          console.log("[Pipeline] 6. URL datasource:", datasourcePath);

          const fetchResult = await fetchDatasetValues(datasetId, filters.year);
          rawData = fetchResult.rows;

          // Jika kosong untuk tahun dipilih, coba tahun tersedia dari metadata
          if (!rawData || rawData.length === 0) {
            const availableYears = fetchResult.years || [];
            console.warn("[Pipeline] Data kosong untuk tahun", filters.year, "| Tersedia:", availableYears);

            if (availableYears.length > 0) {
              // Ambil tahun pertama yang tersedia
              const fallbackYear = String(availableYears[0]);
              console.log("[Pipeline] Mencoba fallback ke tahun", fallbackYear);
              const retryResult = await fetchDatasetValues(datasetId, fallbackYear);
              rawData = retryResult.rows;
              if (rawData && rawData.length > 0) {
                console.log("[Pipeline] Berhasil mengambil data untuk tahun fallback", fallbackYear, ":", rawData.length, "baris");
              }
            }

            // Jika masih kosong, coba tanpa filter tahun sama sekali
            if (!rawData || rawData.length === 0) {
              console.log("[Pipeline] Mencoba fetch tanpa filter tahun...");
              const noYearResult = await fetchDatasetValues(datasetId, "");
              rawData = noYearResult.rows;
              if (rawData && rawData.length > 0) {
                console.log("[Pipeline] Berhasil mengambil data tanpa filter tahun:", rawData.length, "baris");
              }
            }

            if (!rawData || rawData.length === 0) {
              const yearsLabel = availableYears.length
                ? `(tahun tersedia di API: ${availableYears.join(", ")})`
                : "(tidak ada tahun yang tersedia di metadata)";
              throw new Error(`Dataset berhasil ditemukan tetapi tidak ada data untuk tahun ${filters.year} ${yearsLabel}`);
            }
          }

          console.log("[Pipeline] 6. Datasource mengembalikan", rawData.length, "baris data.");
        }

        // [LOG] Tahap 7: Hasil preprocessDataset
        const processed = preprocessDataset(rawData);
        console.log("[Pipeline] 7. Hasil preprocessDataset:", { cleanedRows: processed.cleanedData?.length, datasetStructure: processed.datasetStructure, datasetLevel: processed.datasetLevel });

        if (!active) return;
        setPreprocessingResult(processed);
        const processedDatasets = await Promise.all(datasetsForAnalysis.map(async candidate => {
          const candidateId = candidate.uuid || candidate.id;
          const isSelected = candidateId && candidateId === (dataset.uuid || dataset.id);
          if (isSelected) return { dataset: candidate, preprocessingResult: processed };
          try {
            if (!candidateId) throw new Error("Dataset tidak memiliki ID yang valid");
            const values = candidate.isDummy ? candidate.data : (await fetchDatasetValues(candidateId, filters.year)).rows;
            if (!values?.length) throw new Error(`Tidak ada data untuk tahun ${filters.year}`);
            return { dataset: candidate, preprocessingResult: preprocessDataset(values) };
          } catch (error) {
            console.warn("[Pipeline] Dataset terkait tidak dapat divisualisasikan:", candidate.title || candidate.judul, error.message);
            return { dataset: candidate, error: error.message };
          }
        }));
        if (!active) return;
        setAnalysisDatasets(processedDatasets.length ? processedDatasets : [{ dataset, preprocessingResult: processed }]);
        setPipelineStatus({ dataset: dataset.isDummy ? "fallback" : "success", preprocessing: "success", visualization: "success" });
      } catch (error) {
        console.error("[Pipeline] Error tahap preprocessing/datasource:", error.message);
        if (!active) return;
        setPipelineError(error.message);
        setPipelineStatus({ dataset: dataset.isDummy ? "fallback" : "success", preprocessing: "error", visualization: "idle" });
      }
    }

    runPipeline();
    return () => { active = false; };
  }, [question, filters.year]);

  return (
    <main className="agriculture-dashboard-page">
      <button type="button" className="analysis-back-button" onClick={onBack}><ArrowLeft size={18} aria-hidden="true" /> Kembali ke Daftar Pertanyaan</button>
      <section className="agriculture-detail-hero">
        <span>ANALISIS PERTANIAN</span>
        <h1>{question.title}</h1>
        <p>Halaman ini menyiapkan alur analisis berbasis pertanyaan. Dataset, preprocessing, visualisasi, insight, dan metadata akan dihubungkan pada tahap berikutnya.</p>
      </section>
      <AnalysisFilters filters={filters} onChange={handleFilterChange} onReset={() => setFilters(DEFAULT_FILTERS)} />
      <AnalysisPlaceholder
        filters={filters}
        selectedDataset={selectedDataset}
        relatedDatasets={relatedDatasets}
        analysisDatasets={analysisDatasets}
        matchResult={matchResult}
        preprocessingResult={preprocessingResult}
        pipelineStatus={pipelineStatus}
        pipelineError={pipelineError}
        pipelineNotice={pipelineNotice}
      />
    </main>
  );
}
