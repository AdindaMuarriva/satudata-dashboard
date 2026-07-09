/**
 * Proxy sederhana buat bypass CORS ke satudata.acehprov.go.id
 * ------------------------------------------------------------
 * Kenapa ini perlu: satudata.acehprov.go.id/api hanya izinkan
 * request dari origin situsnya sendiri (CORS block). Browser
 * kamu nggak bisa dipaksa nembus itu — tapi server-to-server
 * request (dari Node.js ini ke satudata) TIDAK kena aturan CORS,
 * karena CORS itu aturan browser, bukan aturan HTTP secara umum.
 *
 * Jadi proxy ini nerima request dari dashboard kamu, terusin ke
 * satudata.acehprov.go.id, lalu balikin hasilnya ke dashboard —
 * dengan header CORS yang benar supaya browser kamu nggak protes.
 *
 * CARA JALANIN:
 *   1. npm init -y
 *   2. npm install express node-fetch@2 cors
 *   3. node proxy-server.js
 *   4. Proxy jalan di http://localhost:3001
 *   5. Di dashboard HTML, ubah CONFIG.baseUrl jadi:
 *        "http://localhost:3001/api"
 *      (bukan lagi "https://satudata.acehprov.go.id/api")
 */

const express = require("express");
const fetch = require("node-fetch"); // versi 2.x, support require()
const cors = require("cors");

const app = express();
const PORT = 3001;
const TARGET = "https://satudata.acehprov.go.id";

app.use(cors()); // izinkan semua origin ke proxy ini 

// Proxy TRANSPARAN: apapun path yang diminta ke localhost:3001,
// diteruskan APA ADANYA (path + query string) ke satudata.acehprov.go.id.
app.use("/", async (req, res) => {
  const targetUrl = TARGET + req.originalUrl;
  console.log("Proxy ->", targetUrl);

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (dashboard-proxy)"
      }
    });

    const contentType = upstream.headers.get("content-type") || "";
    res.status(upstream.status);

    if (contentType.includes("application/json")) {
      const json = await upstream.json();
      res.json(json);
    } else {
      const text = await upstream.text();
      res.send(text);
    }
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(502).json({ error: "Gagal menghubungi satudata.acehprov.go.id", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy jalan di http://localhost:${PORT}`);
  console.log(`Contoh: http://localhost:${PORT}/api/datasets/?limit=5`);
});