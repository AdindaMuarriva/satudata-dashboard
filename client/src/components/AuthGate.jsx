import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { createActivityLog } from "../api/activity";

const ADMIN_ROUTE = "admin";

function toAdminUser(user) {
  return {
    id: user.id,
    fullName: user.user_metadata?.full_name || user.email || "Admin",
    email: user.email,
    role: "admin",
  };
}

function SecretInput({ value, onChange, placeholder, name }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input name={name} type={isVisible ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingRight: 46 }} />
      <button type="button" onClick={() => setIsVisible((current) => !current)} aria-label={isVisible ? "Sembunyikan isi" : "Tampilkan isi"} title={isVisible ? "Sembunyikan isi" : "Tampilkan isi"} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", border: 0, padding: 4, background: "transparent", color: "#6b7280", cursor: "pointer" }}>
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", adminCode: "" });
  const [notice, setNotice] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdminRoute(params.get("page") === ADMIN_ROUTE || params.get("admin") === "1");

    const setUserFromSession = (session) => {
      setSessionUser(session?.user ? toAdminUser(session.user) : null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserFromSession(session);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserFromSession(session);
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const login = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setNotice("Isi email dan password terlebih dahulu.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setNotice(error.message);
      return;
    }

    setNotice("");
    void createActivityLog("Login", "Admin berhasil masuk ke sistem.").catch(() => {});
    const params = new URLSearchParams(window.location.search);
    params.set("admin", "1");
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  };

  const register = async (event) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const adminCode = form.adminCode;

    if (!fullName || !email || !password || !confirmPassword || !adminCode) {
      setNotice("Semua kolom wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setNotice("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setNotice("Konfirmasi password tidak cocok.");
      return;
    }

    const { data: settings, error: settingsError } = await supabase
      .from("admin_settings")
      .select("admin_code")
      .eq("id", 1)
      .single();

    if (settingsError) {
      setNotice("Tidak dapat memverifikasi kode admin. Silakan coba lagi.");
      return;
    }

    if (adminCode !== settings.admin_code) {
      setNotice("Kode Admin tidak valid.");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setNotice(signUpError.message);
      return;
    }

    if (!data.user) {
      setNotice("Pendaftaran akun admin gagal. Silakan coba lagi.");
      return;
    }

    const { error: profileError } = await supabase.from("admin_profile").insert({
      id: data.user.id,
      full_name: fullName,
      email,
    });

    if (profileError) {
      await supabase.auth.signOut();
      setNotice(profileError.message);
      return;
    }

    setForm({ fullName: "", email: "", password: "", confirmPassword: "", adminCode: "" });
    setMode("login");
    setNotice("Akun admin berhasil dibuat. Silakan login.");
  };

  const logout = async () => {
    void createActivityLog("Logout", "Admin keluar dari sistem.").catch(() => {});
    const { error } = await supabase.auth.signOut();

    if (error) {
      setNotice(error.message);
      return;
    }

    window.sessionStorage.setItem("satudata_auth_notice", "Anda berhasil logout dari area admin.");
    window.location.assign(window.location.pathname);
  };

  if (!isReady) return null;

  if (sessionUser) {
    return typeof children === "function"
      ? children({ user: sessionUser, onLogout: logout, isAdminRoute })
      : children;
  }

  if (isAdminRoute) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-header">
            <div>
              <p className="auth-eyebrow">Area Admin</p>
              <h1>Masuk untuk mengelola dataset</h1>
            </div>
            <p className="auth-subtitle">Silakan login terlebih dahulu untuk mengakses halaman admin dan fitur update dataset.</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Mode autentikasi">
            <button type="button" className={`auth-tab active`} onClick={() => { setMode("login"); setNotice(""); }}>
              Login
            </button>
            <button type="button" className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setNotice(""); }}>
              Register
            </button>
          </div>

          {notice ? <div className={`auth-message ${notice.includes("berhasil") ? "success" : ""}`}>{notice}</div> : null}

          {mode === "register" ? (
            <form className="auth-form" onSubmit={register}>
              <label>
                Nama lengkap
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Contoh: Admin SatuData" />
              </label>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@contoh.go.id" />
              </label>
              <label>
                Password
                <SecretInput name="password" value={form.password} onChange={handleChange} placeholder="Minimal 6 karakter" />
              </label>
              <label>
                Konfirmasi password
                <SecretInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" />
              </label>
              <label>
                Kode Admin
                <SecretInput name="adminCode" value={form.adminCode} onChange={handleChange} placeholder="Masukkan kode admin" />
              </label>
              <button type="submit" className="auth-submit">Daftar akun admin</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={login}>
              <label>
                Email
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@contoh.go.id" />
              </label>
              <label>
                Password
                <SecretInput name="password" value={form.password} onChange={handleChange} placeholder="password" />
              </label>
              <button type="submit" className="auth-submit">Masuk</button>
            </form>
          )}

          <p className="auth-footnote">Akun yang bisa masuk adalah akun berstatus admin.</p>
        </div>
      </div>
    );
  }

  return children;
}
