import { ArrowUpRight } from "lucide-react";

export default function QuestionCard({ question, category, onSelect, datasets = [] }) {
  return (
    <article className="question-card">
      <span className="question-card-label">{category.title}</span>
      <span className="question-card-title">{question.title}</span>
      <span className="question-card-description">{question.description}</span>
      <details className="question-card-datasets" style={{ width: "100%", marginTop: "12px", color: "#6b7280", fontSize: ".8rem" }}>
        <summary>{datasets.length} dataset terkait</summary>
        {datasets.length ? <ul style={{ maxHeight: "120px", overflow: "auto", margin: "8px 0 0", paddingLeft: "18px" }}>{datasets.map(dataset => <li key={dataset.uuid || dataset.id || dataset.judul || dataset.title}>{dataset.judul || dataset.title || "Tanpa judul"}</li>)}</ul> : <p>Belum ada dataset yang cukup relevan ditemukan.</p>}
      </details>
      <button type="button" className="question-card-action" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }} onClick={() => onSelect(question)}>Lihat analisis <ArrowUpRight size={17} aria-hidden="true" /></button>
    </article>
  );
}
