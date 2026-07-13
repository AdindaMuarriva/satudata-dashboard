import { useEffect, useState } from "react";
import { fetchDatasetsMultiPage, pick } from "./api";

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
    <div className="wrap">
      <a className="back-link" href="?">← Kembali ke daftar</a>
      <div className="section-head topic-page-head">
        <div className="titles">
          <h1>Topik: {topicName || "Semua"}</h1>
          <p>{loading ? "Memuat dataset..." : `Menampilkan ${datasets.length} dataset untuk topik ini.`}</p>
        </div>
        <div className="topic-summary-card">
          <div>
            <span className="topic-summary-label">Total Dataset</span>
            <strong>{loading ? "..." : datasets.length}</strong>
          </div>
        </div>
      </div>

      <div className="topic-search-bar">
        <input
          type="search"
          placeholder="Cari nama dataset..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="topic-results">
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
      </div>
    </div>
  );
}
