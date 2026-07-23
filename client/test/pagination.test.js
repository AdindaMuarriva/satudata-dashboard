import test from "node:test";
import assert from "node:assert/strict";
import { fetchDatasetValues } from "../src/api.js";

test("fetchDatasetValues mengambil seluruh halaman datasource", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    const page = Number(new URL(url).searchParams.get("page"));
    const rows = page === 0 ? Array.from({ length: 500 }, (_, index) => ({ nilai: index })) : page === 1 ? [{ nilai: 500 }] : [];
    return new Response(JSON.stringify({ data: rows, metadata: { years: [{ year: 2024 }] }, count: 501 }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  try {
    const result = await fetchDatasetValues("dataset-uji", "2024");
    assert.equal(result.rows.length, 501);
    assert.deepEqual(result.years, [2024]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
