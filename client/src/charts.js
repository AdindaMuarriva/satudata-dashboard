import * as d3 from "d3";
import * as topojson from "topojson-client";
import { CONFIG, stripAdminPrefix, loadAcehTopo } from "./api";

export function showTip(tooltipEl, html, evt) {
  d3.select(tooltipEl)
    .style("opacity", 1)
    .html(html)
    .style("left", evt.clientX + 14 + "px")
    .style("top", evt.clientY - 10 + "px");
}

export function hideTip(tooltipEl) {
  d3.select(tooltipEl).style("opacity", 0);
}

export function renderOrgChart(svgNode, rows, tooltipEl) {
  const svgEl = d3.select(svgNode);
  const width = svgNode.parentElement.clientWidth;
  const height = 500;
  const margin = { top: 8, right: 30, bottom: 20, left: 120 };
  svgEl.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();

  const counts = d3.rollup(rows, v => v.length, d => (d.organisasi ? d.organisasi.nama : "Tidak diketahui"));
  const parsed = Array.from(counts, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value).slice(0, 8);

  if (!parsed.length) {
    svgEl.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").text("Belum ada data.");
    return;
  }

  const x = d3.scaleLinear().domain([0, d3.max(parsed, d => d.value) * 1.15]).range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(parsed.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(0.25);

  const g = svgEl.append("g");
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(4));
  g.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  g.selectAll("rect.bar").data(parsed).join("rect")
    .attr("class", "bar").attr("x", margin.left).attr("y", d => y(d.label))
    .attr("height", y.bandwidth()).attr("width", 0)
    .on("mousemove", (evt, d) => showTip(tooltipEl, `<b>${d.label}</b><br>${d.value} dataset`, evt))
    .on("mouseleave", () => hideTip(tooltipEl))
    .transition().duration(500).attr("width", d => x(d.value) - margin.left);
}

export function renderColorLegend(svgNode, color, satuan) {
  const svgSel = d3.select(svgNode);
  svgSel.selectAll("*").remove();
  const width = svgNode.parentElement.clientWidth || 400;
  const legendW = Math.min(260, width - 20);
  svgSel.attr("viewBox", `0 0 ${width} 46`);

  const legend = svgSel.append("g").attr("transform", "translate(10, 8)");
  legend.append("text").attr("class", "legend-title").attr("y", -2)
    .text(satuan ? `Skala warna (${satuan})` : "Skala warna nilai");

  const gradId = "legend-gradient-" + Math.random().toString(36).slice(2, 8);
  const defs = svgSel.append("defs");
  const gradient = defs.append("linearGradient").attr("id", gradId);
  d3.range(0, 1.01, 0.1).forEach(t => {
    const [d0, d1] = color.domain();
    gradient.append("stop").attr("offset", `${t * 100}%`).attr("stop-color", color(d0 + t * (d1 - d0)));
  });

  legend.append("rect").attr("y", 6).attr("width", legendW).attr("height", 10).attr("fill", `url(#${gradId})`);
  const scale = d3.scaleLinear().domain(color.domain()).range([0, legendW]);
  legend.append("g").attr("class", "axis map-legend").attr("transform", "translate(0,16)")
    .call(d3.axisBottom(scale).ticks(4).tickFormat(d3.format(",.1f")));
}

export function renderRankingChart(svgNode, rows, satuan, color, tooltipEl, topN = 15) {
  const svgEl = d3.select(svgNode);
  svgEl.selectAll("*").remove();
  const sorted = [...rows].sort((a, b) => b.value - a.value).slice(0, topN);
  const height = Math.max(260, sorted.length * 22 + 40);
  svgEl.attr("height", height);
  const width = svgNode.parentElement.clientWidth || 600;
  const margin = { top: 10, right: 40, bottom: 20, left: 170 };
  svgEl.attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleLinear().domain([0, d3.max(sorted, d => d.value) * 1.1]).range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(sorted.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(0.25);

  const g = svgEl.append("g");
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(4));
  g.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  g.selectAll("rect.bar").data(sorted).join("rect")
    .attr("x", margin.left).attr("y", d => y(d.label))
    .attr("height", y.bandwidth()).attr("width", 0)
    .attr("fill", d => color(d.value))
    .on("mousemove", (evt, d) => showTip(tooltipEl, `<b>${d.label}</b><br>${d3.format(",.2f")(d.value)} ${satuan || ""}`, evt))
    .on("mouseleave", () => hideTip(tooltipEl))
    .transition().duration(500).attr("width", d => x(d.value) - margin.left);
}

