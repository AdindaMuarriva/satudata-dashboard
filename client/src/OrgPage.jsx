import { useEffect, useRef, useState } from "react";
import { fetchDatasetsMultiPage, pick } from "./api";
import { renderUnitChart } from "./charts";
import { ArrowLeft } from "lucide-react";

export default function OrgPage({ orgName, tooltipRef }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const orgChartRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { rows } = await fetchDatasetsMultiPage();
        if (mounted) setDatasets((rows || []).filter(dataset => dataset.organisasi?.nama === orgName));
      } catch (error) {
        console.error("Gagal memuat dataset instansi:", error);
        if (mounted) setDatasets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [orgName]);

  useEffect(() => {
    if (orgChartRef.current) renderUnitChart(orgChartRef.current, datasets, tooltipRef?.current);
  }, [datasets, tooltipRef]);

  const unitCount = new Set(datasets.map(dataset => pick(dataset, ["satuan"], "Tidak disebutkan"))).size;

  return (
    <main className="org-page">
      <section className="search-results-hero" style={{ paddingTop: 18 }}>
        <a className="back-link" href="?page=all-orgs"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke daftar instansi</a>
        <div className="search-results-head">
          <div>
            <span className="search-results-eyebrow">PROFIL INSTANSI</span>
            <h1>{orgName}</h1>
            <p>{loading ? "Menyiapkan data instansi..." : "Jelajahi katalog dan ringkasan data yang dipublikasikan oleh instansi ini."}</p>
          </div>
          <div className="search-results-count"><span>Total Dataset</span><strong>{loading ? "..." : datasets.length}</strong></div>
        </div>
      </section>

      <section className="org-dashboard-grid">
        <div className="org-dataset-panel">
          <div className="org-panel-head">
            <div><span>KATALOG</span><h2>Dataset dari {orgName}</h2></div>
            <b>{loading ? "..." : datasets.length}</b>
          </div>
          <ul className="list org-dataset-list">
            {loading && <li className="org-list-message">Memuat daftar dataset...</li>}
            {datasets.length === 0 && !loading && <li className="org-list-message">Tidak ada dataset untuk instansi ini.</li>}
            {datasets.map(dataset => (
              <li key={dataset.uuid}>
                <a className="row-link" href={`?dataset=${dataset.uuid}`}>
                  <span className="name"><span className="badge">{pick(dataset, ["satuan"], "")}</span>{dataset.judul || "Tanpa judul"}</span>
                  <span className="meta">Lihat detail →</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <aside className="org-chart-panel">
          <span>RINGKASAN</span>
          <h2>Distribusi satuan data</h2>
          <div className="sub">Kategori satuan yang paling banyak digunakan</div>
          <svg ref={orgChartRef} width="100%" height="280"></svg>
        </aside>
      </section>
    </main>
  );
}
