import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      const token = data?.data?.access_token;
      if (token) {
        localStorage.setItem("token", token);
        if (data?.data?.refresh_token) {
          localStorage.setItem("refresh_token", data.data.refresh_token);
        }
        toast.success("Login berhasil!");
        navigate("/dashboard");
      } else {
        setError("Token tidak ditemukan dalam response");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Login gagal");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-card__logo">
          <img
            src="/logo.png"
            alt="ScoutLeads"
            style={{ width: 36, height: 36, borderRadius: 8 }}
          />
          <span className="auth-card__logo-text">ScoutLeads</span>
        </div>

        <h1 className="auth-card__title">Selamat Datang</h1>
        <p className="auth-card__subtitle">
          Masuk ke akun untuk mulai mengelola prospek bisnis
        </p>

        {error && (
          <div
            className="badge badge--danger"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "var(--space-3)",
              marginBottom: "var(--space-4)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Masukkan email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Masukkan password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: "44px" }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg"
            disabled={loading}
            style={{ marginTop: "var(--space-4)" }}
          >
            {loading && (
              <div
                className="spinner spinner--sm"
                style={{ borderTopColor: "white" }}
              />
            )}
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "var(--space-6)",
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
          }}
        >
          Belum punya akun? <Link to="/register">Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}
