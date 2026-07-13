import { useEffect, useState } from "react";
import { fetchDatasetsMultiPage, pick } from "./api";

export default function SearchResultsPage({ query }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(query || "");
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSearch(query || "");
  }, [query]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    const nextQuery = search.trim();
    window.location.href = nextQuery
      ? `?page=search&query=${encodeURIComponent(nextQuery)}`
      : "?page=search";
  }

  function toggleDataset(uuid) {
    setSelectedIds(current => {
      if (current.includes(uuid)) return current.filter(id => id !== uuid);
      return current.length < 5 ? [...current, uuid] : current;
    });
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { rows } = await fetchDatasetsMultiPage();
        if (!mounted) return;
        const normalizedQuery = (query || "").trim().toLowerCase();
        const filtered = (rows || []).filter(dataset => {
          const title = dataset.judul ? dataset.judul.toLowerCase() : "";
          return normalizedQuery ? title.includes(normalizedQuery) : false;
        });
        setDatasets(filtered);
      } catch (error) {
        console.error("Gagal memuat hasil pencarian:", error);
        setDatasets([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [query]);

  return (
    <main className="search-results-page">
      <section className="search-results-hero">
        <a className="search-results-back" href="?">← Kembali ke beranda</a>
        <div className="search-results-head">
          <div>
            <span className="search-results-eyebrow">KATALOG DATA ACEH</span>
            <h1>Hasil Pencarian</h1>
            <p>{query ? <>Menampilkan dataset untuk <strong>“{query}”</strong></> : "Masukkan kata kunci untuk mencari dataset."}</p>
          </div>
          <div className="search-results-count">
            <span>Dataset ditemukan</span>
            <strong>{loading ? "..." : datasets.length}</strong>
          </div>
        </div>

        <form className="search-results-form" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Cari data statistik..."
            aria-label="Cari dataset"
          />
          <button type="submit">Cari</button>
        </form>
      </section>

      <section className="search-results-content">
        {selectedIds.length > 0 && (
          <div className="compare-toolbar">
            <span>{selectedIds.length} dataset dipilih (maks. 5)</span>
            <a href={`?page=compare&datasets=${selectedIds.join(",")}`}>Bandingkan visualisasi</a>
          </div>
        )}
        {loading ? (
          <div className="search-result-message"><p>Memuat hasil...</p></div>
        ) : !query ? (
          <div className="search-result-message"><p>Silakan masukkan kata kunci pencarian pada kolom di atas.</p></div>
        ) : datasets.length === 0 ? (
          <div className="search-result-message"><p>Tidak ditemukan dataset yang sesuai. Coba gunakan kata kunci lain.</p></div>
        ) : (
          <div className="dataset-grid">
            {datasets.map(dataset => (
              <article key={dataset.uuid} className={`dataset-card compare-card${selectedIds.includes(dataset.uuid) ? " selected" : ""}`}>
                <div className="dataset-card-top">
                  <span className="dataset-badge">{pick(dataset, ["satuan"], "Non-Spesifik")}</span>
                  <span className="dataset-org">{dataset.organisasi ? dataset.organisasi.nama : "Tanpa OPD"}</span>
                </div>
                <div className="dataset-card-title">{dataset.judul || "Tanpa judul"}</div>
                <div className="dataset-card-desc">{dataset.deskripsi ? dataset.deskripsi.slice(0, 110) + (dataset.deskripsi.length > 110 ? "..." : "") : "Klik untuk melihat detail dataset."}</div>
                <div className="compare-card-actions">
                  <button type="button" onClick={() => toggleDataset(dataset.uuid)} disabled={!selectedIds.includes(dataset.uuid) && selectedIds.length >= 5}>
                    {selectedIds.includes(dataset.uuid) ? "✓ Dipilih" : "Pilih untuk dibandingkan"}
                  </button>
                  <a href={`?dataset=${dataset.uuid}`}>Lihat detail</a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
