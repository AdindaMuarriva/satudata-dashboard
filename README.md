# Dashboard SatuData Aceh

Dashboard publik dan area administrasi untuk menampilkan serta mengelola data SatuData Aceh. Aplikasi terdiri dari frontend React/Vite, proxy Node.js, dan Supabase untuk autentikasi admin.

## Menjalankan proyek

1. Salin `client/.env.example` menjadi `client/.env`, lalu isi konfigurasi yang diperlukan.
2. Jalankan frontend:

   ```bash
   cd client
   npm install
   npm run dev
   ```

3. Jika menggunakan proxy API atau fitur insight AI, dari root proyek jalankan:

   ```bash
   npm install
   npm run start:proxy
   ```

Proxy tersedia pada port `3001`. Simpan `OPENAI_API_KEY` dan `OPENAI_MODEL` hanya pada environment server; jangan pernah memasukkannya ke variabel `VITE_*`.

## Supabase

Jalankan migrasi di `supabase/migrations/` melalui Supabase CLI atau SQL Editor untuk membuat tabel dan kebijakan RLS.

Fitur hapus akun memakai Edge Function `delete-admin-account`. Deploy dengan:

```bash
supabase functions deploy delete-admin-account --project-ref <PROJECT_REF>
```

Function memverifikasi token pengguna, menghapus profil dan riwayat aktivitas terkait, lalu menghapus pengguna dari Supabase Authentication. Key dengan hak layanan (`SUPABASE_SERVICE_ROLE_KEY`) hanya digunakan di Edge Function dan tidak boleh disimpan di frontend.

## Perintah tersedia

```bash
# frontend
cd client
npm run dev
npm run build
npm run test

# proxy dari root proyek
npm run start:proxy
```
