import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import api, { getErrorMessage } from "../services/api";
import toast from "react-hot-toast";
import { useUser } from "../hooks/useUser";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function ProfilePage() {
  const { data: user, isLoading } = useUser();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ fullname: "", email: "" });

  const updateMutation = useMutation({
    mutationFn: (payload: { fullname: string; email: string }) =>
      api.patch("/user/update", payload),
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setIsEditing(false);
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Gagal memperbarui profil")),
  });

  const displayName = user?.fullname ?? user?.full_name ?? "-";

  const startEditing = () => {
    setForm({
      fullname: user?.fullname ?? user?.full_name ?? "",
      email: user?.email ?? "",
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullname.trim() || !form.email.trim()) {
      toast.error("Semua field wajib diisi");
      return;
    }
    updateMutation.mutate(form);
  };

  if (isLoading) return <LoadingSpinner size="lg" fullPage />;

  const initials =
    displayName !== "-"
      ? displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "??";

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div className="page-header__left">
          <h1>Profile</h1>
          <p>Informasi dan pengaturan akun Anda</p>
        </div>
      </div>

      <div className="card card--glass profile-card">
        <div className="profile-card__avatar">{initials}</div>

        {!isEditing ? (
          <>
            <div className="profile-card__info">
              <h2 className="profile-card__name">{displayName}</h2>
              <p className="profile-card__role">
                <span
                  className={`badge ${user?.role === "admin" ? "badge--purple" : "badge--info"}`}
                >
                  {user?.role === "admin" ? "👑 Admin" : "👤 User"}
                </span>
              </p>
            </div>

            <div
              className="detail-list"
              style={{ maxWidth: "400px", margin: "0 auto" }}
            >
              <div className="detail-item">
                <span className="detail-item__label">Email</span>
                <span className="detail-item__value">{user?.email ?? "-"}</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "var(--space-8)" }}>
              <button className="btn btn--primary" onClick={startEditing}>
                Edit Profil
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: "400px", margin: "0 auto" }}
          >
            <div className="form-group">
              <label className="form-label" htmlFor="edit_name">
                Nama Lengkap
              </label>
              <input
                id="edit_name"
                type="text"
                className="form-input"
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit_email">
                Email
              </label>
              <input
                id="edit_email"
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--space-3)",
                justifyContent: "center",
                marginTop: "var(--space-6)",
              }}
            >
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setIsEditing(false)}
                disabled={updateMutation.isPending}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <div
                    className="spinner spinner--sm"
                    style={{ borderTopColor: "white" }}
                  />
                )}
                <Save size={16} /> Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
