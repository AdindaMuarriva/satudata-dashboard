import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { pick } from "../../api";
import {
  getDatasets,
  getDatasetStatus,
  moveDatasetToTrash,
  setDatasetActive,
} from "../../api/dataset";
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

export default function DatasetPage({ onAddDataset, onEditDataset }) {
  const [datasets, setDatasets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  async function loadData() {
    setLoading(true);
    try {
      const { rows } = await getDatasets();
      setDatasets(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const key = keyword.toLowerCase();
    setFiltered(datasets.filter((item) =>
      resolveTitle(item).toLowerCase().includes(key)
      || resolveOrganization(item).toLowerCase().includes(key)
    ));
  }, [keyword, datasets]);

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpenMenuId(null);
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  async function handleToggleStatus(dataset) {
    const id = dataset.uuid || dataset.id;
    const datasetTitle = resolveTitle(dataset);
    const nextActive = getDatasetStatus(dataset) !== "Aktif";
    await setDatasetActive(id, nextActive);
    void createActivityLog(
      nextActive ? "Aktifkan Dataset" : "Nonaktifkan Dataset",
      nextActive ? `Mengaktifkan dataset "${datasetTitle}".` : `Menonaktifkan dataset "${datasetTitle}".`
    ).catch(() => {});
    setOpenMenuId(null);
    loadData();
  }

  async function handleMoveToTrash(dataset) {
    await moveDatasetToTrash(dataset);
    void createActivityLog("Pindahkan ke Tempat Sampah", `Memindahkan dataset "${resolveTitle(dataset)}" ke tempat sampah.`).catch(() => {});
    setOpenMenuId(null);
    loadData();
  }

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h2>Kelola Dataset</h2>
          <p>Tambah, edit maupun menghapus dataset.</p>
        </div>
        <button className="btn-primary" onClick={onAddDataset}>
          <Plus size={18} /> Tambah Dataset
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Cari dataset..." value={keyword} onChange={(event) => setKeyword(event.target.value)} />
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
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5}>Memuat data...</td></tr>}
            {!loading && filtered.map((item, index) => {
              const id = item.uuid || item.id || index;
              const status = getDatasetStatus(item);
              return (
                <tr key={id}>
                  <td>{resolveTitle(item)}</td>
                  <td>{resolveOrganization(item)}</td>
                  <td>{resolveYear(item)}</td>
                  <td><span className={`status ${status === "Aktif" ? "active" : "draft"}`}>{status}</span></td>
                  <td>
                    <div className="table-action" ref={openMenuId === id ? menuRef : null} style={{ position: "relative" }}>
                      <button type="button" onClick={() => setOpenMenuId(openMenuId === id ? null : id)} title="Aksi Dataset">
                        <MoreVertical size={16} />
                      </button>
                      {openMenuId === id && (
                        <div role="menu" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 10, minWidth: 210, padding: 6, borderRadius: 10, background: "#fff", boxShadow: "0 8px 22px rgba(0,0,0,.14)" }}>
                          <button type="button" style={{ width: "100%", height: "auto", justifyContent: "flex-start", padding: "9px 10px" }} onClick={() => { onEditDataset(item.uuid || item.id); setOpenMenuId(null); }}>Edit Dataset</button>
                          <button type="button" style={{ width: "100%", height: "auto", justifyContent: "flex-start", padding: "9px 10px" }} onClick={() => handleToggleStatus(item)}>{status === "Aktif" ? "Nonaktifkan Dataset" : "Aktifkan Dataset"}</button>
                          <button type="button" style={{ width: "100%", height: "auto", justifyContent: "flex-start", padding: "9px 10px" }} onClick={() => handleMoveToTrash(item)}>Pindahkan ke Tempat Sampah</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="admin-empty">Tidak ada dataset yang ditemukan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
