import { useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import QuestionCategory from "./components/agriculture/QuestionCategory";
import QuestionDetail from "./components/agriculture/QuestionDetail";
import QuestionSearch from "./components/agriculture/QuestionSearch";
import { AGRICULTURE_QUESTION_CATEGORIES, AGRICULTURE_QUESTIONS } from "./config/questions/agricultureQuestions";

export default function AgricultureDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);
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

  if (selectedQuestion) return <QuestionDetail question={selectedQuestion} onBack={() => setSelectedQuestion(null)} />;

  return (
    <main className="agriculture-dashboard-page">
      <a className="back-link" href="?">← Kembali ke beranda</a>
      <section className="agriculture-dashboard-hero">
        <span>DASHBOARD PENDUKUNG KEPUTUSAN</span>
        <div className="agriculture-hero-title"><span className="agriculture-hero-icon"><Sprout size={30} aria-hidden="true" /></span><h1>Dashboard Analisis Pertanian Aceh</h1></div>
        <p>Pilih pertanyaan yang ingin Anda jawab. Dashboard akan membantu menghubungkan pertanyaan dengan data, analisis, dan insight yang relevan.</p>
        <QuestionSearch value={searchTerm} onChange={setSearchTerm} />
      </section>
      <section className="question-catalog" aria-labelledby="question-catalog-title">
        <div className="question-catalog-heading"><div><span>PILIH KEBUTUHAN INFORMASI</span><h2 id="question-catalog-title">Apa yang ingin Anda ketahui?</h2></div><p>{searchTerm ? `${visibleCategories.reduce((total, category) => total + category.questions.length, 0)} pertanyaan ditemukan` : "Pilih satu pertanyaan untuk memulai analisis."}</p></div>
        {visibleCategories.length ? visibleCategories.map(category => <QuestionCategory key={category.id} category={category} questions={category.questions} onSelect={setSelectedQuestion} />) : <div className="question-empty-state"><h2>Pertanyaan tidak ditemukan</h2><p>Coba gunakan kata kunci lain, seperti “padi”, “lahan”, atau “irigasi”.</p></div>}
      </section>
    </main>
  );
}
