import { Search } from "lucide-react";

export default function QuestionSearch({ value, onChange }) {
  return (
    <label className="agriculture-question-search">
      <Search size={20} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="Cari pertanyaan analisis, misalnya produksi padi..."
        aria-label="Cari pertanyaan analisis pertanian"
      />
    </label>
  );
}
