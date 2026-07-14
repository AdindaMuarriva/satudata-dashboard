import { useEffect, useState } from "react";
import { Search, Building2, RefreshCw, Eye } from "lucide-react";
import { CONFIG, fetchJSON, pick } from "../../api";

function resolveName(org) {
  return pick(org, ["nama", "name", "title"], "-");
}

function resolveDescription(org) {
  return pick(org, ["deskripsi", "description"], "-");
}

function resolveDataset(org) {
  return pick(org, ["jumlah_dataset", "dataset_count"], "-");
}

export default function OPDPage() {

  const [organizations, setOrganizations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {

    setLoading(true);

    try {

      const result = await fetchJSON(CONFIG.endpoints.organizations);

      const rows = Array.isArray(result)
        ? result
        : result.results || [];

      setOrganizations(rows);
      setFiltered(rows);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    loadData();

  }, []);

  useEffect(() => {

    const key = keyword.toLowerCase();

    setFiltered(

      organizations.filter(org =>

        resolveName(org).toLowerCase().includes(key)

      )

    );

  }, [keyword, organizations]);

  return (

<div className="admin-content">

<div className="page-header">

<div>

<h2>Organisasi (OPD)</h2>

<p>
Daftar seluruh Organisasi Perangkat Daerah.
</p>

</div>

</div>

<div className="toolbar">

<div className="search-box">

<Search size={18} />

<input
type="text"
placeholder="Cari organisasi..."
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

<th>Nama OPD</th>

<th>Deskripsi</th>

<th>Dataset</th>

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

{!loading && filtered.map((org,index)=>(

<tr key={org.uuid || index}>

<td>

<div className="opd-name">

<Building2 size={18}/>

{resolveName(org)}

</div>

</td>

<td>

{resolveDescription(org)}

</td>

<td>

{resolveDataset(org)}

</td>

<td>

<button className="table-icon">

<Eye size={16}/>

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

  );

}