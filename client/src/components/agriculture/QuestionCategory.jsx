import QuestionCard from "./QuestionCard";

export default function QuestionCategory({ category, questions, onSelect }) {
  return (
    <section className="question-category" aria-labelledby={`category-${category.id}`}>
      <div className="question-category-head">
        <span>{category.label}</span>
        <h2 id={`category-${category.id}`}>{category.title}</h2>
        <p>{category.description}</p>
      </div>
      <div className="question-card-grid">
        {questions.map(question => <QuestionCard key={question.id} question={question} category={category} onSelect={onSelect} />)}
      </div>
    </section>
  );
}
