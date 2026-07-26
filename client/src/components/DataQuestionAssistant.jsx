import { useState } from "react";
import { BrainCircuit, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { fetchDatasetValues, requestAiExplanation } from "../api";
import { rankDatasets } from "../analysis/datasetMatcher";
import { generateInsights } from "../analysis/insightGenerator";
import { preprocessDataset } from "../preprocessing/preprocessDataset";
import VisualizationRenderer from "./agriculture/VisualizationRenderer";

const STOP_WORDS = new Set(["apa", "apakah", "bagaimana", "berapa", "yang", "di", "ke", "dan", "atau", "dari", "untuk", "dengan", "pada", "tahun", "data", "saya", "tolong", "tampilkan", "lihat", "informasi", "aceh", "mohon", "ingin", "tentang", "dalam", "sebuah", "pada"]);

function createQuestionRequest(text) {
  const normalized = text.toLocaleLowerCase("id-ID").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter(word => word.length > 2 && !STOP_WORDS.has(word));
  // Semua kata bermakna dipakai untuk pencocokan. Frasa tidak dimasukkan ke
  // penyebut skor karena judul portal sering memakai susunan kata berbeda.
  return { query: text, keywords: [...new Set(words)], title: text };
}

function requestedVisualization(text) {
  const query = text.toLocaleLowerCase("id-ID");
  // Penyebutan jenis chart secara eksplisit selalu menang atas kata konteks
  // seperti "tahun" atau "kabupaten".
  if (/(pie\s*chart|diagram\s*pie|diagram\s*lingkaran)/.test(query)) return "Pie Chart";
  if (/(donut|doughnut)/.test(query)) return "Donut Chart";
  if (/(histogram|distribusi)/.test(query)) return "Histogram";
  if (/(peta|map\b)/.test(query)) return "Peta Aceh";
  if (/(line\s*chart|grafik\s*garis|tren|perkembangan|naik|turun)/.test(query)) return "Line Chart";
  if (/(bar\s*chart|grafik\s*batang|perbandingan|tertinggi|terendah)/.test(query)) return "Bar Chart";
  if (/(komposisi|proporsi|persentase|bagian)/.test(query)) return "Donut Chart";
  if (/(wilayah|kabupaten|kota)/.test(query)) return "Peta Aceh";
  return "Bar Chart";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

export default function DataQuestionAssistant({ datasets, themeLabel }) {
  const [question, setQuestion] = useState("");
  const [state, setState] = useState({ status: "idle", error: "", dataset: null, score: 0, processed: null, rowCount: 0, year: "", visualization: "Bar Chart", aiExplanation: "", aiNotice: "" });
  const [feedback, setFeedback] = useState("");

  function saveFeedback(value) {
    const entry = { value, question, dataset: state.dataset?.uuid || null, createdAt: new Date().toISOString() };
    const key = "satudata_ai_feedback";
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || "[]");
      const previous = Array.isArray(saved) ? saved : [];
      window.localStorage.setItem(key, JSON.stringify([...previous.slice(-49), entry]));
    } catch {
      // Feedback is optional; storage can be blocked or contain malformed data.
    }
    setFeedback(value);
  }

  async function ask(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;
    setFeedback("");
    const visualization = requestedVisualization(text);
    setState({ status: "loading", error: "", dataset: null, score: 0, processed: null, rowCount: 0, year: "", visualization, aiExplanation: "", aiNotice: "" });
    try {
      const candidates = rankDatasets(createQuestionRequest(text), datasets).filter(item => item.score > 0).slice(0, 8);
      if (!candidates.length) throw new Error(`Belum ada dataset ${themeLabel} yang cocok dengan kata kunci pertanyaan tersebut.`);
      for (const candidate of candidates) {
        const first = await fetchDatasetValues(candidate.dataset.uuid, "");
        const rows = first.rows || [];
        if (!rows.length) continue;
        const processed = preprocessDataset(rows);
        if (!processed.cleanedData.length) continue;
        const years = [...new Set((first.years || []).map(item => String(item?.year ?? item)).filter(year => /^\d{4}$/.test(year)))].sort((a, b) => Number(b) - Number(a));
        const insight = generateInsights(processed, { region: "Seluruh Aceh", commodity: "Semua komoditas" });
        let aiExplanation = "";
        let aiNotice = "Penjelasan statistik dibuat otomatis dari dataset sumber.";
        try {
          aiExplanation = await requestAiExplanation({ context: {
            question: text, dataset: candidate.dataset.judul || "Tanpa judul", rowsAnalyzed: processed.cleanedData.length,
            chart: visualization, summary: insight.summary, highlights: insight.highlights,
            largest: insight.statistics.largest, smallest: insight.statistics.smallest, average: insight.statistics.average,
            matchedTerms: createQuestionRequest(text).keywords.slice(0, 12)
          } }) || "";
          if (aiExplanation) aiNotice = "Penjelasan ini dibuat model AI dari ringkasan statistik dataset sumber.";
        } catch (aiError) {
          aiNotice = `Model AI belum tersedia; ${aiError.message}`;
        }
        setState({ status: "ready", error: "", dataset: candidate.dataset, score: candidate.score, processed, rowCount: processed.cleanedData.length, year: years[0] || "seluruh periode", visualization, aiExplanation, aiNotice });
        return;
      }
      throw new Error("Dataset yang relevan ditemukan, tetapi belum memiliki baris data yang dapat dianalisis.");
    } catch (error) {
      setState({ status: "error", error: error.message || "Analisis tidak dapat dilakukan.", dataset: null, score: 0, processed: null, rowCount: 0, year: "", visualization, aiExplanation: "", aiNotice: "" });
    }
  }

  const insight = state.processed ? generateInsights(state.processed, { region: "Seluruh Aceh", commodity: "Semua komoditas" }) : null;
  return (
    <section className="panel data-question-assistant" aria-label="Asisten AI data">
      <div className="data-question-heading"><BrainCircuit size={24} aria-hidden="true" /><div><h2>Tanya Data dengan AI</h2><p>Tulis pertanyaan Anda. Jawaban dihitung dari dataset asli Portal Satu Data Aceh dan selalu mencantumkan sumbernya.</p></div></div>
      <form className="data-question-form" onSubmit={ask}>
        <input value={question} onChange={event => setQuestion(event.target.value)} placeholder={`Contoh: Kabupaten mana yang memiliki angka ${themeLabel} tertinggi?`} aria-label="Pertanyaan tentang data" />
        <button type="submit" disabled={state.status === "loading" || !question.trim()}>{state.status === "loading" ? "Menganalisis..." : <><Send size={16} /> Tanya</>}</button>
      </form>
      <p className="data-question-disclaimer">Chart dan angka selalu dihitung dari data sumber. Model AI, bila server telah dikonfigurasi, hanya menyusun penjelasannya.</p>
      {state.status === "error" && <p className="data-question-error">{state.error}</p>}
      {state.status === "ready" && insight && <div className="data-question-answer" aria-live="polite">
        <div className="data-question-source"><strong>Sumber: {state.dataset.judul || "Tanpa judul"}</strong><span>{state.dataset.organisasi?.nama || "OPD tidak tercantum"} · {state.rowCount} baris dianalisis · relevansi {state.score}%</span></div>
        <VisualizationRenderer preprocessingResult={state.processed} filters={{ year: "", region: "Seluruh Aceh", commodity: "Semua komoditas", visualization: state.visualization }} />
        <div className="data-question-explanation"><h3>Penjelasan chart</h3><p>{state.aiExplanation || insight.summary}</p><small>{state.aiNotice}</small>
          {insight.highlights.length > 0 && <ul>{insight.highlights.map(item => <li key={item}>{item}</li>)}</ul>}
          {insight.statistics.largest && <div className="data-question-stats"><span>Nilai tertinggi <b>{insight.statistics.largest.label}</b> · {formatNumber(insight.statistics.largest.value)}</span><span>Rata-rata <b>{formatNumber(insight.statistics.average)}</b></span><span>Periode <b>{state.year}</b></span></div>}
          <div className="ai-feedback" aria-label="Umpan balik jawaban AI"><span>Apakah jawaban ini membantu?</span><button type="button" className={feedback === "helpful" ? "selected" : ""} onClick={() => saveFeedback("helpful")}><ThumbsUp size={15} /> Membantu</button><button type="button" className={feedback === "not-helpful" ? "selected" : ""} onClick={() => saveFeedback("not-helpful")}><ThumbsDown size={15} /> Belum membantu</button>{feedback && <small>Terima kasih, masukan Anda tersimpan di perangkat ini.</small>}</div>
        </div>
      </div>}
    </section>
  );
}
