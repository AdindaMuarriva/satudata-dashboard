import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Pencil, RefreshCw } from "lucide-react";
import { getLocalDatasets, pick } from "../../api";

function resolveTitle(dataset) {
  return pick(dataset, ["judul", "title", "name"], "Dataset tanpa judul");
}

function resolveOrgName(dataset) {
  if (typeof dataset?.organisasi === "string") return dataset.organisasi;
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "opd", "instansi"], "-");
}

function resolveYear(dataset) {
  return pick(dataset, ["tahun", "year"], "-");
}

function resolveAddedAt(dataset) {
  if (!dataset?.created_at) return "-";
  try {
    return new Date(dataset.created_at).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dataset.created_at;
  }
}

export default function RecentDatasetsPage({ onBack, onEditDataset }) {
  const [datasets, setDatasets] = useState([]);

  function loadData() {
    setDatasets(getLocalDatasets());
  }

  useEffect(() => {
    loadData();
    window.addEventListener("satudata-local-datasets-updated", loadData);
    return () => window.removeEventListener("satudata-local-datasets-updated", loadData);
  }, []);

  return (
    <div className="admin-content">
      <button type="button" className="back-admin-button" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Dashboard
      </button>

      <div className="page-header">
        <div>
          <h2>Dataset Baru</h2>
          <p>Dataset yang baru saja ditambahkan atau diimport secara lokal.</p>
        </div>
        <button className="btn-outline" onClick={loadData}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Dataset</th>
              <th>Organisasi</th>
              <th>Tahun</th>
              <th>Ditambahkan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {datasets.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty">
                  <FileText size={16} style={{ marginRight: 6, verticalAlign: "-3px" }} />
                  Belum ada dataset baru yang ditambahkan atau diimport.
                </td>
              </tr>
            ) : (
              datasets.map((item, index) => (
                <tr key={item.uuid || index}>
                  <td>{resolveTitle(item)}</td>
                  <td>{resolveOrgName(item)}</td>
                  <td>{resolveYear(item)}</td>
                  <td>{resolveAddedAt(item)}</td>
                  <td>
                    <div className="table-action">
                      <button onClick={() => onEditDataset(item.uuid)} title="Edit Dataset">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}