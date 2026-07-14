import { useEffect, useMemo, useState } from "react";

const ACCOUNTS_KEY = "satudata_admin_accounts";
const SESSION_KEY = "satudata_admin_session";
const ADMIN_ROUTE = "admin";

function readAccounts() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export default function AuthGate({ children }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", username: "", password: "", confirmPassword: "" });
  const [notice, setNotice] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [accounts, setAccounts] = useState(() => readAccounts());
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  const hasAdminAccount = useMemo(() => {
    return accounts.some((account) => account.role === "admin");
  }, [accounts, sessionUser]);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsReady(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const adminRoute = params.get("page") === ADMIN_ROUTE || params.get("admin") === "1";
    setIsAdminRoute(adminRoute);

    try {
      const rawSession = window.localStorage.getItem(SESSION_KEY);
      const session = rawSession ? JSON.parse(rawSession) : null;
      const storedAccounts = readAccounts();
      setAccounts(storedAccounts);
      if (session?.role === "admin") {
        setSessionUser(session);
      } else {
        setSessionUser(null);
      }
    } catch {
      setSessionUser(null);
    } finally {
      setIsReady(true);
      setMode(readAccounts().some((account) => account.role === "admin") ? "login" : "register");
    }
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const login = (event) => {
    event.preventDefault();
    const username = form.username.trim().toLowerCase();
    const password = form.password;

    if (!username || !password) {
      setNotice("Isi username dan password terlebih dahulu.");
      return;
    }

    const account = accounts.find(
      (item) => item.username.toLowerCase() === username && item.password === password
    );

    if (!account) {
      setNotice("Kredensial tidak cocok atau akun belum tersedia.");
      return;
    }

    if (account.role !== "admin") {
      setNotice("Akun ini tidak memiliki akses admin.");
      return;
    }

    const nextSession = {
      id: account.id,
      fullName: account.fullName,
      username: account.username,
      role: account.role,
      loggedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSessionUser(nextSession);
    setNotice("");

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("admin", "1");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    }
  };

  const register = (event) => {
    event.preventDefault();
    const accounts = readAccounts();
    const fullName = form.fullName.trim();
    const username = form.username.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!fullName || !username || !password || !confirmPassword) {
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

    if (accounts.some((account) => account.username.toLowerCase() === username)) {
      setNotice("Username ini sudah dipakai. Silakan gunakan username lain.");
      return;
    }

    const newAccount = {
      id: `admin-${Date.now()}`,
      fullName,
      username,
      password,
      role: "admin",
    };

    const nextAccounts = [...accounts, newAccount];
    setAccounts(nextAccounts);
    saveAccounts(nextAccounts);

    setForm({ fullName: "", username: "", password: "", confirmPassword: "" });
    setMode("login");
    setNotice("Akun admin berhasil dibuat. Silakan login.");
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_KEY);
    }
    setSessionUser(null);
    setMode(accounts.some((account) => account.role === "admin") ? "login" : "register");
    setNotice("");
  };

  if (!isReady) {
    return null;
  }

  if (sessionUser?.role === "admin") {
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
                Username
                <input name="username" value={form.username} onChange={handleChange} placeholder="username" />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimal 6 karakter" />
              </label>
              <label>
                Konfirmasi password
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" />
              </label>
              <button type="submit" className="auth-submit">Daftar akun admin</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={login}>
              <label>
                Username
                <input name="username" value={form.username} onChange={handleChange} placeholder="username" />
              </label>
              <label>
                Password
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="password" />
              </label>
              <button type="submit" className="auth-submit">Masuk</button>
            </form>
          )}

          <p className="auth-footnote">
            {hasAdminAccount ? "Akun yang bisa masuk adalah akun berstatus admin." : "Belum ada akun admin. Silakan buat akun pertama."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div>
            <p className="auth-eyebrow">Area Admin</p>
            <h1>{mode === "register" ? "Buat akun admin" : "Masuk ke dashboard"}</h1>
          </div>
          <p className="auth-subtitle">
            {mode === "register"
              ? "Belum ada akun admin? Daftarkan akun pertama untuk mengakses dashboard."
              : "Masuk dengan akun admin yang sudah dibuat."}
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Mode autentikasi">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setNotice("");
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setNotice("");
            }}
          >
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
              Username
              <input name="username" value={form.username} onChange={handleChange} placeholder="username" />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimal 6 karakter" />
            </label>
            <label>
              Konfirmasi password
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" />
            </label>
            <button type="submit" className="auth-submit">Daftar akun admin</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={login}>
            <label>
              Username
              <input name="username" value={form.username} onChange={handleChange} placeholder="username" />
            </label>
            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="password" />
            </label>
            <button type="submit" className="auth-submit">Masuk</button>
          </form>
        )}

        <p className="auth-footnote">
          {hasAdminAccount ? "Akun yang bisa masuk adalah akun berstatus admin." : "Belum ada akun admin. Silakan buat akun pertama."}
        </p>
      </div>
    </div>
  );
}
