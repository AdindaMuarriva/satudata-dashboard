import { useEffect, useState } from "react";
import { fetchDatasetsMultiPage } from "./api";
import { ArrowLeft } from "lucide-react";
import SkeletonCard from "./components/SkeletonCard";

export default function AllOrgsPage() {
  const [orgCounts, setOrgCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { rows } = await fetchDatasetsMultiPage();
        if (!mounted) return;
        const counts = (rows || []).reduce((result, dataset) => {
          const name = dataset.organisasi?.nama;
          if (name) result[name] = (result[name] || 0) + 1;
          return result;
        }, {});
        setOrgCounts(Object.entries(counts).map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Gagal memuat daftar instansi:", error);
        if (mounted) setOrgCounts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const totalDatasets = orgCounts.reduce((sum, org) => sum + org.count, 0);

  return (
    <main className="all-orgs-page">
      <section className="search-results-hero" style={{ paddingTop: 18 }}>
        <a className="back-link" href="?"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda</a>
        <div className="search-results-head">
          <div>
            <span className="search-results-eyebrow">JELAJAH DATA</span>
            <h1>Daftar Instansi</h1>
            <p>Temukan dataset resmi berdasarkan instansi atau OPD yang mempublikasikannya di portal Satu Data Aceh.</p>
          </div>
          <div className="search-results-count"><span>Total Instansi</span><strong>{loading ? "..." : orgCounts.length}</strong></div>
        </div>
      </section>

      <section className="all-orgs-content">
        <div className="all-orgs-heading">
          <div><span>DAFTAR OPD</span><h2>Pilih instansi untuk membuka dashboard datanya</h2></div>
          {!loading && <b>{orgCounts.length} instansi</b>}
        </div>
        {loading ? (
          <div className="all-orgs-message">Memuat daftar instansi...</div>
        ) : orgCounts.length === 0 ? (
          <div className="all-orgs-message">Belum ada instansi yang ditemukan.</div>
        ) : (
          <div className="all-orgs-grid">
            {orgCounts.map(({ name, count }, index) => (
              <a key={name} className="all-org-card" href={`?org=${encodeURIComponent(name)}`}>
                <span className="all-org-rank">{String(index + 1).padStart(2, "0")}</span>
                <div className="all-org-card-name">{name}</div>
                <div className="all-org-card-footer"><span>{count} dataset</span><span>Jelajahi →</span></div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
