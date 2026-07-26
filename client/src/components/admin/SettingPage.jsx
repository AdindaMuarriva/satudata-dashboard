import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  Eye,
  EyeOff,
  Globe,
  Info,
  KeyRound,
  Lock,
  Server,
  Settings,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { deleteMyAccount, updateAdminCode, updatePassword } from "../../api/account";

function SecretInput({ value, onChange, placeholder }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input type={isVisible ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", paddingRight: 46 }} />
      <button type="button" onClick={() => setIsVisible((current) => !current)} aria-label={isVisible ? "Sembunyikan isi" : "Tampilkan isi"} title={isVisible ? "Sembunyikan isi" : "Tampilkan isi"} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", border: 0, padding: 4, background: "transparent", color: "#6b7280", cursor: "pointer" }}>
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function SettingPage({ user, onAccountDeleted }) {
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [notice, setNotice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [codeForm, setCodeForm] = useState({ currentCode: "", newCode: "", confirmCode: "" });
  const [codeNotice, setCodeNotice] = useState("");
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordNotice, setPasswordNotice] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const systemInfo = {
    appName: "Dashboard SatuData Aceh",
    version: "v1.0.0",
    frontend: "React + Vite",
    backend: "Supabase",
    database: "PostgreSQL (Supabase)",
    auth: "Supabase Authentication",
    api: "https://satudata.acehprov.go.id/api",
    environment: import.meta.env.MODE === "production" ? "Production" : "Development",
  };

  async function handleDeleteAccount() {
    if (confirmationText !== "HAPUS AKUN") {
      setNotice('Ketik "HAPUS AKUN" untuk melanjutkan.');
      return;
    }

    setIsDeleting(true);
    setNotice("");

    try {
      await deleteMyAccount();
      onAccountDeleted?.();
    } catch (error) {
      setNotice(error.message || "Akun gagal dihapus. Silakan coba lagi.");
      setIsDeleting(false);
    }
  }

  async function handleAdminCodeSubmit(event) {
    event.preventDefault();
    const { currentCode, newCode, confirmCode } = codeForm;

    if (!currentCode || !newCode || !confirmCode) {
      setCodeNotice("Semua kolom Kode Admin wajib diisi.");
      return;
    }

    if (newCode !== confirmCode) {
      setCodeNotice("Konfirmasi Kode Admin baru tidak cocok.");
      return;
    }

    setIsSavingCode(true);
    setCodeNotice("");

    try {
      await updateAdminCode(currentCode, newCode);
      setCodeForm({ currentCode: "", newCode: "", confirmCode: "" });
      setCodeNotice("Kode Admin berhasil diperbarui.");
    } catch (error) {
      setCodeNotice(error.message || "Kode Admin gagal diperbarui.");
    } finally {
      setIsSavingCode(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    const { newPassword, confirmPassword } = passwordForm;

    if (!newPassword || !confirmPassword) {
      setPasswordNotice("Semua kolom password wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordNotice("Password minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSavingPassword(true);
    setPasswordNotice("");

    try {
      await updatePassword(newPassword);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      // Clear notification - no trigger/notification after successful update
      setPasswordNotice("");
    } catch (error) {
      setPasswordNotice(error.message || "Password gagal diubah.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  if (isSettingsView) {
    return (
      <div className="admin-content">
        <button type="button" className="back-admin-button" onClick={() => { setIsSettingsView(false); setNotice(""); }}>
          <ArrowLeft size={18} /> Kembali ke Tentang Sistem
        </button>

        <div className="page-header">
          <div>
            <h2>Pengaturan</h2>
            <p>Kelola pengaturan akun administrator yang sedang digunakan.</p>
          </div>
        </div>

        <div className="card-header">
          <h2>Akun</h2>
        </div>

        <div className="setting-grid">
          <div className="setting-card">
            <h3><User size={18} /> Akun Administrator</h3>
            <div className="setting-item"><span>Nama</span><strong>{user?.fullName || "Administrator"}</strong></div>
            <div className="setting-item"><span>Email</span><strong>{user?.email || "-"}</strong></div>
          </div>

          <div className="setting-card">
            <h3><Shield size={18} /> Keamanan Akun</h3>
            <div className="setting-item"><span>Status Akun</span><strong>Aktif</strong></div>
            <div className="setting-item"><span>Autentikasi</span><strong>Supabase Authentication</strong></div>
          </div>

          <div className="setting-card">
            <h3><Trash2 size={18} /> Hapus Akun</h3>
            <div className="setting-item"><span>Konsekuensi</span><strong>Akun dan profil admin akan dihapus permanen.</strong></div>
            <button type="button" className="btn-primary" style={{ alignSelf: "center", justifyContent: "center", minWidth: 250 }} onClick={() => { setNotice(""); setShowDeleteConfirmation(true); }}>
              <AlertTriangle size={18} /> Hapus Akun Secara Permanen
            </button>
            {notice && <p className="form-error">{notice}</p>}
          </div>
        </div>

        <div className="card-header">
          <h2>Keamanan</h2>
        </div>

        <div className="setting-card">
          <h3><Lock size={18} /> Ubah Password</h3>
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <label>
              Password Baru
              <SecretInput value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="Minimal 6 karakter" />
            </label>
            <label>
              Konfirmasi Password Baru
              <SecretInput value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Ulangi password baru" />
            </label>
            {passwordNotice && <p className={passwordNotice.includes("gagal") || passwordNotice.includes("tidak") ? "form-error" : "form-success"}>{passwordNotice}</p>}
            <button type="submit" className="btn-primary" style={{ alignSelf: "center", justifyContent: "center", minWidth: 220 }} disabled={isSavingPassword}>{isSavingPassword ? "Menyimpan..." : "Simpan Password"}</button>
          </form>
        </div>

        <div className="card-header">
          <h2>Kode Admin</h2>
        </div>

        <div className="setting-card">
          <h3><KeyRound size={18} /> Ubah Kode Admin</h3>
          <form className="auth-form" onSubmit={handleAdminCodeSubmit}>
            <label>
              Kode Admin Lama
              <SecretInput value={codeForm.currentCode} onChange={(event) => setCodeForm((current) => ({ ...current, currentCode: event.target.value }))} placeholder="Masukkan kode lama" />
            </label>
            <label>
              Kode Admin Baru
              <SecretInput value={codeForm.newCode} onChange={(event) => setCodeForm((current) => ({ ...current, newCode: event.target.value }))} placeholder="Masukkan kode baru" />
            </label>
            <label>
              Konfirmasi Kode Admin Baru
              <SecretInput value={codeForm.confirmCode} onChange={(event) => setCodeForm((current) => ({ ...current, confirmCode: event.target.value }))} placeholder="Ulangi kode baru" />
            </label>
            {codeNotice && <p className={codeNotice.includes("berhasil") ? "form-success" : "form-error"}>{codeNotice}</p>}
            <button type="submit" className="btn-primary" style={{ alignSelf: "center", justifyContent: "center", minWidth: 220 }} disabled={isSavingCode}>{isSavingCode ? "Menyimpan..." : "Simpan Kode Admin"}</button>
          </form>
        </div>

        {showDeleteConfirmation && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-icon"><AlertTriangle size={32} /></div>
              <h3>Hapus akun administrator?</h3>
              <p>Tindakan ini menghapus akun, profil, dan riwayat aktivitas Anda secara permanen. Ketik <strong>HAPUS AKUN</strong> untuk mengonfirmasi.</p>
              <input value={confirmationText} onChange={(event) => setConfirmationText(event.target.value)} placeholder="HAPUS AKUN" />
              <div className="modal-actions">
                <button className="btn-outline" disabled={isDeleting} onClick={() => { setShowDeleteConfirmation(false); setConfirmationText(""); }}>Batal</button>
                <button className="btn-danger" disabled={isDeleting} onClick={handleDeleteAccount}>{isDeleting ? "Menghapus..." : "Hapus Permanen"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-content">
      <div className="page-header">
        <div>
          <h2>Informasi Sistem</h2>
          <p>Informasi konfigurasi aplikasi Dashboard SatuData Aceh.</p>
        </div>
        <button type="button" className="btn-outline" onClick={() => setIsSettingsView(true)}>
          <Settings size={18} /> Ubah Pengaturan
        </button>
      </div>

      <div className="setting-grid">
        <div className="setting-card">
          <h3><Info size={18} /> Informasi Aplikasi</h3>
          <div className="setting-item"><span>Nama Aplikasi</span><strong>{systemInfo.appName}</strong></div>
          <div className="setting-item"><span>Versi</span><strong>{systemInfo.version}</strong></div>
          <div className="setting-item"><span>Frontend</span><strong>{systemInfo.frontend}</strong></div>
        </div>
        <div className="setting-card">
          <h3><Database size={18} /> Database</h3>
          <div className="setting-item"><span>Database</span><strong>{systemInfo.database}</strong></div>
          <div className="setting-item"><span>Authentication</span><strong>{systemInfo.auth}</strong></div>
        </div>
        <div className="setting-card">
          <h3><Globe size={18} /> API</h3>
          <div className="setting-item"><span>Portal API</span><strong>{systemInfo.api}</strong></div>
        </div>
        <div className="setting-card">
          <h3><Server size={18} /> Lingkungan</h3>
          <div className="setting-item"><span>Status</span><strong>{systemInfo.environment}</strong></div>
        </div>
        <div className="setting-card">
          <h3><Shield size={18} /> Keamanan</h3>
          <div className="setting-item"><span>Login Admin</span><strong>Supabase Authentication</strong></div>
          <div className="setting-item"><span>Password</span><strong>Terenkripsi oleh Supabase</strong></div>
        </div>
        <div className="setting-card">
          <h3><User size={18} /> Administrator</h3>
          <div className="setting-item"><span>Status Akun</span><strong>Aktif</strong></div>
          <div className="setting-item"><span>Akses</span><strong>Administrator</strong></div>
        </div>
      </div>
    </div>
  );
}
