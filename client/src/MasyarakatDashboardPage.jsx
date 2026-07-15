import { useEffect, useRef, useState } from "react";
import {
  fetchDatasetValues,
  fetchDatasetsMultiPage,
  fetchYearlyTrend,
  isAgricultureRelevant,
  isEducationRelevant,
  isEnvironmentRelevant,
  isHealthRelevant,
  isInfrastructureRelevant,
  isSocialRelevant,
  isStatisticsRelevant,
  isThemeRelevant,
  pickAggregator
} from "./api";
import { renderDonutChart, renderHorizontalBarChart, renderMultiTrendChart, renderOrgChart } from "./charts";

const TREND_BATCH_SIZE = 4;

function dashboardTitle(datasets, theme) {
  if (theme === "kesehatan") return "Analisis Komparatif Indikator Kesehatan Masyarakat Aceh";
  if (theme === "pendidikan") return "Analisis Komparatif Indikator Pendidikan Aceh";
  if (theme === "infrastruktur") return "Analisis Komparatif Indikator Infrastruktur Aceh";
  if (theme === "pertanian") return "Analisis Komparatif Indikator Pertanian Aceh";
  if (theme === "sosial") return "Analisis Komparatif Indikator Sosial Aceh";
  if (theme === "statistik") return "Analisis Komparatif Data Statistik Aceh";
  if (theme === "lingkungan") return "Analisis Komparatif Indikator Lingkungan Hidup Aceh";
  const text = datasets.map(item => item.judul || "").join(" ").toLowerCase();
  if (text.includes("kemiskinan") || text.includes("bansos") || text.includes("sosial")) {
    return "Analisis Komparatif Indikator Kesejahteraan dan Ketahanan Sosial Masyarakat Aceh";
  }
  return "Analisis Komparatif Indikator Masyarakat Aceh";
}

function getHealthGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("ibu") || text.includes("anak") || text.includes("stunting") || text.includes("posyandu")) return "Ibu, Anak & Gizi";
  if (text.includes("rumah sakit") || text.includes("puskesmas") || text.includes("dokter") || text.includes("perawat")) return "Fasilitas & Tenaga";
  if (text.includes("penyakit") || text.includes("imunisasi") || text.includes("vaksin")) return "Pencegahan Penyakit";
  if (text.includes("sanitasi") || text.includes("air minum")) return "Kesehatan Lingkungan";
  if (text.includes("bpjs") || text.includes("jkn") || text.includes("jaminan")) return "Jaminan Kesehatan";
  return "Kesehatan lainnya";
}

function getCommunityGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("perempuan") || text.includes("anak") || text.includes("gender")) return "Perempuan & Anak";
  if (text.includes("disabilitas") || text.includes("penyandang")) return "Disabilitas";
  if (text.includes("lansia")) return "Lansia";
  if (text.includes("miskin") || text.includes("kemiskinan") || text.includes("bansos")) return "Kemiskinan";
  if (text.includes("penduduk") || text.includes("kependudukan") || text.includes("keluarga")) return "Kependudukan";
  return "Sosial lainnya";
}

function getEducationGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("paud") || text.includes("taman kanak") || text.includes("usia dini")) return "Pendidikan Anak Usia Dini";
  if (text.includes("guru") || text.includes("pendidik") || text.includes("tenaga kependidikan")) return "Guru & Tenaga Kependidikan";
  if (text.includes("siswa") || text.includes("murid") || text.includes("peserta didik") || text.includes("mahasiswa")) return "Peserta Didik";
  if (text.includes("sekolah") || text.includes("kelas") || text.includes("ruang") || text.includes("fasilitas")) return "Satuan & Sarana Pendidikan";
  if (text.includes("universitas") || text.includes("perguruan tinggi") || text.includes("kuliah")) return "Pendidikan Tinggi";
  if (text.includes("literasi") || text.includes("melek huruf") || text.includes("partisipasi") || text.includes("putus sekolah")) return "Akses & Capaian Pendidikan";
  return "Pendidikan lainnya";
}

function getInfrastructureGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("jalan") || text.includes("jembatan") || text.includes("penerangan jalan")) return "Jalan & Jembatan";
  if (text.includes("transportasi") || text.includes("angkutan") || text.includes("pelabuhan") || text.includes("bandara") || text.includes("terminal")) return "Transportasi";
  if (text.includes("air minum") || text.includes("air bersih") || text.includes("sanitasi") || text.includes("drainase")) return "Air Bersih & Sanitasi";
  if (text.includes("irigasi") || text.includes("bendungan") || text.includes("sungai")) return "Sumber Daya Air";
  if (text.includes("perumahan") || text.includes("permukiman") || text.includes("bangunan")) return "Perumahan & Permukiman";
  if (text.includes("listrik") || text.includes("telekomunikasi") || text.includes("internet") || text.includes("menara")) return "Utilitas & Konektivitas";
  return "Infrastruktur lainnya";
}

function getAgricultureGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("tanaman") || text.includes("padi") || text.includes("jagung") || text.includes("sawah")) return "Tanaman Pangan";
  if (text.includes("hortikultura") || text.includes("sayur") || text.includes("buah")) return "Hortikultura";
  if (text.includes("perkebunan")) return "Perkebunan";
  if (text.includes("ternak") || text.includes("peternakan")) return "Peternakan";
  if (text.includes("ikan") || text.includes("perikanan") || text.includes("nelayan")) return "Perikanan";
  return "Pertanian lainnya";
}

function getSocialGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("miskin") || text.includes("kemiskinan") || text.includes("bansos") || text.includes("pkh")) return "Kemiskinan & Bantuan Sosial";
  if (text.includes("perempuan") || text.includes("anak") || text.includes("gender")) return "Perempuan & Anak";
  if (text.includes("disabilitas") || text.includes("penyandang")) return "Disabilitas";
  if (text.includes("lansia")) return "Lansia";
  if (text.includes("penduduk") || text.includes("keluarga") || text.includes("kependudukan")) return "Kependudukan & Keluarga";
  return "Sosial lainnya";
}

function getStatisticsGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("sensus")) return "Sensus";
  if (text.includes("survei")) return "Survei";
  if (text.includes("kependudukan") || text.includes("penduduk")) return "Statistik Kependudukan";
  if (text.includes("ekonomi") || text.includes("harga") || text.includes("inflasi")) return "Statistik Ekonomi";
  if (text.includes("publikasi")) return "Publikasi Statistik";
  return "Statistik lainnya";
}

function getEnvironmentGroup(dataset) {
  const text = `${dataset.judul || ""} ${dataset.topik?.nama || ""}`.toLowerCase();
  if (text.includes("sampah") || text.includes("limbah")) return "Sampah & Limbah";
  if (text.includes("air") || text.includes("sungai")) return "Kualitas Air";
  if (text.includes("udara") || text.includes("emisi") || text.includes("pencemaran")) return "Kualitas Udara & Emisi";
  if (text.includes("hutan") || text.includes("konservasi") || text.includes("hayati")) return "Hutan & Keanekaragaman Hayati";
  if (text.includes("iklim") || text.includes("cuaca")) return "Iklim";
  return "Lingkungan lainnya";
}

function getThemeFilter(theme) {
  if (theme === "kesehatan") return isHealthRelevant;
  if (theme === "pendidikan") return isEducationRelevant;
  if (theme === "infrastruktur") return isInfrastructureRelevant;
  if (theme === "pertanian") return isAgricultureRelevant;
  if (theme === "sosial") return isSocialRelevant;
  if (theme === "statistik") return isStatisticsRelevant;
  if (theme === "lingkungan") return isEnvironmentRelevant;
  return isThemeRelevant;
}

