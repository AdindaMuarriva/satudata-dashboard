import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { pick } from "../../api";
import { deleteDataset, getTrashDatasets, restoreDataset } from "../../api/dataset";
import { createActivityLog } from "../../api/activity";

function resolveTitle(dataset) {
  return pick(dataset, ["judul", "title", "name"], "Dataset tanpa judul");
}

function resolveOrganization(dataset) {
  if (typeof dataset?.organisasi === "string") return dataset.organisasi;
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "instansi", "opd"], "-");
}

function resolveYear(dataset) {
  const raw = pick(dataset, ["tahun", "year", "created_at"], "-");
  return typeof raw === "string" ? raw.match(/\d{4}/)?.[0] || raw : raw;
}

function resolveTrashedAt(dataset) {
  if (!dataset.trashed_at) return "-";
  return new Date(dataset.trashed_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function TrashPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      setDatasets(await getTrashDatasets());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRestore(dataset) {
    await restoreDataset(dataset);
    void createActivityLog("Pulihkan Dataset", `Memulihkan dataset "${resolveTitle(dataset)}" dari tempat sampah.`).catch(() => {});
    loadData();
  }

  async function handlePermanentDelete() {
    if (!deleteTarget) return;
    await deleteDataset(deleteTarget.uuid || deleteTarget.id);
    void createActivityLog("Hapus Permanen Dataset", `Menghapus permanen dataset "${resolveTitle(deleteTarget)}".`).catch(() => {});
    setDeleteTarget(null);
    loadData();
  }

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h2>Tempat Sampah</h2>
          <p>Dataset yang dipindahkan ke tempat sampah dapat dipulihkan atau dihapus permanen.</p>
        </div>
        <button className="btn-outline" onClick={loadData}><RefreshCw size={18} /> Refresh</button>
      </div>

      <div className="table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nama Dataset</th>
              <th>OPD</th>
              <th>Tahun</th>
              <th>Tanggal dipindahkan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}>Memuat data...</td></tr>}
            {!loading && datasets.map((dataset, index) => (
              <tr key={dataset.uuid || dataset.id || index}>
                <td>{resolveTitle(dataset)}</td>
                <td>{resolveOrganization(dataset)}</td>
                <td>{resolveYear(dataset)}</td>
                <td>{resolveTrashedAt(dataset)}</td>
                <td>
                  <div className="table-action">
                    <button type="button" title="Pulihkan Dataset" onClick={() => handleRestore(dataset)}><RotateCcw size={16} /></button>
                    <button type="button" title="Hapus Permanen" className="delete-btn" onClick={() => setDeleteTarget(dataset)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && datasets.length === 0 && <tr><td colSpan={5} className="admin-empty">Tempat sampah kosong.</td></tr>}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-icon"><AlertTriangle size={32} /></div>
            <h3>Hapus Permanen?</h3>
            <p>Dataset <strong>{resolveTitle(deleteTarget)}</strong> akan dihapus permanen dan tidak dapat dipulihkan.</p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn-danger" onClick={handlePermanentDelete}>Ya, Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
