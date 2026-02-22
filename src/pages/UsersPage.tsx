import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Shield, UserCircle } from "lucide-react";
import api, { getErrorMessage, unwrapArray } from "../services/api";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useUser } from "../hooks/useUser";
import type { User } from "../types";

const getDisplayName = (user: User) =>
  user.fullname ?? user.full_name ?? "User";

const getInitials = (user: User) => {
  const name = getDisplayName(user);
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  );
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUser();
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // All hooks must be called before any early return
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/user/all");
      return unwrapArray<User>(data);
    },
    enabled: currentUser?.role === "admin",
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/user/delete/${userId}`),
    onSuccess: () => {
      toast.success("User berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteUser(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal menghapus user")),
  });

  // Check admin access AFTER all hooks
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="empty-state">
        <Shield className="empty-state__icon" />
        <p className="empty-state__title">Akses Ditolak</p>
        <p className="empty-state__desc">
          Halaman ini hanya dapat diakses oleh Admin.
        </p>
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner size="lg" fullPage />;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div className="page-header__left">
          <h1>User Management</h1>
          <p>Kelola pengguna yang terdaftar di sistem</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <UserCircle className="empty-state__icon" />
          <p className="empty-state__title">Belum ada pengguna</p>
          <p className="empty-state__desc">
            Belum ada pengguna yang terdaftar di sistem.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tanggal Daftar</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id ?? user.user_id}>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                      }}
                    >
                      <div
                        className="navbar__avatar"
                        style={{
                          width: "32px",
                          height: "32px",
                          fontSize: "var(--fs-xs)",
                        }}
                      >
                        {getInitials(user)}
                      </div>
                      <strong>{getDisplayName(user)}</strong>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {user.email}
                  </td>
                  <td>
                    <span
                      className={`badge ${user.role === "admin" ? "badge--purple" : "badge--info"}`}
                    >
                      {user.role === "admin" ? "👑 Admin" : "👤 Sales"}
                    </span>
                  </td>
                  <td
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--fs-xs)",
                    }}
                  >
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {user.id !== currentUser?.id && (
                      <button
                        className="btn btn--ghost btn--icon"
                        title="Hapus user"
                        onClick={() => setDeleteUser(user)}
                      >
                        <Trash2
                          size={16}
                          style={{ color: "var(--accent-danger)" }}
                        />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteUser}
        title="Hapus User"
        message={`Yakin ingin menghapus user "${deleteUser ? getDisplayName(deleteUser) : ""}"? Tindakan ini tidak dapat dibatalkan.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deleteUser &&
          deleteMutation.mutate(deleteUser.id ?? deleteUser.user_id ?? "")
        }
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}
