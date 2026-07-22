import { ArrowUpRight } from "lucide-react";

export default function QuestionCard({ question, category, onSelect }) {
  const selectQuestion = () => onSelect(question);
  const handleKeyDown = event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectQuestion();
    }
  };

  return (
    <article
      className="question-card"
      role="button"
      tabIndex={0}
      aria-label={`Lihat analisis: ${question.title}`}
      onClick={selectQuestion}
      onKeyDown={handleKeyDown}
    >
      <span className="question-card-label">{category.title}</span>
      <span className="question-card-title">{question.title}</span>
      <span className="question-card-description">{question.description}</span>
      <span className="question-card-action">Lihat analisis <ArrowUpRight size={17} aria-hidden="true" /></span>
    </article>
  );
}
