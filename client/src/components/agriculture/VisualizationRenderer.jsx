import { useEffect, useMemo, useRef } from "react";
import { BarChart3, ChartNoAxesColumnIncreasing, Map, PieChart, TrendingUp } from "lucide-react";
import { renderBarChart, renderDonutChart, renderRegionalChoropleth, renderTrendChart } from "../../charts";
import { selectVisualization } from "../../analysis/visualizationEngine";

const TYPE_ICONS = { bar: BarChart3, line: TrendingUp, pie: PieChart, donut: PieChart, histogram: ChartNoAxesColumnIncreasing, map: Map };

export default function VisualizationRenderer({ preprocessingResult, filters }) {
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
      <div className="visualization-renderer-heading"><Icon size={18} aria-hidden="true" /><strong>{model.title}</strong>{model.unit ? <small>Satuan: {model.unit}</small> : null}<span>{model.type}</span></div>
      {model.notice ? <p className="visualization-unavailable">{model.notice}</p> : null}
      <div className={mapModel.status === "ready" && mapModel.type === "map" ? "visualization-content-grid" : ""} style={mapModel.status === "ready" && mapModel.type === "map" ? { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, .85fr)", gap: "16px", alignItems: "start" } : undefined}>
        <div>
          {model.type === "bar" || model.type === "pie" || model.type === "donut" ? <div ref={containerRef} className="visualization-canvas"></div> : null}
          {model.type === "line" ? <svg ref={trendRef} className="visualization-trend" width="100%" height="300"></svg> : null}
          {model.type === "histogram" ? <div className="visualization-histogram">{model.data.map(bin => <div key={bin.label}><span style={{ height: `${Math.max(bin.value * 28, 8)}px` }}></span><small>{bin.label}</small></div>)}</div> : null}
        </div>
        {mapModel.status === "ready" && mapModel.type === "map" ? <aside className="visualization-map-panel" style={{ padding: "14px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fffafa" }}><div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#8e1414" }}><Map size={17} aria-hidden="true" /><strong>Peta Aceh</strong>{mapModel.unit ? <small>Satuan: {mapModel.unit}</small> : null}</div><div ref={mapRef} className="visualization-map-canvas"></div></aside> : null}
      </div>
    </div>
  );
}
