import { useEffect, useMemo, useState } from "react";
import { fetchDatasetsMultiPage } from "./api";
import { ArrowLeft } from "lucide-react";

export default function FieldPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    let active = true;
    fetchDatasetsMultiPage().then(({ rows }) => { if (active) setDatasets(rows || []); }).catch(() => { if (active) setDatasets([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const fields = useMemo(() => [...new Set(datasets.map(item => item.bidang || item.topik?.nama).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id")), [datasets]);
  const visible = selected ? datasets.filter(item => (item.bidang || item.topik?.nama) === selected) : [];
  return <main className="search-results-page topic-page">
    <section className="search-results-hero" style={{ paddingTop: 18 }}>
      <a className="back-link" href="?"><ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda</a>
      <div className="search-results-head">
        <div>
          <span className="search-results-eyebrow">JELAJAH DATA</span>
          <h1>Bidang Urusan</h1>
          <p>Pilih bidang urusan untuk menampilkan dataset terkait, selaras dengan pengelompokan portal Satu Data Aceh.</p>
        </div>
      </div>
    </section>
    {loading ? <div className="panel wide"><p>Memuat bidang urusan...</p></div> : <><div className="topic-grid field-grid">{fields.map(field => <button type="button" key={field} className={selected === field ? "topic-card active" : "topic-card"} onClick={() => setSelected(field)}>{field}</button>)}</div>{selected && <section className="topic-results"><h2>{selected}</h2><div className="dataset-grid">{visible.map(item => <a key={item.uuid} className="dataset-card" href={`?dataset=${item.uuid}`}><div className="dataset-card-title">{item.judul || "Tanpa judul"}</div><div className="dataset-card-desc">{item.organisasi?.nama || "OPD tidak tercantum"}</div></a>)}</div></section>}</>}
  </main>;
}
