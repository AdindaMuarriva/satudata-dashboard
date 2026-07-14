import { useEffect, useState } from "react";
import {
  Save,
  Globe,
  Palette,
  Database,
  Image,
  RefreshCw
} from "lucide-react";

const STORAGE_KEY = "satudata_settings";

const defaultSetting = {

  portalName: "SatuData Aceh",

  portalDescription:
    "Portal Data Terbuka Pemerintah Aceh",

  apiUrl:
    "https://satudata.acehprov.go.id/api",

  primaryColor: "#9d1b1b",

  logo:
    "/logo-aceh.png"

};

export default function SettingPage(){

  const [setting,setSetting] = useState(defaultSetting);

  useEffect(()=>{

    const raw = localStorage.getItem(STORAGE_KEY);

    if(raw){

      setSetting(JSON.parse(raw));

    }

  },[]);

  function handleChange(e){

    setSetting({

      ...setting,

      [e.target.name]:e.target.value

    });

  }

  function saveSetting(){

    localStorage.setItem(

      STORAGE_KEY,

      JSON.stringify(setting)

    );

    alert("Pengaturan berhasil disimpan.");

  }

  function resetSetting(){

    setSetting(defaultSetting);

  }

  return(

<div className="admin-content">

<div className="page-header">

<div>

<h2>Pengaturan Sistem</h2>

<p>

Kelola konfigurasi portal SatuData.

</p>

</div>

<button
className="btn-primary"
onClick={saveSetting}
>

<Save size={18}/>

Simpan

</button>

</div>

<div className="setting-grid">

<div className="setting-card">

<h3>

<Globe size={18}/>

Informasi Portal

</h3>

<label>

Nama Portal

<input

name="portalName"

value={setting.portalName}

onChange={handleChange}

/>

</label>

<label>

Deskripsi

<textarea

name="portalDescription"

rows="4"

value={setting.portalDescription}

onChange={handleChange}

/>

</label>

</div>

<div className="setting-card">

<h3>

<Database size={18}/>

API

</h3>

<label>

Base URL API

<input

name="apiUrl"

value={setting.apiUrl}

onChange={handleChange}

/>

</label>

</div>

<div className="setting-card">

<h3>

<Palette size={18}/>

Tema

</h3>

<label>

Warna Utama

<input

type="color"

name="primaryColor"

value={setting.primaryColor}

onChange={handleChange}

/>

</label>

</div>

<div className="setting-card">

<h3>

<Image size={18}/>

Logo

</h3>

<label>

Path Logo

<input

name="logo"

value={setting.logo}

onChange={handleChange}

/>

</label>

<img

src={setting.logo}

alt="logo"

className="setting-logo"

/>

</div>

</div>

<div className="setting-action">

<button

className="btn-outline"

onClick={resetSetting}

>

<RefreshCw size={18}/>

Reset Default

</button>

</div>

</div>

  );

}