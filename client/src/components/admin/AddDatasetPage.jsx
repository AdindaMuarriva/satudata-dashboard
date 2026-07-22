import { useEffect, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import { CONFIG, fetchJSON, getLocalDatasets, saveLocalDataset, unwrapArray } from "../../api";
import { DATA_FILE_ACCEPT, readDataFile } from "../../utils/fileImport";

const categories = ["Masyarakat", "Kesehatan", "Pendidikan", "Infrastruktur", "Pertanian", "Sosial", "Statistik", "Lingkungan"];

export default function AddDatasetPage({ onBack, onSaved, mode = "dataset" }) {
  const [organizations, setOrganizations] = useState([]);
  const [file, setFile] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ judul: "", bidang: "Masyarakat", organisasi: "", tahun: new Date().getFullYear(), deskripsi: "", satuan: "", dashboardQuestion: "", dashboardQuestionDescription: "" });
  const isCsvImport = mode === "csv";

  useEffect(() => {
    fetchJSON(CONFIG.endpoints.organizations)
      .then(json => setOrganizations(unwrapArray(json)))
      .catch(() => setOrganizations([]));
  }, []);

  function updateField(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleFile(event) {
    const selected = event.target.files?.[0];
    setFile(selected || null);
    setMessage("");
    if (!selected) return setCsvRows([]);
    try {
      const rows = await readDataFile(selected);
      setCsvRows(rows);
      if (!rows.length) setMessage("File belum memiliki baris data. Pastikan ada header dan minimal satu baris.");
    } catch {
      setCsvRows([]);
      setMessage("File tidak dapat dibaca. Gunakan CSV, Excel, JSON, TXT, atau TSV yang valid.");
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!file || !csvRows.length) return setMessage("Unggah file data yang berisi minimal satu baris.");

    const dataset = {
      uuid: `local-${Date.now()}`,
      judul: form.judul.trim(),
      bidang: (isCsvImport ? "masyarakat" : form.bidang).toLowerCase(),
      topik: { nama: isCsvImport ? "Masyarakat" : form.bidang },
      organisasi: { nama: isCsvImport ? "Import CSV" : form.organisasi },
      tahun: String(form.tahun),
      dimensi: String(form.tahun),
      deskripsi: isCsvImport ? `Data diimpor dari ${file.name}` : form.deskripsi.trim(),
      satuan: form.satuan.trim() || "Belum dicantumkan",
      dashboardQuestion: form.dashboardQuestion.trim(),
      dashboardQuestionDescription: form.dashboardQuestionDescription.trim(),
      csvFileName: file.name,
      csvRows,
      created_at: new Date().toISOString(),
    };
    saveLocalDataset(dataset);
    onSaved?.();
    setMessage(`Dataset berhasil ditambahkan. ${getLocalDatasets().length} dataset lokal tersimpan.`);
  }

  return (
    <div className="admin-content add-dataset-page">
      <button type="button" className="back-admin-button" onClick={onBack}><ArrowLeft size={18} /> Kembali ke Dashboard</button>
      <div className="page-header">
        <div><h2>{isCsvImport ? "Import Data" : "Tambah Dataset"}</h2><p>{isCsvImport ? "Masukkan judul, lalu unggah file data Anda." : "Lengkapi metadata dan unggah data dalam format CSV."}</p></div>
      </div>
      <form className="dataset-form-card" onSubmit={handleSubmit}>
        {isCsvImport ? (
          <div className="csv-title-field"><label>Judul Dataset<input required name="judul" value={form.judul} onChange={updateField} placeholder="Contoh: Jumlah Penduduk per Kecamatan" /></label></div>
        ) : (
          <div className="dataset-form-grid">
            <label>Judul Dataset<input required name="judul" value={form.judul} onChange={updateField} placeholder="Contoh: Jumlah Penduduk per Kecamatan" /></label>
            <label>Kategori<select name="bidang" value={form.bidang} onChange={updateField}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
            <label>Dinas / OPD<select required name="organisasi" value={form.organisasi} onChange={updateField}><option value="">Pilih dinas atau OPD</option>{organizations.map((org, index) => <option key={org.uuid || org.id || index} value={org.nama || org.name}>{org.nama || org.name}</option>)}</select></label>
            <label>Tahun Data<input required name="tahun" type="number" min="2000" max="2100" value={form.tahun} onChange={updateField} /></label>
            <label>Satuan (opsional)<input name="satuan" value={form.satuan} onChange={updateField} placeholder="Orang, persen, unit, ..." /></label>
            <label className="form-wide">Deskripsi (opsional)<textarea name="deskripsi" value={form.deskripsi} onChange={updateField} placeholder="Jelaskan cakupan dan sumber data singkat." rows="4" /></label>
            <label className="form-wide">Pertanyaan di dashboard (opsional)<input name="dashboardQuestion" value={form.dashboardQuestion} onChange={updateField} placeholder="Contoh: Kabupaten mana yang memiliki produksi padi tertinggi?" /><small>Jika diisi, pertanyaan ini otomatis tampil pada dashboard kategori dataset dan langsung membuka dataset ini.</small></label>
            <label className="form-wide">Deskripsi pertanyaan (opsional)<textarea name="dashboardQuestionDescription" value={form.dashboardQuestionDescription} onChange={updateField} placeholder="Contoh: Membandingkan produksi padi antar kabupaten/kota." rows="3" /></label>
          </div>
        )}
        <label className="csv-dropzone"><input required type="file" accept={DATA_FILE_ACCEPT} onChange={handleFile} /><FileSpreadsheet size={30} /><strong>{file ? file.name : "Unggah file data"}</strong><span>{file ? `${csvRows.length} baris data terdeteksi` : "Mendukung CSV, Excel, JSON, TXT, dan TSV."}</span></label>
        {message && <p className={message.startsWith("Dataset berhasil") ? "form-success" : "form-error"}>{message}</p>}
        <div className="form-actions"><button type="button" className="btn-outline" onClick={onBack}>Batal</button><button className="btn-primary" type="submit"><Upload size={18} /> Simpan Dataset</button></div>
      </form>
    </div>
  );
}
