import { useEffect, useState } from "react";
import { fetchDatasetsMultiPage, pick } from "./api";
import { ArrowLeft } from "lucide-react";

export default function TopicPage({ topicName }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { rows } = await fetchDatasetsMultiPage();
        if (!mounted) return;
        const normalizedTopic = (topicName || "").toLowerCase();
        const filtered = (rows || []).filter(d => {
          if (!normalizedTopic || normalizedTopic === "semua") return true;
          const haystack = [
            d.topik && d.topik.nama,
            d.judul,
            d.organisasi && d.organisasi.nama,
            d.deskripsi,
            d.satuan
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(normalizedTopic);
        });
        setDatasets(filtered);
      } catch (err) {
        console.error("Gagal memuat dataset topik:", err);
        setDatasets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [topicName]);

  const filteredDatasets = datasets.filter(d => {
    if (!searchQuery) return true;
    return (d.judul || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <main className="search-results-page">
      <section className="search-results-hero" style={{ paddingTop: 18 }}>
        <a className="back-link" href="?"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda</a>
        <div className="search-results-head">
          <div>
            <span className="search-results-eyebrow">JELAJAH DATA PER TOPIK</span>
            <h1>Topik: {topicName || "Semua"}</h1>
            <p>{loading ? "Memuat dataset..." : `Menampilkan dataset yang relevan untuk topik ini.`}</p>
          </div>
          <div className="search-results-count"><span>Total Dataset</span><strong>{loading ? "..." : datasets.length}</strong></div>
        </div>
      </section>

      <div className="topic-search-bar">
        <input
          type="search"
          placeholder="Cari nama dataset..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <section className="search-results-content" style={{ paddingTop: 0 }}>
        {loading ? (
          <div className="panel wide">
            <p>Memuat dataset...</p>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="panel wide">
            <p>Tidak ada dataset yang cocok untuk kata kunci ini.</p>
          </div>
        ) : (
          <div className="dataset-grid">
            {filteredDatasets.map(d => (
              <a key={d.uuid} className="dataset-card" href={`?dataset=${d.uuid}`}>
                <div className="dataset-card-top">
                  <span className="dataset-badge">{pick(d, ["satuan"], "Non-Spesifik")}</span>
                  <span className="dataset-org">{d.organisasi ? d.organisasi.nama : "Tanpa OPD"}</span>
                </div>
                <div className="dataset-card-title">{d.judul || "Tanpa judul"}</div>
                <div className="dataset-card-desc">{d.deskripsi ? d.deskripsi.slice(0, 110) + (d.deskripsi.length > 110 ? "..." : "") : "Klik untuk melihat detail dataset."}</div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
