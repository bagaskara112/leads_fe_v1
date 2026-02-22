import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Eye, EyeOff } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !form.fullname.trim() ||
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      setError("Semua field wajib diisi");
      return;
    }

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        ...form,
        role: "user",
      });
      toast.success("Registrasi berhasil! Silakan login.");
      navigate("/login");
    } catch (err) {
      const msg = getErrorMessage(err, "Registrasi gagal");
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
          <div className="auth-card__logo-icon">
            <MapPin size={22} />
          </div>
          <span className="auth-card__logo-text">Pemetaan</span>
        </div>

        <h1 className="auth-card__title">Buat Akun Baru</h1>
        <p className="auth-card__subtitle">
          Daftar untuk mulai menggunakan platform
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
            <label className="form-label" htmlFor="fullname">
              Nama Lengkap
            </label>
            <input
              id="fullname"
              type="text"
              className="form-input"
              placeholder="Masukkan nama lengkap"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Pilih username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </div>

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
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: "44px" }}
                autoComplete="new-password"
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
            {loading ? "Memproses..." : "Daftar"}
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
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
