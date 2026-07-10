# Setup React (Vite) — Satu Data Aceh Dashboard

## 1. Taruh folder ini ke proyek kamu

Extract folder `client/` ini persis di dalam:

```
D:\INTERN\DISKOMINSA\Dashboard\SatuData tes\client\
```

Jadi strukturnya:

```
SatuData tes/
  proxy-server.js        <- backend proxy, TETAP di sini, tidak ikut pindah
  index.html             <- (opsional) rename ke index.legacy.html, simpan sbg referensi
  client/                <- folder baru ini (React app)
    package.json
    vite.config.js
    index.html
    src/
      main.jsx
      App.jsx
      api/client.js
      components/
        ListView.jsx
        DetailView.jsx
      styles/theme.css
```

## 2. Install dependency

Buka terminal (PowerShell/CMD) di folder `client/`:

```
cd "D:\INTERN\DISKOMINSA\Dashboard\SatuData tes\client"
npm install
```

## 3. Jalankan proxy server (seperti biasa) + dev server React

Perlu **dua terminal** berjalan bersamaan:

Terminal 1 (backend, dari folder root proyek, bukan dari `client/`):
```
cd "D:\INTERN\DISKOMINSA\Dashboard\SatuData tes"
node proxy-server.js
```

Terminal 2 (frontend React):
```
cd "D:\INTERN\DISKOMINSA\Dashboard\SatuData tes\client"
npm run dev
```

Vite akan buka browser otomatis ke `http://localhost:5173`.

## 4. Cek koneksi

Halaman utama akan menampilkan status "Terhubung ke proxy lokal ✅" kalau
`proxy-server.js` di port 3001 berhasil diakses dari React (port 5173).

**Kalau muncul error CORS di console:** buka `proxy-server.js`, cari bagian
header CORS (`Access-Control-Allow-Origin`), dan pastikan origin
`http://localhost:5173` diizinkan juga (sebelumnya proyek lama diakses dari
Live Server, biasanya port `5500` atau `5501` — tinggal tambahkan/izinkan
`5173` juga, atau set ke `*` kalau proxy ini cuma dipakai lokal).

## 5. Struktur saat ini (baru skeleton)

- `App.jsx` — routing: `/` → daftar dataset, `/dataset/:uuid` → detail dataset
  (menggantikan pola lama `index.html?dataset=uuid`)
- `ListView.jsx` & `DetailView.jsx` — masih placeholder, cuma untuk
  memastikan setup & koneksi proxy jalan
- `api/client.js` — `CONFIG` (baseUrl, endpoints) dan `fetchJSON` dipindah
  dari `<script>` lama

## 6. Langkah berikutnya (belum dikerjakan di tahap ini)

Setelah kamu konfirmasi dev server jalan dan status koneksi ✅, kita lanjut
migrasi bertahap:
1. Pindahkan logic `ListView` lama (daftar dataset, filter, chip topik, chart
   OPD) jadi komponen React + `useState`/`useEffect`
2. Pindahkan `DetailView` lama (kartu statistik, tren, ranking, choropleth
   map D3) — D3 tetap dipakai untuk render SVG, tapi dikontrol lewat
   `useRef` + `useEffect` di React
3. Commit ke repo `satudata-dashboard` kamu di GitHub
