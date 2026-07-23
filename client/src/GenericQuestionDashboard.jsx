import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { CONFIG, fetchDatasetsMultiPage } from "./api";
import DataQuestionAssistant from "./components/DataQuestionAssistant";
import QuestionCategory from "./components/agriculture/QuestionCategory";
import QuestionDetail from "./components/agriculture/QuestionDetail";
import QuestionSearch from "./components/agriculture/QuestionSearch";

function getCategoryName(dataset, fallback) {
  return String(dataset.topik?.nama || dataset.bidang || dataset.organisasi?.nama || fallback)
    .replace(/\s+/g, " ").trim();
}

function slug(value) {
  return String(value).toLocaleLowerCase("id-ID").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/(^-|-$)/g, "") || "lainnya";
}

function hasPeriodMetadata(dataset) {
  return /tahun|year|periode|tren|perkembangan/i.test([dataset.judul, dataset.deskripsi, dataset.dimensi, dataset.pengukuran].filter(Boolean).join(" "));
}

function createDatasetQuestions(datasets, themeLabel) {
  return datasets.flatMap(dataset => {
    const datasetTitle = String(dataset.judul || "dataset").replace(/\s+/g, " ").trim();
    const category = slug(getCategoryName(dataset, `${themeLabel} lainnya`));
    const keywords = datasetTitle.split(/\s+/).filter(word => word.length > 2);
    const base = { category, datasetUuid: dataset.uuid, keywords, expectedDatasetType: "dataset_portal" };
    return [
      { ...base, id: `${dataset.uuid}-overview`, title: dataset.dashboardQuestion || `Bagaimana gambaran ${datasetTitle}?`, description: dataset.dashboardQuestionDescription || `Menampilkan nilai, perbandingan, dan kategori yang tersedia pada dataset ${datasetTitle}.`, recommendedChart: "Bar Chart" },
      { ...base, id: `${dataset.uuid}-comparison`, title: `Wilayah atau kategori mana yang memiliki nilai tertinggi pada ${datasetTitle}?`, description: `Menyusun peringkat berdasarkan data ${datasetTitle}.`, recommendedChart: "Bar Chart" },
      ...(hasPeriodMetadata(dataset) ? [{ ...base, id: `${dataset.uuid}-trend`, title: `Bagaimana perkembangan ${datasetTitle} antar periode?`, description: `Meninjau perubahan data ${datasetTitle} pada periode yang tersedia.`, recommendedChart: "Line Chart" }] : [])
    ];
  });
}

export default function GenericQuestionDashboard({ themeLabel, title, filterDataset, analysisLabel }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    let active = true;
    const load = () => fetchDatasetsMultiPage().then(({ rows }) => {
      if (active) setDatasets(rows.filter(filterDataset));
    }).catch(error => console.warn(`[${themeLabel}] Gagal memuat dataset:`, error.message));
    load();
    const refreshId = window.setInterval(load, CONFIG.pollingIntervalMs);
    window.addEventListener("satudata-local-datasets-updated", load);
    return () => { active = false; window.clearInterval(refreshId); window.removeEventListener("satudata-local-datasets-updated", load); };
  }, [filterDataset, themeLabel]);

  const questions = useMemo(() => createDatasetQuestions(datasets, themeLabel), [datasets, themeLabel]);
  const categories = useMemo(() => {
    const terms = searchTerm.trim().toLocaleLowerCase("id-ID");
    const filtered = terms ? questions.filter(question => `${question.title} ${question.description}`.toLocaleLowerCase("id-ID").includes(terms)) : questions;
    const names = new Map(datasets.map(dataset => [slug(getCategoryName(dataset, `${themeLabel} lainnya`)), getCategoryName(dataset, `${themeLabel} lainnya`)]));
    return [...names.entries()].map(([id, name], index) => ({ id, label: String(index + 1).padStart(2, "0"), title: name, description: `Pertanyaan spesifik dari dataset ${themeLabel} pada kelompok ${name}.`, questions: filtered.filter(question => question.category === id) })).filter(category => category.questions.length);
  }, [datasets, questions, searchTerm, themeLabel]);

  if (selectedQuestion) return <QuestionDetail question={selectedQuestion} onBack={() => setSelectedQuestion(null)} analysisLabel={analysisLabel} />;
  return <main className="agriculture-dashboard-page">
    <a className="back-link" href="?"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda</a>
    <section className="agriculture-dashboard-hero">
      <span>DASHBOARD PENDUKUNG KEPUTUSAN</span>
      <div className="agriculture-hero-title"><span className="agriculture-hero-icon"><LayoutDashboard size={30} aria-hidden="true" /></span><h1>{title}</h1></div>
      <p>Pilih pertanyaan yang paling spesifik untuk membuka analisis berbasis dataset asli, chart, filter periode, dan penjelasan hasilnya.</p>
      <QuestionSearch value={searchTerm} onChange={setSearchTerm} placeholder={`Cari pertanyaan atau dataset ${themeLabel}...`} />
    </section>
    <section className="question-catalog" aria-labelledby="question-catalog-title">
      <DataQuestionAssistant datasets={datasets} themeLabel={themeLabel} />
      <div className="question-catalog-heading"><div><span>PILIH KEBUTUHAN INFORMASI</span><h2 id="question-catalog-title">Apa yang ingin Anda ketahui?</h2></div><p>{searchTerm ? `${categories.reduce((total, category) => total + category.questions.length, 0)} pertanyaan ditemukan` : `${questions.length} pertanyaan analisis dari ${datasets.length} dataset tersedia.`}</p></div>
      {categories.length ? categories.map(category => <QuestionCategory key={category.id} category={category} questions={category.questions} onSelect={setSelectedQuestion} />) : <div className="question-empty-state"><h2>Pertanyaan tidak ditemukan</h2><p>Coba kata kunci lain atau tunggu dataset tema ini selesai dimuat.</p></div>}
    </section>
  </main>;
}
