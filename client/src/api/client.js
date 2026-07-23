export const CONFIG = {
  baseUrl: "https://satudata-proxy.vercel.app",
  pollingIntervalMs: 30000,
  datasetPagesToFetch: 8,
  datasetPageSize: 100,
  acehTopoUrl:
    "https://raw.githubusercontent.com/ghapsara/indonesia-atlas/master/kabupaten-kota/Aceh/aceh-simplified-topo.json",
  endpoints: {
    dashboard: "/api/dashboard/",
    kabkota: "/api/kabkota/?limit=200&page=0",
    categories: "/api/categories/?limit=20&page=1",
    organizations: "/api/organizations/?limit=50&page=1"
  }
};

export async function fetchJSON(path) {
  const res = await fetch(CONFIG.baseUrl + path, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`);
  return res.json();
}

export function unwrapArray(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== "object") return [];
  if (Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data.rows)) return json.data.rows;
  for (const key of ["results", "items", "records", "rows", "list"]) {
    if (Array.isArray(json[key])) return json[key];
  }
  return [];
}
