import { useEffect, useState } from "react";
import { fetchDatasetsMultiPage, pick } from "./api";

const FEATURE_FILTERS = {
  Dataset: dataset => true,
  Dashboard: dataset => !!dataset.url,
  Infografik: dataset => !!dataset.infografik || dataset.judul?.toLowerCase().includes("infografik"),
  Publikasi: dataset => !!dataset.publikasi || dataset.judul?.toLowerCase().includes("publikasi"),
  Videografik: dataset => !!dataset.videografik || dataset.judul?.toLowerCase().includes("video"),
  "Dokumen Geospasial": dataset => !!dataset.geospasial || dataset.judul?.toLowerCase().includes("geospasial")
};

const FEATURE_COPY = {
  Dataset: { label: "KATALOG TERINTEGRASI", icon: "▦", text: "Jelajahi kumpulan dataset resmi dari berbagai instansi Pemerintah Aceh." },
  Dashboard: { label: "VISUALISASI INTERAKTIF", icon: "◌", text: "Temukan dashboard untuk memantau indikator dan perkembangan data penting." },
  Infografik: { label: "DATA DALAM VISUAL", icon: "◈", text: "Akses ringkasan data yang disajikan melalui infografik informatif." },
  Publikasi: { label: "PUBLIKASI RESMI", icon: "▤", text: "Temukan laporan, artikel, dan publikasi statistik yang relevan." },
  Videografik: { label: "KONTEN VIDEO", icon: "▷", text: "Jelajahi konten video yang membantu menjelaskan data secara lebih mudah." },
  "Dokumen Geospasial": { label: "PETA & GEOSPASIAL", icon: "⌖", text: "Akses dokumen serta data spasial untuk mendukung analisis berbasis lokasi." }
};

export default function FeaturePage({ featureName }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const feature = FEATURE_COPY[featureName] || FEATURE_COPY.Dataset;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const { rows } = await fetchDatasetsMultiPage();
        const filter = FEATURE_FILTERS[featureName] || (() => true);
        if (mounted) setDatasets((rows || []).filter(filter));
      } catch (error) {
        console.error("Gagal memuat dataset fitur:", error);
        if (mounted) setDatasets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [featureName]);

  const displayed = datasets.filter(dataset => {
    const keyword = search.trim().toLowerCase();
    return !keyword || [dataset.judul, dataset.deskripsi, dataset.organisasi?.nama].filter(Boolean).join(" ").toLowerCase().includes(keyword);
  });

  return (
    <main className="feature-page">
      <section className="feature-hero">
        <a className="feature-back-link" href="?">← Kembali ke beranda</a>
        <div className="feature-hero-grid">
          <div>
            <span className="feature-eyebrow">{feature.label}</span>
            <h1>{featureName}</h1>
            <p>{feature.text}</p>
          </div>
          <div className="feature-hero-icon" aria-hidden="true">{feature.icon}</div>
        </div>
        <div className="feature-hero-total"><strong>{loading ? "..." : datasets.length}</strong><span>Konten ditemukan</span></div>
      </section>

      <section className="feature-content">
        <div className="feature-content-head">
          <div><span>JELAJAHI {featureName.toUpperCase()}</span><h2>Konten yang tersedia</h2></div>
          <label className="feature-search-input"><span>Cari konten</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ketik kata kunci..." /></label>
        </div>
        {loading ? (
          <div className="feature-message">Memuat konten...</div>
        ) : displayed.length === 0 ? (
          <div className="feature-message">Tidak ada konten yang cocok. Coba kata kunci lain.</div>
        ) : (
          <div className="dataset-grid">
            {displayed.map(dataset => (
              <a key={dataset.uuid} className="dataset-card" href={`?dataset=${dataset.uuid}`}>
                <div className="dataset-card-top"><span className="dataset-badge">{pick(dataset, ["satuan"], "Non-Spesifik")}</span><span className="dataset-org">{dataset.organisasi?.nama || "Tanpa OPD"}</span></div>
                <div className="dataset-card-title">{dataset.judul || "Tanpa judul"}</div>
                <div className="dataset-card-desc">{dataset.deskripsi ? dataset.deskripsi.slice(0, 110) + (dataset.deskripsi.length > 110 ? "..." : "") : "Klik untuk melihat detail konten."}</div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