export function renderBarChart(container, rows, satuan, tooltipEl) {
  d3.select(container).selectAll("*").remove();
  const height = Math.max(260, Math.min(rows.length, 50) * 22 + 40);
  const svg = d3.select(container).append("svg").attr("width", "100%").attr("height", height);
  const width = container.clientWidth;
  const margin = { top: 10, right: 40, bottom: 20, left: 220 };
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const parsed = rows.slice(0, 50);
  const x = d3.scaleLinear().domain([0, d3.max(parsed, d => d.value) * 1.1]).range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(parsed.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(0.25);

  const g = svg.append("g");
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5));
  g.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));

  g.selectAll("rect.bar").data(parsed).join("rect")
    .attr("class", "bar").attr("x", margin.left).attr("y", d => y(d.label))
    .attr("height", y.bandwidth()).attr("width", 0)
    .on("mousemove", (evt, d) => showTip(tooltipEl, `<b>${d.label}</b><br>${d3.format(",.2f")(d.value)} ${satuan || ""}`, evt))
    .on("mouseleave", () => hideTip(tooltipEl))
    .transition().duration(500).attr("width", d => x(d.value) - margin.left);
}

export function renderTrendChart(svgNode, data, satuan, tooltipEl) {
  const svgEl = d3.select(svgNode);
  svgEl.selectAll("*").remove();
  const width = svgNode.parentElement.clientWidth || 800;
  const height = 260;
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  svgEl.attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value) * 1.15]).range([height - margin.bottom, margin.top]);

  const g = svgEl.append("g");
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(Math.min(data.length, 10)).tickFormat(d3.format("d")));
  g.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));

  const line = d3.line().x(d => x(d.year)).y(d => y(d.value));
  g.append("path").datum(data).attr("class", "trend-line").attr("d", line);

  g.selectAll("circle").data(data).join("circle")
    .attr("class", "trend-dot").attr("cx", d => x(d.year)).attr("cy", d => y(d.value)).attr("r", 4)
    .on("mousemove", (evt, d) => showTip(tooltipEl, `<b>${d.year}</b><br>${d3.format(",.2f")(d.value)} ${satuan || ""}`, evt))
    .on("mouseleave", () => hideTip(tooltipEl));
}

export async function renderChoroplethMap(container, rows, satuan, color, tooltipEl) {
  const sel = d3.select(container);
  sel.html("").append("div").attr("class", "sub").text("Memuat peta Aceh...");

  const topo = await loadAcehTopo();
  const objectKey = Object.keys(topo.objects || {}).find(
    k => topo.objects[k] && Array.isArray(topo.objects[k].geometries) && topo.objects[k].geometries.length
  );
  if (!objectKey) throw new Error("Struktur topojson tidak dikenali (tidak ada objects.geometries)");

  const geomCollection = topo.objects[objectKey];
  const features = [];
  geomCollection.geometries.forEach(g => {
    try {
      const feat = topojson.feature(topo, g);
      const okGeometry = feat && feat.geometry && (
        Array.isArray(feat.geometry.coordinates) || Array.isArray(feat.geometry.geometries)
      );
      if (okGeometry) features.push(feat);
    } catch (e) {
      console.warn("Lewati satu wilayah karena gagal dikonversi:", g.properties, e.message);
    }
  });

  const valueByRegion = new Map();
  rows.forEach(r => {
    const key = stripAdminPrefix(r.geoLabel).toLowerCase();
    const existing = valueByRegion.get(key) || [];
    existing.push(r.value);
    valueByRegion.set(key, existing);
  });
  const avgByRegion = new Map();
  valueByRegion.forEach((vals, key) => avgByRegion.set(key, d3.mean(vals)));

  sel.html("");
  const width = container.clientWidth || 800;
  const height = 520;
  const svg = sel.append("svg").attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

  const featureCollection = { type: "FeatureCollection", features };
  const projection = d3.geoMercator();
  const path = d3.geoPath().projection(projection);
  projection.fitSize([width, height - 40], featureCollection);

  svg.selectAll("path").data(features).join("path")
    .attr("class", "map-region")
    .attr("d", f => { try { return path(f); } catch { return null; } })
    .attr("fill", f => {
      const key = stripAdminPrefix(f.properties.kabkot || f.properties.name || "").toLowerCase();
      const v = avgByRegion.get(key);
      return v === undefined ? "#e4e1d8" : color(v);
    })
    .on("mousemove", (evt, f) => {
      const key = stripAdminPrefix(f.properties.kabkot || f.properties.name || "").toLowerCase();
      const v = avgByRegion.get(key);
      showTip(tooltipEl, `<b>${f.properties.kabkot || f.properties.name}</b><br>${v !== undefined ? d3.format(",.2f")(v) + " " + (satuan || "") : "Tidak ada data"}`, evt);
    })
    .on("mouseleave", () => hideTip(tooltipEl));
}

