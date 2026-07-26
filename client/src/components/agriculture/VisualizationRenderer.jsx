import { useEffect, useMemo, useRef } from "react";
import { BarChart3, ChartNoAxesColumnIncreasing, Download, Map, PieChart, TrendingUp } from "lucide-react";
import { renderBarChart, renderDonutChart, renderRegionalChoropleth, renderTrendChart } from "../../charts";
import { selectVisualization, selectYearComparison } from "../../analysis/visualizationEngine";

const TYPE_ICONS = { bar: BarChart3, line: TrendingUp, pie: PieChart, donut: PieChart, histogram: ChartNoAxesColumnIncreasing, map: Map };

function downloadChartData(model) {
  const rows = (model.data || []).map(item => ({ label: item.label ?? item.year ?? "", value: item.value ?? 0 }));
  const csv = ["Label,Nilai", ...rows.map(row => `"${String(row.label).replaceAll('"', '""')}",${row.value}`)].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = "data-visualisasi-satu-data-aceh.csv"; link.click();
  URL.revokeObjectURL(url);
}

export default function VisualizationRenderer({ preprocessingResult, filters, yearComparison = false }) {
  const containerRef = useRef(null);
  const trendRef = useRef(null);
  const mapRef = useRef(null);
  const chartFilters = useMemo(() => filters.visualization === "Peta Aceh" ? { ...filters, visualization: "Bar Chart" } : filters, [filters]);
  const model = useMemo(() => selectVisualization(preprocessingResult, chartFilters), [preprocessingResult, chartFilters]);
  const mapModel = useMemo(() => selectVisualization(preprocessingResult, { ...filters, visualization: "Peta Aceh" }), [preprocessingResult, filters]);

  useEffect(() => {
    if (model.status !== "ready") return;
    const tooltip = document.querySelector(".tooltip");
    if (model.type === "bar" && containerRef.current) renderBarChart(containerRef.current, model.data, model.unit || model.valueColumn, tooltip);
    if ((model.type === "pie" || model.type === "donut") && containerRef.current) renderDonutChart(containerRef.current, model.data, tooltip, { donut: model.type === "donut", unit: model.unit });
    if (model.type === "line" && trendRef.current) renderTrendChart(trendRef.current, model.data, model.unit || model.valueColumn, tooltip);
    if (mapModel.status === "ready" && mapModel.type === "map" && mapRef.current) renderRegionalChoropleth(mapRef.current, mapModel.data, mapModel.unit || mapModel.valueColumn, tooltip).catch(error => console.error("[Visualization] Gagal merender Peta Aceh:", error));
    console.log("[Visualization] Data dikirim ke renderer:", { type: model.type, sourceRows: model.sourceRowCount, renderedPoints: model.renderedDataCount });
  }, [model, mapModel]);

  if (model.status !== "ready") return <p className="visualization-unavailable">{model.message || "Visualisasi tidak tersedia untuk dataset ini."}</p>;
  const Icon = TYPE_ICONS[model.type] || BarChart3;

  return (
    <div className="visualization-renderer">
      <div className="visualization-renderer-heading"><Icon size={18} aria-hidden="true" /><strong>{model.title}</strong>{model.unit ? <small>Satuan: {model.unit}</small> : null}<span>{model.type}</span><button type="button" className="chart-download-button" onClick={() => downloadChartData(model)}><Download size={15} /> Unduh CSV</button></div>
      {model.notice ? <p className="visualization-unavailable">{model.notice}</p> : null}
      {model.type === "bar" || model.type === "pie" || model.type === "donut" ? <div ref={containerRef} className="visualization-canvas"></div> : null}
      {model.type === "line" ? <svg ref={trendRef} className="visualization-trend" width="100%" height="300"></svg> : null}
      {model.type === "histogram" ? <div className="visualization-histogram">{model.data.map(bin => <div key={bin.label}><span style={{ height: `${Math.max(bin.value * 28, 8)}px` }}></span><small>{bin.label}</small></div>)}</div> : null}
      {model.type === "map" ? <>
        <div className="map-reading-note">Arahkan kursor ke kabupaten/kota untuk melihat nilai. Warna yang lebih pekat menandakan nilai lebih tinggi pada data yang sedang dipilih.</div>
        <div ref={mapRef} className="visualization-map-canvas"></div>
        {mapSummary ? <div className="map-data-summary">
          <div><span>Wilayah berdata</span><strong>{mapSummary.count}</strong></div>
          <div><span>Nilai tertinggi</span><strong>{mapSummary.highest?.label || "-"}</strong><small>{mapSummary.highest?.value ?? "-"} {model.unit || ""}</small></div>
          <div><span>Nilai terendah</span><strong>{mapSummary.lowest?.label || "-"}</strong><small>{mapSummary.lowest?.value ?? "-"} {model.unit || ""}</small></div>
        </div> : null}
      </> : null}
    </div>
  );
}
