import { useEffect, useState } from "react";
import { Search, Building2, RefreshCw, Eye } from "lucide-react";
import { CONFIG, fetchJSON, pick } from "../../api";
import { getDatasets } from "../../api/dataset";

function resolveName(org) {
  return pick(org, ["nama", "name", "title"], "-");
}

function resolveDescription(org) {
  return pick(org, ["deskripsi", "description"], "-");
}

function resolveDataset(org) {
  return pick(org, ["jumlah_dataset", "dataset_count"], "-");
}

function resolveDatasetOrganization(dataset) {
  if (typeof dataset?.organisasi === "string") return dataset.organisasi;
  if (dataset?.organisasi?.nama) return dataset.organisasi.nama;
  return pick(dataset, ["organisasi_nama", "opd", "instansi"], "");
}

function normalizeOrganizationName(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export default function OPDPage() {

  const [organizations, setOrganizations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {

    setLoading(true);

    try {

      const [{ rows: datasets }, result] = await Promise.all([
        getDatasets(),
        fetchJSON(CONFIG.endpoints.organizations),
      ]);

      const rows = Array.isArray(result)
        ? result
        : result.results || [];

      const datasetCounts = (datasets || []).reduce((counts, dataset) => {
        const name = resolveDatasetOrganization(dataset);
        const key = normalizeOrganizationName(name);
        if (!key) return counts;

        counts.set(key, { name, count: (counts.get(key)?.count || 0) + 1 });
        return counts;
      }, new Map());

      const opdWithDatasets = rows.reduce((items, org) => {
        const key = normalizeOrganizationName(resolveName(org));
        const datasetInfo = datasetCounts.get(key);
        if (datasetInfo) {
          items.push({ ...org, jumlah_dataset: datasetInfo.count });
          datasetCounts.delete(key);
        }
        return items;
      }, []);

      datasetCounts.forEach(({ name, count }) => {
        opdWithDatasets.push({ nama: name, deskripsi: "-", jumlah_dataset: count });
      });

      setOrganizations(opdWithDatasets);
      setFiltered(opdWithDatasets);

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
