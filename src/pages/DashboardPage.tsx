import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  ClipboardList,
  ArrowRight,
  FileDown,
  Loader2,
  Eye,
  X,
  Trash2,
  RefreshCw,
  Star,
  MapPin,
  Building2,
} from "lucide-react";
import api, {
  getErrorMessage,
  unwrapArray,
  getUserRole,
} from "../services/api";
import { useUser } from "../hooks/useUser";
import StatCard from "../components/ui/StatCard";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import toast from "react-hot-toast";
import type { CleanLead, RawResponse, User, GooglePlaceResult } from "../types";

const formatDate = (date: string | undefined) =>
  date
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const getRatingClass = (r: number) =>
  r >= 4 ? "rating--high" : r >= 3 ? "rating--mid" : "rating--low";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUser();
  const isAdmin = currentUser?.role === "admin" || getUserRole() === "admin";

  const [keyword, setKeyword] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewResponse, setViewResponse] = useState<RawResponse | null>(null);

  const { data: allLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data } = await api.get("/response_clean/");
      return unwrapArray<CleanLead>(data);
    },
  });

  const { data: allResponses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ["responses"],
    queryFn: async () => {
      const { data } = await api.get("/response/all");
      return unwrapArray<RawResponse>(data);
    },
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/user/all");
      return unwrapArray<User>(data);
    },
    enabled: isAdmin,
  });

  const searchMutation = useMutation({
    mutationFn: (prompt: string) => api.post("/response/create", { prompt }),
    onSuccess: () => {
      toast.success(
        "Pencarian berhasil! Data otomatis masuk ke halaman Leads.",
      );
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setKeyword("");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Pencarian gagal")),
  });

  const generateCleanMutation = useMutation({
    mutationFn: (responseId: string) =>
      api.post(`/response_clean/clean/${responseId}`),
    onSuccess: () => {
      toast.success(
        "Generate clean berhasil! Data telah dipindahkan ke Leads.",
      );
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal generate clean")),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => api.delete(`/response/delete/${uuid}`),
    onSuccess: () => {
      toast.success("Data pencarian berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["responses"] });
      setDeleteId(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal menghapus")),
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.error("Masukkan keyword pencarian");
      return;
    }
    searchMutation.mutate(keyword.trim());
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/response_clean/export/csv`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Export gagal");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File CSV berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh CSV");
    }
  };

  const sortedResponses = [...allResponses].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime(),
  );

  const isLoading =
    leadsLoading || responsesLoading || (isAdmin && usersLoading);

  const viewResults: GooglePlaceResult[] =
    viewResponse?.response?.results ?? [];

  if (isLoading) return <LoadingSpinner size="lg" fullPage />;

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__left">
          <h1>Dashboard</h1>
          <p>
            {isAdmin
              ? "Ringkasan aktivitas, cari prospek, & kelola riwayat"
              : "Ringkasan aktivitas & riwayat pencarian"}
          </p>
        </div>
        <div className="page-header__actions"></div>
      </div>

      {/* ─── Stat Cards ──────────────────────────────────── */}
      <div className="stat-cards stagger-children">
        <StatCard
          icon={<ClipboardList size={22} />}
          label="Total Leads"
          value={allLeads.length}
          color="purple"
        />
        <StatCard
          icon={<Search size={22} />}
          label="Total Pencarian"
          value={allResponses.length}
          color="teal"
        />
        {isAdmin && (
          <StatCard
            icon={<Users size={22} />}
            label="Total Users"
            value={allUsers.length}
            color="orange"
          />
        )}
      </div>

      {/* ─── Quick Actions ───────────────────────────────── */}
      <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: "var(--space-5)" }}>
        Aksi Cepat
      </h2>
      <div className="quick-actions stagger-children">
        <Link to="/leads" className="quick-action">
          <div className="quick-action__icon stat-card__icon--purple">
            <ClipboardList size={20} />
          </div>
          <div>
            <div className="quick-action__label">Kelola Leads</div>
            <div className="quick-action__desc">
              Lihat dan edit data prospek
            </div>
          </div>
          <ArrowRight
            size={16}
            style={{ marginLeft: "auto", color: "var(--text-tertiary)" }}
          />
        </Link>

        {isAdmin && (
          <button
            className="quick-action"
            onClick={handleExport}
            style={{ cursor: "pointer", textAlign: "left" }}
          >
            <div className="quick-action__icon stat-card__icon--orange">
              <FileDown size={20} />
            </div>
            <div>
              <div className="quick-action__label">Export CSV</div>
              <div className="quick-action__desc">Unduh seluruh data leads</div>
            </div>
            <ArrowRight
              size={16}
              style={{ marginLeft: "auto", color: "var(--text-tertiary)" }}
            />
          </button>
        )}
      </div>

      {/* ─── Search Form (Admin only) ────────────────────── */}
      {isAdmin && (
        <>
          <h2
            style={{
              fontSize: "var(--fs-lg)",
              marginBottom: "var(--space-4)",
              marginTop: "var(--space-8)",
            }}
          >
            🔍 Cari Prospek Bisnis
          </h2>
          <form className="search-section" onSubmit={handleSearch}>
            <input
              type="text"
              className="form-input"
              placeholder='Masukkan keyword pencarian, mis: "toko di blitar"'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={searchMutation.isPending}
            />
            <button
              type="submit"
              className="btn btn--primary btn--lg"
              disabled={searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <Loader2
                  size={18}
                  style={{ animation: "spin 0.6s linear infinite" }}
                />
              ) : (
                <Search size={18} />
              )}
              {searchMutation.isPending ? "Mencari..." : "Cari Bisnis"}
            </button>
          </form>
        </>
      )}

      {/* ─── Info Banner ─────────────────────────────────── */}
      <div
        className="card card--glass"
        style={{
          marginTop: "var(--space-6)",
          marginBottom: "var(--space-6)",
          padding: "var(--space-4)",
          borderLeft: "4px solid var(--accent-info)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--fs-sm)",
            color: "var(--text-secondary)",
          }}
        >
          💡 <strong>Cara kerja:</strong> Setelah Admin mencari keyword, data
          otomatis masuk ke halaman <strong>Leads</strong>. Jika data gagal
          masuk otomatis, gunakan tombol <strong>"Generate Clean"</strong>{" "}
          sebagai fallback. Klik pada riwayat pencarian untuk melihat detail.
        </p>
      </div>

      {/* ─── Search History ──────────────────────────────── */}
      <h2 style={{ fontSize: "var(--fs-lg)", marginBottom: "var(--space-5)" }}>
        📋 Riwayat Pencarian
      </h2>

      {sortedResponses.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state__icon" />
          <p className="empty-state__title">Belum ada pencarian</p>
          <p className="empty-state__desc">
            {isAdmin
              ? "Mulai dengan memasukkan keyword di atas untuk mencari prospek bisnis"
              : "Admin belum melakukan pencarian data"}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Jumlah Hasil</th>
                <th>Tanggal</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedResponses.map((entry) => {
                const resultCount = entry.response?.results?.length ?? 0;
                return (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.prompt}</strong>
                    </td>
                    <td>
                      <span className="badge badge--info">
                        {resultCount} hasil
                      </span>
                    </td>
                    <td
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--fs-xs)",
                      }}
                    >
                      {formatDate(entry.created_at)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-2)",
                          justifyContent: "flex-end",
                        }}
                      >
                        {/* View Detail */}
                        <button
                          className="btn btn--ghost btn--icon"
                          title="Lihat Detail"
                          onClick={() => setViewResponse(entry)}
                        >
                          <Eye size={16} />
                        </button>

                        {/* Generate Clean Manual (Fallback) */}
                        <button
                          className="btn btn--warning btn--sm"
                          title="Generate Clean Manual (Fallback)"
                          disabled={generateCleanMutation.isPending}
                          onClick={() => generateCleanMutation.mutate(entry.id)}
                        >
                          {generateCleanMutation.isPending ? (
                            <Loader2
                              size={14}
                              style={{
                                animation: "spin 0.6s linear infinite",
                              }}
                            />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          Generate Clean
                        </button>

                        {/* Delete (Admin only) */}
                        {isAdmin && (
                          <button
                            className="btn btn--ghost btn--icon"
                            title="Hapus"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Trash2
                              size={16}
                              style={{ color: "var(--accent-danger)" }}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Detail Modal ────────────────────────────────── */}
      {viewResponse && (
        <div className="modal-overlay" onClick={() => setViewResponse(null)}>
          <div
            className="modal"
            style={{ maxWidth: "900px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <div>
                <h3 className="modal__title">Detail Pencarian</h3>
                <p
                  style={{
                    margin: "var(--space-1) 0 0",
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Keyword: <strong>"{viewResponse.prompt}"</strong> —{" "}
                  {viewResults.length} hasil ditemukan —{" "}
                  {formatDate(viewResponse.created_at)}
                </p>
              </div>
              <button
                className="btn btn--ghost btn--icon"
                onClick={() => setViewResponse(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              {/* Summary banner */}
              <div
                style={{
                  marginBottom: "var(--space-4)",
                  padding: "var(--space-3)",
                  background: "rgba(0, 212, 170, 0.08)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(0, 212, 170, 0.2)",
                  display: "flex",
                  gap: "var(--space-4)",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  📊 Total: <strong>{viewResults.length}</strong>
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  ⭐ Rating rata-rata:{" "}
                  <strong>
                    {viewResults.length > 0
                      ? (
                          viewResults.reduce(
                            (sum, r) => sum + (r.rating ?? 0),
                            0,
                          ) / viewResults.length
                        ).toFixed(1)
                      : "-"}
                  </strong>
                </span>
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--text-secondary)",
                  }}
                >
                  🏢 Operasional:{" "}
                  <strong>
                    {
                      viewResults.filter(
                        (r) => r.business_status === "OPERATIONAL",
                      ).length
                    }
                  </strong>
                </span>
              </div>

              {viewResults.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "var(--fs-sm)",
                    textAlign: "center",
                    padding: "var(--space-8)",
                  }}
                >
                  Tidak ada data ditemukan.
                </p>
              ) : (
                <div
                  className="table-container"
                  style={{ maxHeight: "60vh", overflow: "auto" }}
                >
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>Nama Bisnis</th>
                        <th>Alamat</th>
                        <th>Rating</th>
                        <th>Reviews</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewResults.map(
                        (place: GooglePlaceResult, idx: number) => {
                          const rating = place.rating ?? 0;
                          return (
                            <tr key={place.place_id ?? idx}>
                              <td
                                style={{
                                  color: "var(--text-tertiary)",
                                  fontSize: "var(--fs-xs)",
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--space-2)",
                                  }}
                                >
                                  <Building2
                                    size={14}
                                    style={{
                                      flexShrink: 0,
                                      color: "var(--accent-primary)",
                                    }}
                                  />
                                  <strong
                                    className="text-truncate"
                                    style={{
                                      maxWidth: "200px",
                                      display: "block",
                                    }}
                                  >
                                    {place.name ?? "-"}
                                  </strong>
                                </div>
                                {place.types && place.types.length > 0 && (
                                  <span
                                    style={{
                                      fontSize: "var(--fs-xs)",
                                      color: "var(--text-tertiary)",
                                      marginLeft: "22px",
                                    }}
                                  >
                                    {place.types
                                      .filter(
                                        (t) =>
                                          t !== "establishment" &&
                                          t !== "point_of_interest",
                                      )
                                      .join(", ")}
                                  </span>
                                )}
                              </td>
                              <td>
                                <span
                                  className="text-truncate"
                                  style={{
                                    maxWidth: "220px",
                                    display: "block",
                                    fontSize: "var(--fs-xs)",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  <MapPin
                                    size={12}
                                    style={{
                                      display: "inline",
                                      marginRight: "4px",
                                      verticalAlign: "middle",
                                    }}
                                  />
                                  {place.formatted_address ?? "-"}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`rating ${getRatingClass(rating)}`}
                                >
                                  <Star
                                    size={12}
                                    style={{
                                      fill: "currentColor",
                                      marginRight: "2px",
                                    }}
                                  />
                                  {rating > 0 ? rating.toFixed(1) : "-"}
                                </span>
                              </td>
                              <td
                                style={{
                                  fontSize: "var(--fs-xs)",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {place.user_ratings_total ?? 0}
                              </td>
                              <td>
                                <span
                                  className={`badge ${place.business_status === "OPERATIONAL" ? "badge--success" : "badge--warning"}`}
                                >
                                  {place.business_status === "OPERATIONAL"
                                    ? "✅ Aktif"
                                    : (place.business_status ?? "-")}
                                </span>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                onClick={() => setViewResponse(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Hapus Data Pencarian"
        message="Yakin ingin menghapus data pencarian ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
