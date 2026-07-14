import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";

import {
  CONFIG,
  fetchDatasetsMultiPage,
  pick,
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

export default function DatasetPage() {

  const [datasets, setDatasets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

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

  return(

<div className="admin-content">

<div className="page-header">

<div>

<h2>Kelola Dataset</h2>

<p>
Tambah, edit maupun menghapus dataset.
</p>

</div>

<button className="btn-primary">

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

<button>

<Pencil size={16}/>

</button>

<button>

<Trash2 size={16}/>

</button>

</div>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

  );

}