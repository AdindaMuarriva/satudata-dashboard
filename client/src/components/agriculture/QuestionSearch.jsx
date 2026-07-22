import { Search } from "lucide-react";

export default function QuestionSearch({ value, onChange, placeholder = "Cari pertanyaan analisis..." }) {
  return (
    <label className="agriculture-question-search">
      <Search size={20} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Cari pertanyaan analisis"
      />
    </label>
  );
}