function getThemeGroup(theme) {
  if (theme === "kesehatan") return getHealthGroup;
  if (theme === "pendidikan") return getEducationGroup;
  if (theme === "infrastruktur") return getInfrastructureGroup;
  if (theme === "pertanian") return getAgricultureGroup;
  if (theme === "sosial") return getSocialGroup;
  if (theme === "statistik") return getStatisticsGroup;
  if (theme === "lingkungan") return getEnvironmentGroup;
  return getCommunityGroup;
}

function countBy(datasets, getLabel, limit = 6) {
  return Object.entries(datasets.reduce((counts, dataset) => {
    const label = getLabel(dataset);
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, limit);
}

async function loadInBatches(items, task, onBatchLoaded) {
  const results = [];
  for (let start = 0; start < items.length; start += TREND_BATCH_SIZE) {
    const batch = items.slice(start, start + TREND_BATCH_SIZE);
    results.push(...await Promise.all(batch.map(item => task(item).catch(error => {
      console.warn("Dataset tren dilewati:", error.message);
      return null;
    }))));
    onBatchLoaded?.(results.filter(Boolean));
  }
  return results;
}

export default function MasyarakatDashboardPage({ tooltipRef, theme = "masyarakat" }) {
  const [datasets, setDatasets] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError] = useState("");
  const trendRef = useRef(null);
  const orgChartRef = useRef(null);
  const groupChartRef = useRef(null);
  const unitChartRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setTrendLoading(true);
      setSeries([]);
      setError("");
      try {
        const { rows } = await fetchDatasetsMultiPage();
        const themedDatasets = rows.filter(getThemeFilter(theme));
        if (!mounted) return;

        // Tampilkan seluruh ringkasan dan chart kategori lebih dulu. Grafik tren
        // dimuat per batch agar halaman tidak menunggu semua nilai dataset selesai.
        setDatasets(themedDatasets);
        setLoading(false);

        await loadInBatches(themedDatasets, async dataset => {
          const initialYear = /^\d{4}$/.test(String(dataset.dimensi))
            ? dataset.dimensi
            : new Date().getFullYear();
          const initial = await fetchDatasetValues(dataset.uuid, initialYear);
          const years = initial.years.length ? initial.years : [initialYear];
          const data = await fetchYearlyTrend(dataset.uuid, years, pickAggregator(dataset));
          return {
            uuid: dataset.uuid,
            title: dataset.judul || "Tanpa judul",
            satuan: dataset.satuan || "nilai",
            data
          };
        }, loadedSeries => {
          if (mounted) setSeries(loadedSeries);
        });
      } catch (err) {
        console.error(`Gagal memuat dashboard ${theme}:`, err);
        if (mounted) setError(`Dashboard ${theme} gagal dimuat. Silakan coba lagi.`);
      } finally {
        if (mounted) {
          setLoading(false);
          setTrendLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [theme]);

  useEffect(() => {
    if (series.length && trendRef.current) renderMultiTrendChart(trendRef.current, series, tooltipRef.current, { indexed: true, maxSeries: 6 });
  }, [series, tooltipRef]);

  useEffect(() => {
    if (datasets.length && orgChartRef.current) renderOrgChart(orgChartRef.current, datasets, tooltipRef.current);
  }, [datasets, tooltipRef]);

  const groupCounts = countBy(datasets, getThemeGroup(theme));
  const unitCounts = countBy(datasets, item => item.satuan || "Belum dicantumkan", 5);
  const comparableTrends = series.map(item => {
    const first = item.data?.[0];
    const last = item.data?.[item.data.length - 1];
    if (!first || !last || !Number(first.value)) return null;
    return { ...item, change: ((Number(last.value) - Number(first.value)) / Math.abs(Number(first.value))) * 100 };
  }).filter(Boolean);
  const risingTrends = comparableTrends.filter(item => item.change > 1).length;
  const fallingTrends = comparableTrends.filter(item => item.change < -1).length;
  const largestChange = [...comparableTrends].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
  const dominantGroup = groupCounts[0];
  const dominantUnit = unitCounts[0];

  useEffect(() => {
    if (groupCounts.length && groupChartRef.current) renderDonutChart(groupChartRef.current, groupCounts, tooltipRef.current);
  }, [datasets, tooltipRef]);

  useEffect(() => {
    if (unitCounts.length && unitChartRef.current) renderHorizontalBarChart(unitChartRef.current, unitCounts, tooltipRef.current);
  }, [datasets, tooltipRef]);

  const organizations = new Set(datasets.map(item => item.organisasi?.nama).filter(Boolean)).size;
  const themeLabel = {
    kesehatan: "kesehatan", pendidikan: "pendidikan", infrastruktur: "infrastruktur",
    pertanian: "pertanian", sosial: "sosial", statistik: "statistik", lingkungan: "lingkungan hidup"
  }[theme] || "masyarakat";
  const themeDescription = {
    kesehatan: "Visualisasi ini menggabungkan dataset kesehatan, fasilitas layanan, tenaga kesehatan, gizi, pencegahan penyakit, dan kesehatan lingkungan dari portal Satu Data Aceh.",
    pendidikan: "Visualisasi ini menggabungkan dataset pendidikan, peserta didik, guru, satuan pendidikan, sarana belajar, pendidikan anak usia dini, dan akses pendidikan dari portal Satu Data Aceh.",
    infrastruktur: "Visualisasi ini menggabungkan dataset jalan, jembatan, transportasi, air bersih, sanitasi, irigasi, perumahan, dan konektivitas dari portal Satu Data Aceh.",
    pertanian: "Visualisasi ini menggabungkan dataset tanaman pangan, hortikultura, perkebunan, peternakan, perikanan, dan produksi pangan dari portal Satu Data Aceh.",
    sosial: "Visualisasi ini menggabungkan dataset kesejahteraan sosial, kemiskinan, bantuan sosial, kelompok rentan, perempuan, anak, dan kependudukan dari portal Satu Data Aceh.",
    statistik: "Visualisasi ini menggabungkan dataset statistik sektoral, sensus, survei, publikasi, kependudukan, dan ekonomi dari portal Satu Data Aceh.",
    lingkungan: "Visualisasi ini menggabungkan dataset sampah, limbah, kualitas air dan udara, hutan, iklim, serta keanekaragaman hayati dari portal Satu Data Aceh."
  }[theme] || "Visualisasi ini menggabungkan dataset bertema sosial, kependudukan, perempuan dan anak, disabilitas, lansia, serta kemiskinan dari portal Satu Data Aceh.";
  const compositionTitle = {
    kesehatan: "Komposisi Fokus Kesehatan", pendidikan: "Komposisi Fokus Pendidikan", infrastruktur: "Komposisi Fokus Infrastruktur",
    pertanian: "Komposisi Fokus Pertanian", sosial: "Komposisi Fokus Sosial", statistik: "Komposisi Data Statistik", lingkungan: "Komposisi Fokus Lingkungan"
  }[theme] || "Komposisi Kelompok Masyarakat";
  const coverageTitle = {
    kesehatan: "Kesehatan", pendidikan: "Pendidikan", infrastruktur: "Infrastruktur", pertanian: "Pertanian", sosial: "Sosial", statistik: "Statistik", lingkungan: "Lingkungan Hidup"
  }[theme] || "Masyarakat";
  const title = dashboardTitle(datasets, theme);

  return (
    <main className="community-dashboard-page">
      <a className="back-link" href="?">← Kembali ke beranda</a>
      <section className="community-dashboard-hero">
        <span>DASHBOARD {themeLabel.toUpperCase()}</span>
        <h1>{title}</h1>
        <p>{themeDescription} Dashboard memuat data terbaru saat halaman dibuka.</p>
      </section>

      {loading ? <div className="search-result-message"><p>Menyiapkan perbandingan dataset {themeLabel}...</p></div> : error ? <div className="search-result-message"><p>{error}</p></div> : (
        <>
          <section className="community-stat-grid" aria-label={`Ringkasan dashboard ${themeLabel}`}>
            <article><strong>{datasets.length}</strong><span>Dataset {themeLabel}</span></article>
            <article><strong>{organizations}</strong><span>OPD penyedia data</span></article>
            <article><strong>{datasets.length}</strong><span>Dataset pada grafik tren</span></article>
          </section>

          <section className="panel community-insight-panel" aria-label="Kesimpulan dashboard">
            <div className="comparison-chart-heading">
              <div>
                <h2>Kesimpulan Dashboard</h2>
                <div className="sub">Ringkasan otomatis berdasarkan cakupan dataset dan tren yang sudah berhasil dimuat.</div>
              </div>
              {trendLoading && <span className="comparison-tip">Tren masih dilengkapi</span>}
            </div>
            <div className="community-insight-grid">
              <article><strong>{dominantGroup?.label || "—"}</strong><span>Kelompok terbanyak: {dominantGroup?.value || 0} dataset</span></article>
              <article><strong>{dominantUnit?.label || "—"}</strong><span>Satuan yang paling sering digunakan: {dominantUnit?.value || 0} dataset</span></article>
              <article><strong>{risingTrends} naik · {fallingTrends} turun</strong><span>Dari {comparableTrends.length} indikator yang dapat dibandingkan antarwaktu</span></article>
            </div>
            <p className="community-insight-note">
              {largestChange
                ? <>Perubahan relatif paling besar sementara terlihat pada <b>{largestChange.title}</b> ({largestChange.change > 0 ? "+" : ""}{largestChange.change.toFixed(1)}%).</>
                : "Kesimpulan perubahan tren akan muncul setelah minimal dua periode data tersedia."}
            </p>
          </section>

          <section className="community-dashboard-grid">
            <section className="panel community-trend-panel">
              <div className="comparison-chart-heading">
                <div>
                  <h2>Perbandingan Tren Indikator</h2>
                  <div className="sub">Membandingkan hingga 6 indikator dengan riwayat terpanjang. Semua garis dimulai dari indeks 100 agar perubahan antar satuan mudah dibandingkan.</div>
                </div>
                <span className="comparison-tip">Arahkan kursor ke titik grafik</span>
              </div>
              {series.length ? <div ref={trendRef}></div> : trendLoading ? <p className="community-empty">Menyiapkan grafik tren...</p> : <p className="community-empty">Data tren belum tersedia untuk dataset {themeLabel} yang ditemukan.</p>}
            </section>

            <section className="panel community-org-panel">
              <h2>Dataset per OPD</h2>
              <div className="sub">Perbandingan jumlah seluruh dataset {themeLabel} dari setiap instansi.</div>
              <svg ref={orgChartRef} width="100%" height="500"></svg>
            </section>
          </section>

          <section className="community-extra-chart-grid">
            <section className="panel">
                <h2>{compositionTitle}</h2>
              <div className="sub">Perbandingan cakupan dataset berdasarkan kelompok sasaran dan isu {themeLabel}.</div>
              <div ref={groupChartRef}></div>
            </section>
            <section className="panel">
              <h2>Jenis Satuan Indikator</h2>
              <div className="sub">Perbandingan bentuk pengukuran pada dataset {themeLabel}.</div>
              <div ref={unitChartRef}></div>
            </section>
          </section>

          <section className="panel community-dataset-panel">
            <div className="comparison-chart-heading">
              <div>
                <h2>Cakupan Dataset {coverageTitle}</h2>
                <div className="sub">Seluruh dataset yang digunakan sebagai cakupan dashboard ini.</div>
              </div>
              <span className="community-dataset-count">{datasets.length} dataset</span>
            </div>
            <ul className="community-dataset-list">
              {datasets.map(dataset => (
                <li key={dataset.uuid}>
                  <a href={`?dataset=${dataset.uuid}`}>{dataset.judul || "Tanpa judul"}</a>
                  <span>{dataset.organisasi?.nama || "Instansi belum tercantum"}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
