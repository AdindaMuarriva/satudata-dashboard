import { ArrowUpRight } from "lucide-react";

export default function QuestionCard({ question, category, onSelect }) {
  return (
    <button type="button" className="question-card" onClick={() => onSelect(question)}>
      <span className="question-card-label">{category.title}</span>
      <span className="question-card-title">{question.title}</span>
      <span className="question-card-description">{question.description}</span>
      <span className="question-card-action">Lihat analisis <ArrowUpRight size={17} aria-hidden="true" /></span>
    </button>
  );
}
