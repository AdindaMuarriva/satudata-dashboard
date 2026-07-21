import { useEffect, useMemo, useRef } from "react";
import { BarChart3, ChartNoAxesColumnIncreasing, CircleDollarSign, PieChart, TrendingUp } from "lucide-react";
import { renderBarChart, renderDonutChart, renderTrendChart } from "../../charts";
import { selectVisualization } from "../../analysis/visualizationEngine";

const TYPE_ICONS = { bar: BarChart3, line: TrendingUp, donut: PieChart, kpi: CircleDollarSign, histogram: ChartNoAxesColumnIncreasing };

export default function VisualizationRenderer({ preprocessingResult, filters }) {
  const containerRef = useRef(null);
  const trendRef = useRef(null);
  const model = useMemo(() => selectVisualization(preprocessingResult, filters), [preprocessingResult, filters]);

  useEffect(() => {
    if (model.status !== "ready") return;
    const tooltip = document.querySelector(".tooltip");
    if (model.type === "bar" && containerRef.current) renderBarChart(containerRef.current, model.data, "nilai", tooltip);
    if (model.type === "donut" && containerRef.current) renderDonutChart(containerRef.current, model.data, tooltip);
    if (model.type === "line" && trendRef.current) renderTrendChart(trendRef.current, model.data, "nilai", tooltip);
  }, [model]);

  if (model.status !== "ready") return <p className="visualization-unavailable">Visualization not available for this dataset.</p>;
  const Icon = TYPE_ICONS[model.type] || BarChart3;

  return (
    <div className="visualization-renderer">
      <div className="visualization-renderer-heading"><Icon size={18} aria-hidden="true" /><strong>{model.title}</strong><span>Otomatis: {model.type}</span></div>
      {model.type === "bar" || model.type === "donut" ? <div ref={containerRef} className="visualization-canvas"></div> : null}
      {model.type === "line" ? <svg ref={trendRef} className="visualization-trend" width="100%" height="280"></svg> : null}
      {model.type === "kpi" ? <div className="visualization-kpi"><strong>{new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(model.value)}</strong><span>{model.valueColumn}</span></div> : null}
      {model.type === "histogram" ? <div className="visualization-histogram">{model.data.map(bin => <div key={bin.label}><span style={{ height: `${Math.max(bin.value * 28, 8)}px` }}></span><small>{bin.label}</small></div>)}</div> : null}
    </div>
  );
}
