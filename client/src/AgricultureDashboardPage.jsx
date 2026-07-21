import { useEffect, useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import QuestionCategory from "./components/agriculture/QuestionCategory";
import QuestionDetail from "./components/agriculture/QuestionDetail";
import QuestionSearch from "./components/agriculture/QuestionSearch";
import { AGRICULTURE_QUESTION_CATEGORIES, AGRICULTURE_QUESTIONS } from "./config/questions/agricultureQuestions";
import { fetchDatasetsMultiPage } from "./api";
import { rankDatasets } from "./analysis/datasetMatcher";

export default function AgricultureDashboardPage({ showQuestions = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [datasetsByQuestion, setDatasetsByQuestion] = useState({});
  const [datasetStatus, setDatasetStatus] = useState("idle");
  const visibleCategories = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("id-ID");
    const questions = term
      ? AGRICULTURE_QUESTIONS.filter(question => question.title.toLocaleLowerCase("id-ID").includes(term))
      : AGRICULTURE_QUESTIONS;
    return AGRICULTURE_QUESTION_CATEGORIES.map(category => ({
      ...category,
      questions: questions.filter(question => question.category === category.id)
    })).filter(category => category.questions.length);
  }, [searchTerm]);

  useEffect(() => {
    if (!showQuestions) return undefined;
    let active = true;
    setDatasetStatus("loading");
    fetchDatasetsMultiPage()
      .then(({ rows }) => {
        if (!active) return;
        const matches = Object.fromEntries(AGRICULTURE_QUESTIONS.map(question => [
          question.id,
          rankDatasets(question, rows).filter(candidate => candidate.score >= 15).map(candidate => candidate.dataset)
        ]));
        setDatasetsByQuestion(matches);
        setDatasetStatus("success");
      })
      .catch(error => {
        console.warn("[Question Catalog] Gagal memuat dataset terkait:", error.message);
        if (active) setDatasetStatus("error");
      });
    return () => { active = false; };
  }, [showQuestions]);

  if (selectedQuestion) return <QuestionDetail question={selectedQuestion} onBack={() => setSelectedQuestion(null)} />;

  if (showQuestions) {
    return (
      <main className="agriculture-dashboard-page">
        <a className="back-link" href="?page=dashboard-pertanian">← Kembali ke Dashboard Pertanian</a>
        <section className="agriculture-detail-hero">
          <span>DAFTAR PERTANYAAN</span>
          <h1>Pilih pertanyaan analisis</h1>
          <p>Pilih satu pertanyaan untuk membuka halaman analisis yang fokus pada jawaban, visualisasi, insight, dan dataset terkait.</p>
          <QuestionSearch value={searchTerm} onChange={setSearchTerm} />
        </section>
        <section className="question-catalog" aria-labelledby="question-catalog-title">
          <div className="question-catalog-heading"><div><span>PILIH KEBUTUHAN INFORMASI</span><h2 id="question-catalog-title">Apa yang ingin Anda ketahui?</h2></div><p>{datasetStatus === "loading" ? "Memuat dataset terkait untuk semua pertanyaan..." : searchTerm ? `${visibleCategories.reduce((total, category) => total + category.questions.length, 0)} pertanyaan ditemukan` : `${AGRICULTURE_QUESTIONS.length} pertanyaan analisis tersedia.`}</p></div>
          {visibleCategories.length ? visibleCategories.map(category => <QuestionCategory key={category.id} category={category} questions={category.questions} onSelect={setSelectedQuestion} datasetsByQuestion={datasetsByQuestion} />) : <div className="question-empty-state"><h2>Pertanyaan tidak ditemukan</h2><p>Coba gunakan kata kunci lain, seperti “padi”, “lahan”, atau “irigasi”.</p></div>}
        </section>
      </main>
    );
  }

  return (
    <main className="agriculture-dashboard-page">
      <a className="back-link" href="?">← Kembali ke beranda</a>
      <section className="agriculture-dashboard-hero">
        <span>DASHBOARD PENDUKUNG KEPUTUSAN</span>
        <div className="agriculture-hero-title"><span className="agriculture-hero-icon"><Sprout size={30} aria-hidden="true" /></span><h1>Dashboard Analisis Pertanian Aceh</h1></div>
        <p>Gunakan dashboard ini untuk menjawab kebutuhan informasi pertanian Aceh melalui dataset, visualisasi, peta, dan insight yang relevan.</p>
        <a className="hero-panel-link" href="?page=dashboard-pertanian-pertanyaan">Buka Daftar Pertanyaan</a>
      </section>
      <section className="analysis-placeholder-panel"><div className="placeholder-panel-heading"><Sprout size={23} aria-hidden="true" /><div><h2>Mulai analisis berbasis pertanyaan</h2><p>Daftar pertanyaan dipisahkan agar halaman ini tetap ringkas. Setelah memilih pertanyaan, halaman analisis hanya menampilkan jawaban untuk pertanyaan tersebut.</p></div></div></section>
    </main>
  );
}
