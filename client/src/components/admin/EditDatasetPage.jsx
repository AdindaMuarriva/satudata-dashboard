import { useEffect, useState, useRef } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  AlertCircle, 
  X, 
  FileSpreadsheet,
  HelpCircle
} from "lucide-react";
import { 
  CONFIG, 
  fetchJSON, 
  fetchDatasetMeta, 
  fetchDatasetValues, 
  saveDatasetChanges, 
  unwrapArray 
} from "../../api";

const categories = ["Masyarakat", "Kesehatan", "Pendidikan", "Infrastruktur", "Pertanian", "Sosial", "Statistik", "Lingkungan"];

export default function EditDatasetPage({ uuid, onBack }) {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [metadata, setMetadata] = useState(null);
  
  // Form metadata state
  const [form, setForm] = useState({
    judul: "",
    bidang: "Masyarakat",
    organisasi: "",
    tahun: new Date().getFullYear(),
    satuan: "",
    deskripsi: "",
    dashboardQuestion: "",
    dashboardQuestionDescription: ""
  });
  
  // Spreadsheet state
  const [csvRows, setCsvRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedColName, setSelectedColName] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { rowIndex, colName }
  const [editValue, setEditValue] = useState("");
  
  // Autosave status state
  const [savingStatus, setSavingStatus] = useState("saved"); // saved | saving | error
  
  // Prevent autosave on first load
  const isInitialLoad = useRef(true);
  const autosaveTimer = useRef(null);
  const cellInputRef = useRef(null);

  // Load organizations and dataset details on mount
  useEffect(() => {
    let mounted = true;
    
    // Fetch organizations
    fetchJSON(CONFIG.endpoints.organizations)
      .then(json => {
        if (mounted) setOrganizations(unwrapArray(json));
      })
      .catch(() => {
        if (mounted) setOrganizations([]);
      });

    // Fetch dataset data
    async function loadDataset() {
      try {
        const meta = await fetchDatasetMeta(uuid);
        const values = await fetchDatasetValues(uuid, null);
        
        if (!mounted) return;
        
        setMetadata(meta);
        
        // Map metadata to form fields
        setForm({
          judul: meta.judul || meta.title || "Dataset tanpa judul",
          bidang: meta.bidang || meta.topik?.nama || "Masyarakat",
          organisasi: meta.organisasi?.nama || meta.organisasi || meta.opd || "",
          tahun: meta.tahun || meta.year || new Date().getFullYear(),
          satuan: meta.satuan || "",
          deskripsi: meta.deskripsi || meta.notes || "",
          dashboardQuestion: meta.dashboardQuestion || "",
          dashboardQuestionDescription: meta.dashboardQuestionDescription || ""
        });
        
        const rows = values.rows || [];
        setCsvRows(rows);
        
        // Extract columns from rows keys
        const allKeys = [...new Set(rows.flatMap(r => Object.keys(r)))];
        const filteredCols = allKeys.filter(key => 
          key !== "id" && 
          key !== "uuid" && 
          key !== "created_at" && 
          key !== "updated_at" && 
          key !== "deleted_at"
        );
        
        // If there are no columns, initialize with default columns
        setColumns(filteredCols.length > 0 ? filteredCols : ["bps_nama_kabupaten_kota", "tahun", "nilai"]);
        
        setLoading(false);
        // Let component mount fully before enabling autosave
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 100);
      } catch (err) {
        console.error("Gagal memuat dataset untuk diedit", err);
        if (mounted) setLoading(false);
      }
    }
    
    loadDataset();
    
    return () => {
      mounted = false;
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [uuid]);

  // Focus cell input on edit mode trigger
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [editingCell]);

  // Handle autosave when form or rows change
  const triggerAutosave = (updatedForm, updatedRows, updatedColumns) => {
    if (isInitialLoad.current) return;
    
    setSavingStatus("saving");
    
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    
    autosaveTimer.current = setTimeout(() => {
      // Map form fields back to dataset schema
      const changes = {
        judul: updatedForm.judul,
        bidang: updatedForm.bidang.toLowerCase(),
        topik: { nama: updatedForm.bidang },
        organisasi: { nama: updatedForm.organisasi },
        tahun: String(updatedForm.tahun),
        satuan: updatedForm.satuan,
        deskripsi: updatedForm.deskripsi,
        dashboardQuestion: updatedForm.dashboardQuestion,
        dashboardQuestionDescription: updatedForm.dashboardQuestionDescription,
        csvRows: updatedRows.map(row => {
          // Keep only active columns plus metadata keys
          const cleanRow = {};
          updatedColumns.forEach(col => {
            cleanRow[col] = row[col] === undefined ? "" : row[col];
          });
          // Preserve system keys
          if (row.id !== undefined) cleanRow.id = row.id;
          if (row.uuid !== undefined) cleanRow.uuid = row.uuid;
          
          // Sync row year and unit to dataset metadata if not set
          if (cleanRow.tahun === undefined || cleanRow.tahun === "") {
            cleanRow.tahun = String(updatedForm.tahun);
          }
          if (cleanRow.satuan === undefined || cleanRow.satuan === "") {
            cleanRow.satuan = updatedForm.satuan;
          }
          return cleanRow;
        })
      };
      
      try {
        saveDatasetChanges(uuid, changes);
        setSavingStatus("saved");
      } catch (e) {
        console.error("Gagal menyimpan otomatis", e);
        setSavingStatus("error");
      }
    }, 800); // 800ms debounce
  };

  // Form input change
  function handleFormChange(e) {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    triggerAutosave(newForm, csvRows, columns);
  }

  // Cell editing triggers
  function handleCellClick(rowIndex, colName) {
    setSelectedRowIndex(rowIndex);
    setSelectedColName(colName);
  }

  // Click again or double click to edit
  function handleCellDoubleClick(rowIndex, colName, value) {
    setEditingCell({ rowIndex, colName });
    setEditValue(value === undefined || value === null ? "" : String(value));
  }

  function handleCellKeyDown(e, rowIndex, colName) {
    if (e.key === "Enter") {
      commitCellEdit();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  }

  function commitCellEdit() {
    if (!editingCell) return;
    
    const { rowIndex, colName } = editingCell;
    const updatedRows = [...csvRows];
    
    // Convert to number if it is a number string, otherwise keep string
    const trimmedVal = editValue.trim();
    const parsedVal = trimmedVal !== "" && !isNaN(Number(trimmedVal)) ? Number(trimmedVal) : trimmedVal;
    
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      [colName]: parsedVal
    };
    
    setCsvRows(updatedRows);
    setEditingCell(null);
    triggerAutosave(form, updatedRows, columns);
  }

  // Row operations
  function handleAddRow() {
    const newRow = {};
    columns.forEach(col => {
      // Default some common columns to keep structure nice
      if (col === "tahun") newRow[col] = String(form.tahun);
      else if (col === "satuan") newRow[col] = form.satuan;
      else newRow[col] = "";
    });
    const updatedRows = [...csvRows, newRow];
    setCsvRows(updatedRows);
    setSelectedRowIndex(updatedRows.length - 1);
    triggerAutosave(form, updatedRows, columns);
  }

  function handleDeleteRow(rowIndex) {
    const updatedRows = csvRows.filter((_, idx) => idx !== rowIndex);
    setCsvRows(updatedRows);
    setSelectedRowIndex(null);
    triggerAutosave(form, updatedRows, columns);
  }

  // Column operations
  function handleAddColumn() {
    const colName = prompt("Masukkan nama kolom baru (contoh: jumlah_penduduk):");
    if (!colName) return;
    
    const cleanColName = colName.trim().toLowerCase().replace(/\s+/g, "_");
    if (columns.includes(cleanColName)) {
      alert("Kolom dengan nama tersebut sudah ada!");
      return;
    }
    
    const updatedCols = [...columns, cleanColName];
    setColumns(updatedCols);
    
    // Add key to all rows
    const updatedRows = csvRows.map(row => ({
      ...row,
      [cleanColName]: ""
    }));
    setCsvRows(updatedRows);
    triggerAutosave(form, updatedRows, updatedCols);
  }

  function handleDeleteColumn(colName) {
    if (columns.length <= 1) {
      alert("Dataset harus memiliki minimal satu kolom data!");
      return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus kolom "${colName}"? Seluruh data pada kolom ini akan hilang.`)) {
      return;
    }
    
    const updatedCols = columns.filter(col => col !== colName);
    setColumns(updatedCols);
    
    // Remove key from all rows
    const updatedRows = csvRows.map(row => {
      const newRow = { ...row };
      delete newRow[colName];
      return newRow;
    });
    setCsvRows(updatedRows);
    triggerAutosave(form, updatedRows, updatedCols);
  }

  if (loading) {
    return (
      <div className="admin-content edit-dataset-loading">
        <Loader2 className="spinner" size={40} />
        <p>Memuat editor dataset...</p>
      </div>
    );
  }

  return (
    <div className="admin-content edit-dataset-page">
      {/* Top action bar */}
      <div className="edit-topbar-nav">
        <button type="button" className="back-admin-button" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Dataset
        </button>
        
        {/* Autosave status banner */}
        <div className={`autosave-status ${savingStatus}`}>
          {savingStatus === "saving" && (
            <>
              <Loader2 className="spinner" size={16} />
              <span>Menyimpan perubahan...</span>
            </>
          )}
          {savingStatus === "saved" && (
            <>
              <Check size={16} />
              <span>Tersimpan otomatis</span>
            </>
          )}
          {savingStatus === "error" && (
            <>
              <AlertCircle size={16} />
              <span>Gagal menyimpan otomatis</span>
            </>
          )}
        </div>
      </div>

      <div className="page-header">
        <div>
          <h2>Edit Dataset</h2>
          <p>Ubah metadata atau edit nilai baris secara langsung di tabel bawah.</p>
        </div>
      </div>

      {/* Metadata form */}
      <div className="dataset-form-card">
        <h3 className="section-title">Metadata Dataset</h3>
        <div className="dataset-form-grid">
          <label>
            Judul Dataset
            <input 
              required 
              name="judul" 
              value={form.judul} 
              onChange={handleFormChange} 
              placeholder="Contoh: Jumlah Penduduk per Kecamatan" 
            />
          </label>
          <label>
            Kategori
            <select name="bidang" value={form.bidang} onChange={handleFormChange}>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            Dinas / OPD
            <select required name="organisasi" value={form.organisasi} onChange={handleFormChange}>
              <option value="">Pilih dinas atau OPD</option>
              {organizations.map((org, index) => (
                <option key={org.uuid || org.id || index} value={org.nama || org.name}>
                  {org.nama || org.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tahun Data
            <input 
              required 
              name="tahun" 
              type="number" 
              min="2000" 
              max="2100" 
              value={form.tahun} 
              onChange={handleFormChange} 
            />
          </label>
          <label>
            Satuan (opsional)
            <input 
              name="satuan" 
              value={form.satuan} 
              onChange={handleFormChange} 
              placeholder="Orang, persen, unit, ..." 
            />
          </label>
          <label className="form-wide">
            Deskripsi (opsional)
            <textarea 
              name="deskripsi" 
              value={form.deskripsi} 
              onChange={handleFormChange} 
              placeholder="Jelaskan cakupan dan sumber data singkat." 
              rows="3" 
            />
          </label>
          <label className="form-wide">
            Pertanyaan di dashboard (opsional)
            <input
              name="dashboardQuestion"
              value={form.dashboardQuestion}
              onChange={handleFormChange}
              placeholder="Contoh: Kabupaten mana yang memiliki produksi padi tertinggi?"
            />
            <small>Jika diisi, pertanyaan ini otomatis tampil pada dashboard kategori dataset dan membuka dataset ini.</small>
          </label>
          <label className="form-wide">
            Deskripsi pertanyaan (opsional)
            <textarea
              name="dashboardQuestionDescription"
              value={form.dashboardQuestionDescription}
              onChange={handleFormChange}
              placeholder="Contoh: Membandingkan produksi padi antar kabupaten/kota."
              rows="3"
            />
          </label>
        </div>
      </div>

      {/* Spreadsheet editor card */}
      <div className="dataset-form-card spreadsheet-card">
        <div className="spreadsheet-header">
          <div>
            <h3 className="section-title">Tabel Data (Spreadsheet)</h3>
            <span className="spreadsheet-subtitle">
              Double-klik sel untuk mengedit. Tekan Enter untuk menyimpan, Esc untuk batal.
            </span>
          </div>
          
          <div className="spreadsheet-actions">
            <button className="btn-outline" onClick={handleAddColumn}>
              <Plus size={16} /> Tambah Kolom
            </button>
            <button className="btn-primary" onClick={handleAddRow}>
              <Plus size={16} /> Tambah Baris
            </button>
          </div>
        </div>

        <div className="spreadsheet-container">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th className="row-number-header">#</th>
                {columns.map(col => (
                  <th key={col} className="spreadsheet-th">
                    <div className="header-cell-content">
                      <span>{col}</span>
                      <button 
                        type="button"
                        className="delete-col-btn" 
                        onClick={() => handleDeleteColumn(col)}
                        title={`Hapus kolom "${col}"`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="row-actions-header">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {csvRows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={selectedRowIndex === rowIndex ? "row-selected" : ""}
                >
                  <td className="row-number-td">{rowIndex + 1}</td>
                  {columns.map(col => {
                    const isEditing = editingCell && editingCell.rowIndex === rowIndex && editingCell.colName === col;
                    const isSelected = selectedRowIndex === rowIndex && selectedColName === col;
                    const val = row[col];
                    
                    return (
                      <td 
                        key={col} 
                        className={`spreadsheet-td ${isSelected ? "cell-selected" : ""} ${isEditing ? "cell-editing" : ""}`}
                        onClick={() => handleCellClick(rowIndex, col)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, col, val)}
                      >
                        {isEditing ? (
                          <input
                            ref={cellInputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitCellEdit}
                            onKeyDown={(e) => handleCellKeyDown(e, rowIndex, col)}
                            className="cell-input"
                          />
                        ) : (
                          <span className="cell-value">
                            {val === undefined || val === null || val === "" ? (
                              <span className="cell-placeholder">(kosong)</span>
                            ) : (
                              String(val)
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="row-action-td">
                    <button 
                      type="button"
                      className="delete-row-btn"
                      onClick={() => handleDeleteRow(rowIndex)}
                      title="Hapus baris"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {csvRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} className="spreadsheet-empty">
                    <FileSpreadsheet size={24} />
                    <p>Tabel kosong. Tambah baris baru untuk mulai mengisi data.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="spreadsheet-footer">
          <HelpCircle size={16} />
          <span>
            Tips: Pastikan baris data Anda memiliki kolom daerah seperti <code>bps_nama_kabupaten_kota</code> atau <code>kemendagri_nama_kabupaten_kota</code> agar dapat dirender di visualisasi peta Aceh.
          </span>
        </div>
      </div>
    </div>
  );
}
