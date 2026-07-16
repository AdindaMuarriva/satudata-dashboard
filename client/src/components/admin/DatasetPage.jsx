import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import {
  CONFIG,
  fetchDatasetsMultiPage,
  pick,
  deleteDataset,
} from "../../api";

function resolveTitle(dataset) {
  return pick(dataset, ["judul", "title", "name"], "Dataset tanpa judul");
}

function resolveOrganization(dataset) {
  if (typeof dataset?.organisasi === "string") return dataset.organisasi;
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;

  return pick(
    dataset,
    ["organisasi_nama", "instansi", "opd"],
    "-"
  );
}

function resolveYear(dataset) {
  const raw = pick(
    dataset,
    ["tahun", "year", "created_at"],
    "-"
  );

  if (typeof raw === "string") {
    const match = raw.match(/\d{4}/);
    if (match) return match[0];
  }

  return raw;
}

export default function DatasetPage({ onAddDataset, onEditDataset }) {

  const [datasets, setDatasets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadData() {

    setLoading(true);

    try{

      const { rows } = await fetchDatasetsMultiPage();

      setDatasets(rows);
      setFiltered(rows);

    }finally{

      setLoading(false);

    }

  }

  useEffect(()=>{

    loadData();

  },[]);

  useEffect(()=>{

    const key = keyword.toLowerCase();

    const result = datasets.filter(item=>

      resolveTitle(item).toLowerCase().includes(key) ||

      resolveOrganization(item).toLowerCase().includes(key)

    );

    setFiltered(result);

  },[keyword,datasets]);

  function handleDeleteClick(item) {
    setDeleteTarget(item);
  }

  function handleConfirmDelete() {
    if (deleteTarget) {
      deleteDataset(deleteTarget.uuid || deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    }
  }

  return(

<div className="admin-content">

<div className="page-header">

<div>

<h2>Kelola Dataset</h2>

<p>
Tambah, edit maupun menghapus dataset.
</p>

</div>

<button className="btn-primary" onClick={onAddDataset}>

<Plus size={18}/>

Tambah Dataset

</button>

</div>

<div className="toolbar">

<div className="search-box">

<Search size={18}/>

<input

type="text"

placeholder="Cari dataset..."

value={keyword}

onChange={(e)=>setKeyword(e.target.value)}

/>

</div>

<button

className="btn-outline"

onClick={loadData}

>

<RefreshCw size={18}/>

Refresh

</button>

</div>

<div className="table-card">

<table className="admin-table">

<thead>

<tr>

<th>Nama Dataset</th>

<th>Organisasi</th>

<th>Tahun</th>

<th>Aksi</th>

</tr>

</thead>

<tbody>

{loading && (

<tr>

<td colSpan={4}>
Memuat data...
</td>

</tr>

)}

{!loading && filtered.map((item,index)=>(

<tr

key={item.uuid || index}

>

<td>

{resolveTitle(item)}

</td>

<td>

{resolveOrganization(item)}

</td>

<td>

{resolveYear(item)}

</td>

<td>

<div className="table-action">

<button onClick={() => onEditDataset(item.uuid || item.id)} title="Edit Dataset">

<Pencil size={16}/>

</button>

<button onClick={() => handleDeleteClick(item)} title="Hapus Dataset" className="delete-btn">

<Trash2 size={16}/>

</button>

</div>

</td>

</tr>

))}

{!loading && filtered.length === 0 && (
<tr>
<td colSpan={4} className="admin-empty">
Tidak ada dataset yang ditemukan.
</td>
</tr>
)}

</tbody>

</table>

</div>

{deleteTarget && (
  <div className="modal-backdrop">
    <div className="modal-content">
      <div className="modal-icon">
        <AlertTriangle size={32} />
      </div>
      <h3>Hapus Dataset?</h3>
      <p>
        Apakah Anda yakin ingin menghapus dataset <strong>{resolveTitle(deleteTarget)}</strong>?
        Tindakan ini tidak dapat dibatalkan.
      </p>
      <div className="modal-actions">
        <button className="btn-outline" onClick={() => setDeleteTarget(null)}>
          Batal
        </button>
        <button className="btn-danger" onClick={handleConfirmDelete}>
          Ya, Hapus
        </button>
      </div>
    </div>
  </div>
)}

</div>

  );

}
