import { useEffect, useRef, useState } from "react";
import { buildColorScale, extractLabelValue, fetchDatasetMeta, fetchDatasetValues, fetchYearlyTrend, pickAggregator, rowsHaveKabupaten } from "./api";
import { renderChoroplethMap, renderColorLegend, renderMultiTrendChart } from "./charts";

export default function ComparePage({ datasetIds, tooltipRef }) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMapId, setActiveMapId] = useState("");
  const chartRef = useRef(null);
  const mapRef = useRef(null);
  const mapLegendRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const loaded = await Promise.all(datasetIds.slice(0, 5).map(async uuid => {
          const meta = (await fetchDatasetMeta(uuid)).data;
          const initialYear = /^\d{4}$/.test(String(meta?.dimensi)) ? meta.dimensi : new Date().getFullYear();
          const initialData = await fetchDatasetValues(uuid, initialYear);
          const years = initialData.years.length ? initialData.years : [initialYear];
          const trend = await fetchYearlyTrend(uuid, years, pickAggregator(meta));
          const mapRows = initialData.rows.map(extractLabelValue).filter(row => !isNaN(row.value));
          return {
            uuid,
            title: meta?.judul || "Tanpa judul",
            satuan: meta?.satuan || "nilai",
            data: trend,
            mapRows: rowsHaveKabupaten(initialData.rows) ? mapRows : [],
            mapYear: initialData.rows[0]?.tahun || initialYear
          };
        }));
        if (mounted) {
          const usable = loaded.filter(item => item.data.length);
          setSeries(usable);
          setActiveMapId(usable.find(item => item.mapRows.length)?.uuid || "");
        }
      } catch (err) {
        console.error("Gagal memuat perbandingan dataset:", err);
        if (mounted) setError("Data perbandingan gagal dimuat. Silakan coba lagi.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (datasetIds.length) load(); else { setLoading(false); setError("Pilih minimal satu dataset dari halaman pencarian."); }
    return () => { mounted = false; };
  }, [datasetIds.join(",")]);

  useEffect(() => {
    if (series.length && chartRef.current) renderMultiTrendChart(chartRef.current, series, tooltipRef.current);
  }, [series, tooltipRef]);

  const mapOptions = series.filter(item => item.mapRows.length);
  const activeMap = mapOptions.find(item => item.uuid === activeMapId) || mapOptions[0];

  useEffect(() => {
    if (!activeMap || !mapRef.current) return;
    const color = buildColorScale(activeMap.mapRows);
    renderColorLegend(mapLegendRef.current, color, activeMap.satuan);
    renderChoroplethMap(mapRef.current, activeMap.mapRows, activeMap.satuan, color, tooltipRef.current)
      .catch(error => console.error("Gagal memuat peta perbandingan:", error));
  }, [activeMapId, activeMap, tooltipRef]);

  return (
    <main className="comparison-page">
      <a className="back-link" href="javascript:history.back()">← Kembali ke hasil pencarian</a>
      <section className="comparison-hero">
        <span>PERBANDINGAN DATASET</span>
        <h1>Visualisasi Gabungan</h1>
        <p>Perbandingan tren agregat antar dataset. Dataset dengan satuan berbeda tetap ditampilkan sebagai seri terpisah.</p>
      </section>
      {loading ? <div className="search-result-message"><p>Memuat visualisasi gabungan...</p></div> : error ? <div className="search-result-message"><p>{error}</p></div> : (
        <>
          <section className="comparison-summary">
            {series.map((item, index) => {
              const latest = item.data[item.data.length - 1];
              return (
                <div className="comparison-summary-card" key={item.uuid} style={{ "--series-color": `var(--series-${index % 5})` }}>
                  <span className="comparison-series-dot"></span>
                  <span className="comparison-series-title">{item.title}</span>
                  <strong>{latest ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(latest.value) : "—"}</strong>
                  <small>{latest ? `Tahun ${latest.year} · ${item.satuan}` : item.satuan}</small>
                </div>
              );
            })}
          </section>
          <section className="comparison-chart panel wide">
            <div className="comparison-chart-heading">
              <div><h2>Tren Dataset Terpilih</h2><div className="sub">Nilai pada sumbu vertikal menggunakan skala yang sama untuk memudahkan perbandingan.</div></div>
              <span className="comparison-tip">Arahkan kursor ke titik grafik untuk detail nilai</span>
            </div>
            <div ref={chartRef}></div>
          </section>
          {activeMap && (
            <section className="comparison-map panel wide">
              <div className="comparison-chart-heading">
                <div>
                  <h2>Peta Sebaran Wilayah</h2>
                  <div className="sub">Pilih dataset untuk melihat perbedaan nilai antar kabupaten/kota pada peta.</div>
                </div>
                <label className="map-dataset-picker">Dataset pada peta
                  <select value={activeMap.uuid} onChange={event => setActiveMapId(event.target.value)}>
                    {mapOptions.map(item => <option key={item.uuid} value={item.uuid}>{item.title}</option>)}
                  </select>
                </label>
              </div>
              <div className="comparison-map-meta">Tahun {activeMap.mapYear} · Satuan: {activeMap.satuan}</div>
              <div ref={mapRef}></div>
              <svg ref={mapLegendRef} width="100%" height="46"></svg>
            </section>
          )}
        </>
      )}
    </main>
  );
}
