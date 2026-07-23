import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, HeartHandshake } from "lucide-react";
import { CONFIG, fetchDatasetsMultiPage, isSocialRelevant } from "./api";
import QuestionCategory from "./components/agriculture/QuestionCategory";
import QuestionDetail from "./components/agriculture/QuestionDetail";
import QuestionSearch from "./components/agriculture/QuestionSearch";
import { SOCIAL_QUESTION_CATEGORIES, SOCIAL_QUESTIONS, createSocialDatasetQuestions } from "./config/questions/socialQuestions";
import DataQuestionAssistant from "./components/DataQuestionAssistant";

export default function SocialDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [datasetQuestions, setDatasetQuestions] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const allQuestions = useMemo(() => [...SOCIAL_QUESTIONS, ...datasetQuestions], [datasetQuestions]);
  const visibleCategories = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("id-ID");
    const questions = term ? allQuestions.filter(question => `${question.title} ${question.description}`.toLocaleLowerCase("id-ID").includes(term)) : allQuestions;
    return SOCIAL_QUESTION_CATEGORIES.map(category => ({ ...category, questions: questions.filter(question => question.category === category.id) })).filter(category => category.questions.length);
  }, [allQuestions, searchTerm]);

  useEffect(() => {
    let active = true;
    const loadDatasetQuestions = () => fetchDatasetsMultiPage()
      .then(({ rows }) => { if (active) { const themedDatasets = rows.filter(isSocialRelevant); setDatasets(themedDatasets); setDatasetQuestions(createSocialDatasetQuestions(themedDatasets)); } })
      .catch(error => console.warn("[Social Question Catalog] Gagal memuat pertanyaan dari dataset portal:", error.message));
    loadDatasetQuestions();
    const refreshId = window.setInterval(loadDatasetQuestions, CONFIG.pollingIntervalMs);
    window.addEventListener("satudata-local-datasets-updated", loadDatasetQuestions);
    return () => {
      active = false;
      window.clearInterval(refreshId);
      window.removeEventListener("satudata-local-datasets-updated", loadDatasetQuestions);
    };
  }, []);

  if (selectedQuestion) return <QuestionDetail question={selectedQuestion} onBack={() => setSelectedQuestion(null)} analysisLabel="ANALISIS SOSIAL" />;

  return (
    <main className="agriculture-dashboard-page">
      <a className="back-link" href="?"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda</a>
      <section className="agriculture-dashboard-hero">
        <span>DASHBOARD PENDUKUNG KEPUTUSAN</span>
        <div className="agriculture-hero-title"><span className="agriculture-hero-icon"><HeartHandshake size={30} aria-hidden="true" /></span><h1>Dashboard Analisis Sosial Aceh</h1></div>
        <p>Gunakan dashboard ini untuk menjawab kebutuhan informasi sosial Aceh melalui dataset, visualisasi, peta, dan insight yang relevan.</p>
        <QuestionSearch value={searchTerm} onChange={setSearchTerm} placeholder="Cari pertanyaan analisis sosial, misalnya kemiskinan..." />
      </section>
      <section className="question-catalog" aria-labelledby="social-question-catalog-title">
        <DataQuestionAssistant datasets={datasets} themeLabel="sosial" />
        <div className="question-catalog-heading"><div><span>PILIH KEBUTUHAN INFORMASI</span><h2 id="social-question-catalog-title">Apa yang ingin Anda ketahui?</h2></div><p>{searchTerm ? `${visibleCategories.reduce((total, category) => total + category.questions.length, 0)} pertanyaan ditemukan` : `${allQuestions.length} pertanyaan analisis tersedia.`}</p></div>
        {visibleCategories.length ? visibleCategories.map(category => <QuestionCategory key={category.id} category={category} questions={category.questions} onSelect={setSelectedQuestion} />) : <div className="question-empty-state"><h2>Pertanyaan tidak ditemukan</h2><p>Coba gunakan kata kunci lain, seperti “kemiskinan”, “anak”, atau “lansia”.</p></div>}
      </section>
    </main>
  );
}