export async function renderRegionalChoropleth(container, rows, satuan, tooltipEl) {
  const values = rows.map(row => Number(row.value)).filter(Number.isFinite);
  const [min, max] = d3.extent(values);
  const color = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain(min === max ? [0, max || 1] : [min, max]);
  return renderChoroplethMap(container, rows, satuan, color, tooltipEl);
}

export function renderUnitChart(svgNode, rows, tooltipEl) {
  const svg = d3.select(svgNode);
  const width = svgNode.parentElement.clientWidth || 420;
  const height = 280;
  const margin = { top: 10, right: 28, bottom: 24, left: 128 };
  svg.attr("viewBox", `0 0 ${width} ${height}`).selectAll("*").remove();
  const data = Array.from(d3.rollup(rows, values => values.length, row => row.satuan || "Tidak disebutkan"), ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value).slice(0, 8);
  if (!data.length) {
    svg.append("text").attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle").text("Belum ada data.");
    return;
  }
  const x = d3.scaleLinear().domain([0, (d3.max(data, d => d.value) || 1) * 1.15]).range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(data.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(.3);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(4));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
  svg.append("g").selectAll("rect").data(data).join("rect").attr("x", margin.left).attr("y", d => y(d.label)).attr("height", y.bandwidth()).attr("rx", 6).attr("fill", "#d92419").attr("width", 0)
    .on("mousemove", (event, d) => showTip(tooltipEl, `<b>${d.label}</b><br>${d.value} dataset`, event)).on("mouseleave", () => hideTip(tooltipEl))
    .transition().duration(550).attr("width", d => x(d.value) - margin.left);
}

