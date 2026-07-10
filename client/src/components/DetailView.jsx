import { useParams, Link } from "react-router-dom";

export default function DetailView() {
  const { uuid } = useParams();

  return (
    <div>
      <Link className="back-link" to="/">
        ← Kembali ke daftar dataset
      </Link>
      <div className="detail-header">
        <h1>Halaman detail (placeholder)</h1>
        <p>UUID dataset dari URL: {uuid}</p>
        <p>Chart, peta, tren, dan ranking akan dipindah ke sini di tahap berikutnya.</p>
      </div>
    </div>
  );
}
