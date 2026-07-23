//TENTANG SISTEM PAGE

import { Database, Globe, Shield, Server, User, Info } from "lucide-react";

export default function SettingPage() {

  const systemInfo = {

    appName: "Dashboard SatuData Aceh",

    version: "v1.0.0",

    frontend: "React + Vite",

    backend: "Supabase",

    database: "PostgreSQL (Supabase)",

    auth: "Supabase Authentication",

    api: "https://satudata.acehprov.go.id/api",

    environment: import.meta.env.MODE === "production"
      ? "Production"
      : "Development"

  };

  return (

<div className="admin-content">

<div className="page-header">

<div>

<h2>Informasi Sistem</h2>

<p>

Informasi konfigurasi aplikasi Dashboard SatuData Aceh.

</p>

</div>

</div>

<div className="setting-grid">

<div className="setting-card">

<h3>

<Info size={18}/>

Informasi Aplikasi

</h3>

<div className="setting-item">

<span>Nama Aplikasi</span>

<strong>{systemInfo.appName}</strong>

</div>

<div className="setting-item">

<span>Versi</span>

<strong>{systemInfo.version}</strong>

</div>

<div className="setting-item">

<span>Frontend</span>

<strong>{systemInfo.frontend}</strong>

</div>

</div>

<div className="setting-card">

<h3>

<Database size={18}/>

Database

</h3>

<div className="setting-item">

<span>Database</span>

<strong>{systemInfo.database}</strong>

</div>

<div className="setting-item">

<span>Authentication</span>

<strong>{systemInfo.auth}</strong>

</div>

</div>

<div className="setting-card">

<h3>

<Globe size={18}/>

API

</h3>

<div className="setting-item">

<span>Portal API</span>

<strong>{systemInfo.api}</strong>

</div>

</div>

<div className="setting-card">

<h3>

<Server size={18}/>

Lingkungan

</h3>

<div className="setting-item">

<span>Status</span>

<strong>{systemInfo.environment}</strong>

</div>

</div>

<div className="setting-card">

<h3>

<Shield size={18}/>

Keamanan

</h3>

<div className="setting-item">

<span>Login Admin</span>

<strong>Supabase Authentication</strong>

</div>

<div className="setting-item">

<span>Password</span>

<strong>Terenkripsi oleh Supabase</strong>

</div>

</div>

<div className="setting-card">

<h3>

<User size={18}/>

Administrator

</h3>

<div className="setting-item">

<span>Status Akun</span>

<strong>Aktif</strong>

</div>

<div className="setting-item">

<span>Akses</span>

<strong>Administrator</strong>

</div>

</div>

</div>

</div>

  );

}