export function renderMultiTrendChart(container, series, tooltipEl, options = {}) {
  const { indexed = false, maxSeries = Infinity } = options;
  d3.select(container).selectAll("*").remove();
  let visibleSeries = series.filter(item => item.data?.length);
  if (indexed) {
    visibleSeries = visibleSeries
      .filter(item => item.data.length >= 2 && Number(item.data[0].value) !== 0)
      .sort((a, b) => b.data.length - a.data.length)
      .slice(0, maxSeries)
      .map(item => {
        const baseline = Number(item.data[0].value);
        return {
          ...item,
          data: item.data.map(point => ({
            ...point,
            rawValue: point.value,
            value: (Number(point.value) / baseline) * 100
          }))
        };
      });
  } else {
    visibleSeries = visibleSeries.slice(0, maxSeries);
  }
  if (!visibleSeries.length) return;
  const width = container.clientWidth || 800;
  const height = 450;
  const margin = { top: 28, right: 30, bottom: 118, left: 76 };
  const points = visibleSeries.flatMap(item => item.data.map(point => ({ ...point, series: item })));
  const svg = d3.select(container).append("svg").attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
  const x = d3.scaleLinear().domain(d3.extent(points, d => d.year)).range([margin.left, width - margin.right]);
  const yExtent = d3.extent(points, d => d.value);
  const yDomain = indexed
    ? [Math.max(0, (yExtent[0] || 0) - Math.max(5, ((yExtent[1] || 100) - (yExtent[0] || 100)) * .15)), (yExtent[1] || 100) + Math.max(5, ((yExtent[1] || 100) - (yExtent[0] || 100)) * .15)]
    : [0, (yExtent[1] || 1) * 1.12];
  const y = d3.scaleLinear().domain(yDomain).nice().range([height - margin.bottom, margin.top]);
  const color = d3.scaleSequential(d3.interpolateTurbo).domain([0, Math.max(visibleSeries.length - 1, 1)]);
  const chart = svg.append("g");
  chart.append("g").attr("class", "comparison-grid").attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(width - margin.left - margin.right)).tickFormat(""));
  chart.append("g").attr("class", "axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("d")));
  chart.append("g").attr("class", "axis comparison-y-axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5));
  const line = d3.line().curve(d3.curveMonotoneX).x(d => x(d.year)).y(d => y(d.value));
  visibleSeries.forEach((item, index) => {
    const stroke = color(index);
    chart.append("path").datum(item.data).attr("fill", "none").attr("stroke", "#fff").attr("stroke-width", 6).attr("stroke-linecap", "round").attr("d", line);
    chart.append("path").datum(item.data).attr("fill", "none").attr("stroke", stroke).attr("stroke-width", 3).attr("stroke-linecap", "round").attr("d", line);
    chart.selectAll(`.point-${item.uuid}`).data(item.data).join("circle").attr("cx", d => x(d.year)).attr("cy", d => y(d.value)).attr("r", 4).attr("fill", stroke)
      .attr("stroke", "#fff").attr("stroke-width", 2)
      .on("mousemove", (event, d) => showTip(tooltipEl, indexed
        ? `<b>${item.title}</b><br>${d.year}: indeks ${d3.format(",.1f")(d.value)}<br>Nilai asli: ${d3.format(",.2f")(d.rawValue)} ${item.satuan}`
        : `<b>${item.title}</b><br>${d.year}: ${d3.format(",.2f")(d.value)} ${item.satuan}`, event))
      .on("mouseleave", () => hideTip(tooltipEl));
    const last = item.data[item.data.length - 1];
    chart.append("text").attr("x", x(last.year) + 10).attr("y", y(last.value) + 4).attr("fill", stroke).attr("font-size", 11).attr("font-weight", 700).attr("opacity", 0)
      .text(`${item.title.slice(0, 18)}${item.title.length > 18 ? "…" : ""}`);
  });
  const legend = svg.append("g").attr("transform", `translate(${margin.left},${height - 74})`);
  if (visibleSeries.length <= 10) visibleSeries.forEach((item, index) => {
    const columnWidth = Math.max(160, (width - margin.left - margin.right) / 2);
    const entry = legend.append("g").attr("transform", `translate(${(index % 2) * columnWidth},${Math.floor(index / 2) * 24})`);
    entry.append("circle").attr("r", 5).attr("fill", color(index));
    entry.append("text").attr("x", 10).attr("y", 4).attr("fill", "#4f4544").attr("font-size", 11).text(`${item.title.slice(0, 22)}${item.title.length > 22 ? "…" : ""} (${item.satuan})`);
  });
  if (visibleSeries.length > 10) legend.append("text").attr("fill", "#4f4544").attr("font-size", 11)
    .text(`${series.length} dataset dicakup; ${visibleSeries.length} memiliki data tren. Arahkan kursor ke titik untuk detailnya.`);
}

export function renderDonutChart(container, data, tooltipEl) {
  d3.select(container).selectAll("*").remove();
  const width = container.clientWidth || 420;
  const height = 370;
  const radius = Math.min(width * 0.28, 118);
  const colors = ["#d92419", "#1f6feb", "#0f8a63", "#9a5bd1", "#d97706", "#de5e40"];
  const svg = d3.select(container).append("svg").attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
  const pie = d3.pie().sort(null).value(d => d.value)(data);
  const arc = d3.arc().innerRadius(radius * .58).outerRadius(radius);
  const color = d3.scaleOrdinal(colors).domain(data.map(d => d.label));
  const center = svg.append("g").attr("transform", `translate(${width * .31},${height / 2})`);
  center.selectAll("path").data(pie).join("path").attr("d", arc).attr("fill", d => color(d.data.label)).attr("stroke", "#fff").attr("stroke-width", 3)
    .on("mousemove", (event, d) => showTip(tooltipEl, `<b>${d.data.label}</b><br>${d.data.value} dataset`, event)).on("mouseleave", () => hideTip(tooltipEl));
  center.append("text").attr("text-anchor", "middle").attr("y", -6).attr("fill", "#4f4544").attr("font-size", 14).attr("font-weight", 700).text("Total dataset");
  center.append("text").attr("text-anchor", "middle").attr("y", 22).attr("fill", "#8b1e21").attr("font-size", 30).attr("font-weight", 800).text(d3.sum(data, d => d.value));
  const legend = svg.append("g").attr("transform", `translate(${width * .62},42)`);
  data.forEach((item, index) => {
    const row = legend.append("g").attr("transform", `translate(0,${index * 48})`);
    row.append("rect").attr("width", 14).attr("height", 14).attr("rx", 4).attr("fill", color(item.label));
    row.append("text").attr("x", 22).attr("y", 12).attr("fill", "#4f4544").attr("font-size", 13).attr("font-weight", 600).text(`${item.label} (${item.value})`);
  });
}

export function renderHorizontalBarChart(container, data, tooltipEl) {
  d3.select(container).selectAll("*").remove();
  const width = container.clientWidth || 420;
  const height = Math.max(330, data.length * 52 + 52);
  const margin = { top: 12, right: 34, bottom: 34, left: 175 };
  const svg = d3.select(container).append("svg").attr("width", "100%").attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
  const x = d3.scaleLinear().domain([0, (d3.max(data, d => d.value) || 1) * 1.15]).nice().range([margin.left, width - margin.right]);
  const y = d3.scaleBand().domain(data.map(d => d.label)).range([margin.top, height - margin.bottom]).padding(.28);
  svg.append("g").attr("class", "axis chart-axis-large").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(4));
  svg.append("g").attr("class", "axis chart-axis-large").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y));
  svg.selectAll("rect").data(data).join("rect").attr("x", margin.left).attr("y", d => y(d.label)).attr("height", y.bandwidth()).attr("rx", 6).attr("fill", "#9a5bd1")
    .on("mousemove", (event, d) => showTip(tooltipEl, `<b>${d.label}</b><br>${d.value} dataset`, event)).on("mouseleave", () => hideTip(tooltipEl))
    .transition().duration(500).attr("width", d => x(d.value) - margin.left);
}
