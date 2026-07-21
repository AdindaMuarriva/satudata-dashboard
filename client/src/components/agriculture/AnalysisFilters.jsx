import { Filter, RotateCcw } from "lucide-react";

const FIRST_DATA_YEAR = 2020;

function availableYears() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: Math.max(currentYear - FIRST_DATA_YEAR + 1, 1) }, (_, index) => String(currentYear - index));
}

const FILTERS = [
  { key: "year", label: "Tahun", options: availableYears() },
  { key: "region", label: "Kabupaten/Kota", options: ["Seluruh Aceh", "Aceh Besar", "Aceh Utara", "Pidie", "Aceh Timur"] },
  { key: "commodity", label: "Komoditas", options: ["Semua komoditas", "Padi", "Jagung", "Kedelai", "Cabai"] },
  { key: "visualization", label: "Jenis Visualisasi", options: ["Bar Chart", "Line Chart", "Pie Chart", "Donut Chart", "Histogram", "Peta Aceh"] }
];

export default function AnalysisFilters({ filters, onChange, onReset }) {
  return (
    <section className="analysis-filter-panel" aria-labelledby="analysis-filter-title">
      <div className="analysis-filter-heading">
        <div><span><Filter size={16} aria-hidden="true" /> FILTER ANALISIS</span><h2 id="analysis-filter-title">Sesuaikan tampilan analisis</h2></div>
        <button type="button" onClick={onReset}><RotateCcw size={15} aria-hidden="true" /> Atur ulang</button>
      </div>
      <div className="analysis-filter-grid">
        {FILTERS.map(filter => (
          <label key={filter.key}>
            <span>{filter.label}</span>
            <select value={filters[filter.key]} onChange={event => onChange(filter.key, event.target.value)}>
              {filter.options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ))}
      </div>
      <p className="analysis-filter-note">Filter ini masih menggunakan data contoh untuk membentuk pengalaman interaksi. Nilai aktual akan tersedia ketika mesin analisis dihubungkan.</p>
    </section>
  );
}
