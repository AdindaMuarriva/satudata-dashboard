// Proxy sederhana buat bypass CORS ke satudata.acehprov.go.id

const express = require("express");
const fetch = require("node-fetch"); // versi 2.x, support require()
const cors = require("cors");

const app = express();
const PORT = 3001;
const TARGET = "https://satudata.acehprov.go.id";

app.use(cors()); // izinkan semua origin ke proxy ini 
app.use(express.json({ limit: "100kb" }));

function responseText(result) {
  if (typeof result.output_text === "string") return result.output_text;
  return (result.output || []).flatMap(item => item.content || [])
    .filter(item => item.type === "output_text" && typeof item.text === "string")
    .map(item => item.text).join("\n");
}

// Model tidak pernah menerima data mentah atau API key di browser. Ia hanya
// membantu menulis penjelasan dari statistik yang telah dihitung dari dataset.
app.post("/ai/insight", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return res.status(503).json({ error: "AI belum dikonfigurasi. Set OPENAI_API_KEY dan OPENAI_MODEL di server." });
  const context = req.body?.context;
  if (!context || typeof context !== "object") return res.status(400).json({ error: "Ringkasan dataset tidak valid." });
  const prompt = `Anda adalah analis data publik Aceh. Buat penjelasan singkat Bahasa Indonesia (maksimal 120 kata) hanya dari JSON berikut. Jangan menambah angka, sebab-akibat, atau fakta yang tidak ada. Jelaskan bentuk chart dan keterbatasan data bila relevan. JSON: ${JSON.stringify(context)}`;
  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: prompt, temperature: 0.2, max_output_tokens: 220 })
    });
    const result = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: result.error?.message || "Model AI tidak dapat merespons." });
    const explanation = responseText(result);
    if (!explanation) return res.status(502).json({ error: "Model AI tidak mengembalikan penjelasan." });
    res.json({ explanation });
  } catch (error) {
    res.status(502).json({ error: `Gagal menghubungi model AI: ${error.message}` });
  }
});

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
