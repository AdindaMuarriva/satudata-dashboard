import { useEffect, useState } from "react";
import { fetchJSON, CONFIG } from "../api/client.js";

export default function ListView() {
  const [status, setStatus] = useState("Menghubungkan...");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        await fetchJSON(CONFIG.endpoints.dashboard);
        if (!cancelled) setStatus("Terhubung ke proxy lokal ✅");
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStatus("Gagal terhubung ❌");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <header>
        <div className="titles">
          <h1>Sosial &amp; Kependudukan Aceh</h1>
          <p>Setup React berhasil — tahap berikutnya migrasi daftar dataset ke sini.</p>
        </div>
      </header>
      <div className="banner">
        <b>Status koneksi proxy:</b> {status}
        {error && <div>Error: {error}</div>}
      </div>
    </div>
  );
}