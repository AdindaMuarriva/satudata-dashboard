import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  CONFIG, fetchDatasetMeta, fetchDatasetValues, fetchYearlyTrend,
  extractLabelValue, rowsHaveKabupaten, buildColorScale, pickAggregator
} from "./api";
import {
  renderBarChart, renderRankingChart, renderColorLegend,
  renderChoroplethMap, renderTrendChart
} from "./charts";

export default function DetailPage({ uuid, tooltipRef }) {
  const [meta, setMeta] = useState(null);
  const [years, setYears] = useState([]);
  const [activeTahun, setActiveTahun] = useState(null);
  const [selectedTahun, setSelectedTahun] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [status, setStatus] = useState({ ok: true, text: "Memuat data..." });
  const [trendData, setTrendData] = useState(null);
  const [viewMode, setViewMode] = useState(null); // "big" | "geo" | "bar" | "empty"
  const [mapFailed, setMapFailed] = useState(false);

  const trendSvgRef = useRef(null);
  const mapContainerRef = useRef(null);
  const rankingSvgRef = useRef(null);
  const rankingLegendRef = useRef(null);
  const barContainerRef = useRef(null);

  async function load(tahunOverride) {
    try {
      const metaJson = (await fetchDatasetMeta(uuid)).data;
      setMeta(metaJson);

      const guessTahun = tahunOverride || ((metaJson.dimensi && /^\d{4}$/.test(metaJson.dimensi)) ? metaJson.dimensi : new Date().getFullYear());
      let { rows: rows1, years: years1 } = await fetchDatasetValues(uuid, guessTahun);

      if (!rows1.length && years1.length && !tahunOverride && !years1.includes(String(guessTahun))) {
        const retry = await fetchDatasetValues(uuid, years1[0]);
        rows1 = retry.rows;
        years1 = retry.years.length ? retry.years : years1;
      }

      const activeYear = rows1.length && rows1[0].tahun ? rows1[0].tahun : guessTahun;
      setYears(years1);
      setActiveTahun(activeYear);
      setSelectedTahun(String(activeYear));
      setRawRows(rows1);

      if (!rows1.length) {
        setViewMode("empty");
        setStatus({ ok: false, text: "Tidak ada data untuk tahun ini — " + new Date().toLocaleTimeString("id-ID") });
        return;
      }

      const parsedRows = rows1.map(extractLabelValue).filter(r => !isNaN(r.value));
      setParsed(parsedRows);

      if (!parsedRows.length) {
        setViewMode("empty");
      } else if (parsedRows.length === 1) {
        setViewMode("big");
      } else if (rowsHaveKabupaten(rows1)) {
        setViewMode("geo");
        setMapFailed(false);
      } else {
        setViewMode("bar");
      }

      // Tren antar tahun (kalau datasetnya punya lebih dari 1 tahun)
      setTrendData(null);
      if (years1.length > 1) {
        const aggregator = pickAggregator(metaJson);
        fetchYearlyTrend(uuid, years1, aggregator)
          .then(td => setTrendData(td.length > 1 ? td : null))
          .catch(err => { console.warn("Gagal memuat tren tahunan:", err.message); setTrendData(null); });
      }

      setStatus({ ok: true, text: "Live · " + new Date().toLocaleTimeString("id-ID") });
    } catch (err) {
      console.error("Gagal memuat detail dataset:", err);
      setStatus({ ok: false, text: "Gagal memuat — cek console (F12)" });
      setViewMode("error");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(() => load(selectedTahun || undefined), CONFIG.pollingIntervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid]);

  function handleYearChange(e) {
    const y = e.target.value;
    setSelectedTahun(y);
    load(y);
  }

  const aggregator = meta ? pickAggregator(meta) : "sum";

  useEffect(() => {
    if (viewMode === "bar" && barContainerRef.current) {
      renderBarChart(barContainerRef.current, parsed, meta?.satuan, tooltipRef.current);
    }
  }, [viewMode, parsed, meta]);

  useEffect(() => {
    if (trendData && trendSvgRef.current) {
      renderTrendChart(trendSvgRef.current, trendData, meta?.satuan, tooltipRef.current);
    }
  }, [trendData, meta]);

  useEffect(() => {
    if (viewMode !== "geo" || !parsed.length) return;
    const color = buildColorScale(parsed);
    if (rankingSvgRef.current) renderRankingChart(rankingSvgRef.current, parsed, meta?.satuan, color, tooltipRef.current);
    if (rankingLegendRef.current) renderColorLegend(rankingLegendRef.current, color, meta?.satuan);
    if (mapContainerRef.current) {
      renderChoroplethMap(mapContainerRef.current, parsed, meta?.satuan, color, tooltipRef.current)
        .catch(err => {
          console.error("Render peta gagal, fallback ke bar chart:", err);
          setMapFailed(true);
        });
    }
  }, [viewMode, parsed, meta]);

  useEffect(() => {
    if (mapFailed && barContainerRef.current) {
      renderBarChart(barContainerRef.current, parsed, meta?.satuan, tooltipRef.current);
    }
  }, [mapFailed, parsed, meta]);

  const statCards = (() => {
    if (!parsed.length) return null;
    const vals = parsed.map(p => p.value).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const agg = aggregator === "avg" ? d3.mean(vals) : d3.sum(vals);
    const aggLabel = aggregator === "avg" ? "Rata-rata" : "Total";
    const top = [...parsed].sort((a, b) => b.value - a.value)[0];
    return [
      { label: `${aggLabel} (${meta?.satuan || "nilai"})`, value: d3.format(",.2f")(agg) },
      { label: "Jumlah Baris Data", value: parsed.length },
      { label: "Nilai Tertinggi", value: top ? top.geoLabel : "—", sub: top ? `${d3.format(",.2f")(top.value)} ${meta?.satuan || ""}` : "" },
      { label: "Tahun Data", value: activeTahun || "—" }
    ];
  })();

  if (!meta) {
    return (
      <div id="detailView" className="detail-page">
        <a className="back-link" href="?">← Kembali ke daftar dataset</a>
        <div className="detail-header"><h1>Memuat...</h1></div>
      </div>
    );
  }

  return (
    <div id="detailView" className="detail-page">
      <a className="back-link" href="?">← Kembali ke daftar dataset</a>

      <div className="detail-header detail-hero">
        <h1>{meta.judul || "Tanpa judul"}</h1>
        <p>{meta.deskripsi || ""}</p>
        <div className="meta-pills">
          {[meta.organisasi && meta.organisasi.nama, meta.tingkat_penyajian, meta.satuan].filter(Boolean).map((p, i) => (
            <span key={i} className="meta-pill"><b>{p}</b></span>
          ))}
        </div>
        {years.length > 0 && (
          <div className="filters detail-year-filter" style={{ marginBottom: 16 }}>
            <label>Tahun
              <select value={selectedTahun || ""} onChange={handleYearChange}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="status detail-status" style={{ marginBottom: 16 }}>
        <span className={"dot" + (status.ok ? "" : " err")}></span>
        <span>{status.text}</span>
      </div>

      {statCards && (
        <div className="stat-row">
          {statCards.map((c, i) => (
            <div className="stat-card" key={i}>
              <div className="label">{c.label}</div>
              <div className="value">{c.value}</div>
              {c.sub && <div className="sub-value">{c.sub}</div>}
            </div>
          ))}
        </div>
      )}

      {trendData && (
        <div className="panel wide" style={{ marginBottom: 18 }}>
          <h2>Tren Antar Tahun</h2>
          <div className="sub">{aggregator === "avg" ? "Rata-rata lintas wilayah per tahun" : "Total lintas wilayah per tahun"}</div>
          <svg ref={trendSvgRef} width="100%" height="260"></svg>
        </div>
      )}

      {viewMode === "geo" && !mapFailed && (
        <div className="grid" style={{ marginBottom: 18 }}>
          <div className="panel">
            <h2>Peta Sebaran Wilayah</h2>
            <div className="sub">Berdasarkan kab/kota, tahun {activeTahun}</div>
            <div ref={mapContainerRef}></div>
          </div>
          <div className="panel">
            <h2>Peringkat Kab/Kota</h2>
            <div className="sub">Top {Math.min(15, parsed.length)} wilayah, tahun {activeTahun}</div>
            <svg ref={rankingSvgRef} width="100%" height="320"></svg>
            <svg ref={rankingLegendRef} width="100%" height="46"></svg>
          </div>
        </div>
      )}

      {viewMode === "big" && parsed[0] && (
        <div className="panel wide">
          <div className="big-number">
            <span className="value">{d3.format(",")(parsed[0].value)}</span>
            <span className="unit">{parsed[0].satuan || ""}</span>
            <div className="caption">{parsed[0].tahun ? "Tahun " + parsed[0].tahun : ""} · {parsed[0].geoLabel}</div>
          </div>
        </div>
      )}

      {(viewMode === "bar" || mapFailed) && (
        <div className="panel wide">
          <div ref={barContainerRef}></div>
        </div>
      )}

      {viewMode === "empty" && (
        <div className="panel wide empty-dataset-state">
          <div className="sub">
            Dataset ini belum punya data terisi (total data: {(meta.totalData ?? meta.total_data) || 0}).
            Kemungkinan OPD terkait belum menginput data untuk tahun ini.
          </div>
        </div>
      )}

      {viewMode === "error" && (
        <div className="panel wide">
          <div className="sub">Terjadi error saat memuat dataset ini. Cek console (F12) untuk detail.</div>
        </div>
      )}
    </div>
  );
}
