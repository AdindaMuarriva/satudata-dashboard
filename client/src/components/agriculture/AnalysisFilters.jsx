import { Filter, RotateCcw } from "lucide-react";

const FIRST_DATA_YEAR = 2020;

function fallbackYears() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: Math.max(currentYear - FIRST_DATA_YEAR + 1, 1) }, (_, index) => String(currentYear - index));
}

function comparisonRange(years = []) {
  const sorted = [...years].sort((left, right) => Number(left) - Number(right));
  if (sorted.length < 2) return null;
  return { value: `${sorted[0]}-${sorted.at(-1)}`, label: `${sorted[0]}–${sorted.at(-1)}` };
}

const FILTERS = [
  { key: "year", label: "Tahun", options: fallbackYears() },
  { key: "region", label: "Kabupaten/Kota", options: ["Seluruh Aceh", "Aceh Besar", "Aceh Utara", "Pidie", "Aceh Timur"] },
  { key: "commodity", label: "Komoditas", options: ["Semua komoditas", "Padi", "Jagung", "Kedelai", "Cabai"] },
  { key: "visualization", label: "Jenis Visualisasi", options: ["Bar Chart", "Line Chart", "Pie Chart", "Donut Chart", "Histogram", "Peta Aceh"] }
];

export default function AnalysisFilters({ filters, onChange, onReset, availableYears = [] }) {
  const datasetYears = availableYears.length ? availableYears : fallbackYears();
  const comparisonYears = comparisonRange(datasetYears);
  const filtersWithDataYears = [
    { ...FILTERS[0], options: datasetYears },
    { key: "comparisonYear", label: "Rentang Tahun Pembanding", options: comparisonYears ? [comparisonYears] : [] },
    ...FILTERS.slice(1)
  ];

  return (
    <section className="analysis-filter-panel" aria-labelledby="analysis-filter-title">
      <div className="analysis-filter-heading">
        <div><span><Filter size={16} aria-hidden="true" /> FILTER ANALISIS</span><h2 id="analysis-filter-title">Sesuaikan tampilan analisis</h2></div>
        <button type="button" onClick={onReset}><RotateCcw size={15} aria-hidden="true" /> Atur ulang</button>
      </div>
      <div className="analysis-filter-grid">
        {filtersWithDataYears.map(filter => (
          <label key={filter.key}>
            <span>{filter.label}</span>
            <select value={filters[filter.key]} onChange={event => onChange(filter.key, event.target.value)}>
              {filter.options.length ? filter.options.map(option => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>) : <option value="">Belum ada tahun lain</option>}
            </select>
          </label>
        ))}
      </div>
      <p className="analysis-filter-note">Tahun utama hanya menampilkan periode yang tersedia pada dataset. Rentang tahun pembanding diringkas otomatis agar seluruh periode lebih mudah dilihat.</p>
    </section>
  );
}
