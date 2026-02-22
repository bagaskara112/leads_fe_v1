import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Eye,
  X,
  Download,
  Search,
  Star,
  Filter,
  Phone,
  MessageCircle,
  Loader2,
} from "lucide-react";
import api, {
  getErrorMessage,
  unwrapArray,
  getUserRole,
} from "../services/api";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ConfirmModal from "../components/ui/ConfirmModal";
import type { CleanLead, UpdateLeadPayload } from "../types";

// ─── Helpers ──────────────────────────────────────────────

/** Parse rating — API returns string like "4.30" */
const parseRating = (r: string | number | undefined): number => {
  if (r === undefined || r === null) return 0;
  const n = typeof r === "string" ? parseFloat(r) : r;
  return isNaN(n) ? 0 : n;
};

const getRatingClass = (r: number) =>
  r >= 4 ? "rating--high" : r >= 3 ? "rating--mid" : "rating--low";

const getLeadName = (lead: CleanLead): string =>
  lead.place_name ?? lead.name ?? "-";

const getLeadAddress = (lead: CleanLead): string =>
  lead.format_address?.formatted_address ?? lead.address ?? "-";

/** Get phone number from nested formatted_phone_number object */
const getLeadPhone = (lead: CleanLead): string | null =>
  lead.formatted_phone_number?.formatted_phone_number ?? null;

/** Get WA link from other_data */
const getWaLink = (lead: CleanLead): string | null =>
  lead.other_data?.wa_link ?? null;

const getLeadTypes = (lead: CleanLead): string =>
  lead.categorical ?? lead.types ?? "";

const getLeadKey = (lead: CleanLead): string => lead.id ?? lead.uuid ?? "";

/** Check if lead has been enriched (has phone data or is_wa_active != checking) */
const isEnriched = (lead: CleanLead): boolean =>
  lead.is_wa_active !== "checking" && lead.is_wa_active !== undefined;

/** Map WA status string to display */
const waStatusConfig = (status: string | undefined) => {
  switch (status) {
    case "active":
      return { label: "WA Aktif", badge: "badge--success", icon: "✅" };
    case "non-active":
      return { label: "Tidak Aktif", badge: "badge--danger", icon: "❌" };
    default:
      return { label: "Checking", badge: "badge--warning", icon: "⏳" };
  }
};

/** Map propose status */
const proposeStatusLabel = (status: string | undefined): string => {
  if (status === "yes" || status === "true") return "Sudah Propose";
  if (status === "pending") return "Pending";
  return "Belum";
};

// ─── Component ────────────────────────────────────────────

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const isAdmin = getUserRole() === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [waFilter, setWaFilter] = useState("all");
  const [proposeFilter, setProposeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<CleanLead | null>(null);
  const [viewLead, setViewLead] = useState<CleanLead | null>(null);
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());

  // Wajib 8: GET /response_clean/
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data } = await api.get("/response_clean/");
      return unwrapArray<CleanLead>(data);
    },
  });

  // Wajib 4: GET /response_clean/place/{{place_id}} — detail lead
  const { data: detailLead, isLoading: detailLoading } = useQuery({
    queryKey: ["lead-detail", viewLead?.place_id],
    queryFn: async () => {
      const { data } = await api.get(
        `/response_clean/place/${viewLead!.place_id}`,
      );
      return (data.data ?? data) as CleanLead;
    },
    enabled: !!viewLead?.place_id,
  });

  // Wajib 3: PATCH /response_clean/place/{{place_id}}
  const updateMutation = useMutation({
    mutationFn: async ({
      lead,
      payload,
    }: {
      lead: CleanLead;
      payload: UpdateLeadPayload;
    }) => {
      if (!lead.place_id) throw new Error("place_id tidak ditemukan");
      await api.patch(`/response_clean/place/${lead.place_id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Data berhasil diperbarui");
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Gagal memperbarui data")),
  });

  // Wajib 6: DELETE /response_clean/place/{{place_id}}
  const deleteMutation = useMutation({
    mutationFn: (lead: CleanLead) => {
      if (!lead.place_id) throw new Error("place_id tidak ditemukan");
      return api.delete(`/response_clean/place/${lead.place_id}`);
    },
    onSuccess: () => {
      toast.success("Lead berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Gagal menghapus")),
  });

  // Tahap 2: PUT /response_clean/detail/{{place_id}} — Enrichment (Cari Kontak)
  const enrichMutation = useMutation({
    mutationFn: async (lead: CleanLead) => {
      if (!lead.place_id) throw new Error("place_id tidak ditemukan");
      await api.put(`/response_clean/detail/${lead.place_id}`);
    },
    onMutate: (lead) => {
      setEnrichingIds((prev) => new Set(prev).add(getLeadKey(lead)));
    },
    onSuccess: (_data, lead) => {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(getLeadKey(lead));
        return next;
      });
      toast.success(
        `Kontak "${getLeadName(lead)}" berhasil diambil dari Google!`,
      );
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err, lead) => {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(getLeadKey(lead));
        return next;
      });
      toast.error(getErrorMessage(err, "Gagal mengambil kontak"));
    },
  });

  const handleUpdate = useCallback(
    (lead: CleanLead, payload: UpdateLeadPayload) =>
      updateMutation.mutate({ lead, payload }),
    [updateMutation],
  );

  // Wajib 5: Export CSV (Admin only)
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

  // ─── Stats Summary ───────────────────────────────────────
  const stats = useMemo(() => {
    let waActive = 0;
    let waChecking = 0;
    let waNonActive = 0;
    let proposed = 0;
    let withPhone = 0;

    leads.forEach((lead) => {
      const wa = lead.is_wa_active;
      if (wa === "active") waActive++;
      else if (wa === "non-active") waNonActive++;
      else waChecking++;

      if (lead.is_propose === "yes" || lead.is_propose === "true") proposed++;
      if (getLeadPhone(lead)) withPhone++;
    });
    return { waActive, waChecking, waNonActive, proposed, withPhone };
  }, [leads]);

  // ─── Filtering ────────────────────────────────────────────
  const filtered = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    const phone = getLeadPhone(lead) ?? "";
    const matchSearch =
      !term ||
      getLeadName(lead).toLowerCase().includes(term) ||
      getLeadAddress(lead).toLowerCase().includes(term) ||
      phone.includes(term);

    const rating = parseRating(lead.rating);
    const matchRating =
      ratingFilter === "all" ||
      (ratingFilter === "4+" && rating >= 4) ||
      (ratingFilter === "3+" && rating >= 3) ||
      (ratingFilter === "<3" && rating < 3);

    const wa = lead.is_wa_active;
    const matchWa =
      waFilter === "all" ||
      (waFilter === "active" && wa === "active") ||
      (waFilter === "checking" && (!wa || wa === "checking")) ||
      (waFilter === "non-active" && wa === "non-active");

    const prop = lead.is_propose;
    const matchPropose =
      proposeFilter === "all" ||
      (proposeFilter === "yes" && (prop === "yes" || prop === "true")) ||
      (proposeFilter === "no" &&
        (!prop || prop === "no" || prop === "false" || prop === "checking")) ||
      (proposeFilter === "pending" && prop === "pending");

    return matchSearch && matchRating && matchWa && matchPropose;
  });

  if (isLoading) return <LoadingSpinner size="lg" fullPage />;

  // Use fetched detail or selected lead for modal
  const displayLead = detailLead ?? viewLead;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div className="page-header__left">
          <h1>Leads Manager</h1>
          <p>
            Data prospek yang sudah diproses — klik "Cari Kontak" untuk
            mengambil nomor telepon
          </p>
        </div>
        <div className="page-header__actions">
          {isAdmin && (
            <button className="btn btn--success" onClick={handleExport}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div
          className="badge badge--info"
          style={{
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--fs-sm)",
          }}
        >
          📊 Total: {leads.length}
        </div>
        <div
          className="badge badge--success"
          style={{
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--fs-sm)",
          }}
        >
          ✅ WA Aktif: {stats.waActive}
        </div>
        <div
          className="badge badge--warning"
          style={{
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--fs-sm)",
          }}
        >
          ⏳ Belum Dicek: {stats.waChecking}
        </div>
        <div
          className="badge badge--danger"
          style={{
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--fs-sm)",
          }}
        >
          ❌ WA Non-Aktif: {stats.waNonActive}
        </div>
        <div
          className="badge badge--purple"
          style={{
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--fs-sm)",
          }}
        >
          📞 Ada Telepon: {stats.withPhone}
        </div>
        <div
          className="badge badge--info"
          style={{
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--fs-sm)",
          }}
        >
          🤝 Proposed: {stats.proposed}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Cari nama, alamat, telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Star size={14} style={{ color: "var(--text-tertiary)" }} />
          <select
            className="form-select"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">Semua Rating</option>
            <option value="4+">Rating ≥ 4.0</option>
            <option value="3+">Rating ≥ 3.0</option>
            <option value="<3">Rating &lt; 3.0</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Phone size={14} style={{ color: "var(--text-tertiary)" }} />
          <select
            className="form-select"
            value={waFilter}
            onChange={(e) => setWaFilter(e.target.value)}
          >
            <option value="all">Semua Status WA</option>
            <option value="active">✅ WA Aktif</option>
            <option value="non-active">❌ WA Non-Aktif</option>
            <option value="checking">⏳ Belum Dicek</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
          }}
        >
          <Filter size={14} style={{ color: "var(--text-tertiary)" }} />
          <select
            className="form-select"
            value={proposeFilter}
            onChange={(e) => setProposeFilter(e.target.value)}
          >
            <option value="all">Semua Propose</option>
            <option value="yes">Sudah Propose</option>
            <option value="pending">Pending</option>
            <option value="no">Belum Propose</option>
          </select>
        </div>

        <span className="badge badge--purple">
          {filtered.length} dari {leads.length}
        </span>
      </div>

      {/* Leads Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state__icon" />
          <p className="empty-state__title">Tidak ada leads ditemukan</p>
          <p className="empty-state__desc">
            {leads.length === 0
              ? "Belum ada data. Admin perlu melakukan pencarian terlebih dahulu."
              : "Coba ubah filter untuk melihat data lainnya"}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Bisnis</th>
                <th>Alamat</th>
                <th>Rating</th>
                <th>Telepon</th>
                <th>Status WA</th>
                <th>Propose</th>
                <th>Catatan</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const rating = parseRating(lead.rating);
                const phone = getLeadPhone(lead);
                const waLink = getWaLink(lead);
                const waStatus = waStatusConfig(lead.is_wa_active);
                const enriched = isEnriched(lead);
                const isEnriching = enrichingIds.has(getLeadKey(lead));

                return (
                  <tr key={getLeadKey(lead)}>
                    {/* Nama */}
                    <td>
                      <strong
                        className="text-truncate"
                        style={{ maxWidth: "160px", display: "block" }}
                      >
                        {getLeadName(lead)}
                      </strong>
                      <span
                        style={{
                          fontSize: "var(--fs-xs)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {getLeadTypes(lead)}
                      </span>
                    </td>

                    {/* Alamat */}
                    <td>
                      <span
                        className="text-truncate"
                        style={{
                          maxWidth: "180px",
                          display: "block",
                          fontSize: "var(--fs-xs)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {getLeadAddress(lead)}
                      </span>
                    </td>

                    {/* Rating */}
                    <td>
                      <span className={`rating ${getRatingClass(rating)}`}>
                        ★ {rating > 0 ? rating.toFixed(1) : "-"}
                      </span>
                    </td>

                    {/* Telepon */}
                    <td style={{ fontSize: "var(--fs-xs)" }}>
                      {phone ?? (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>

                    {/* Status WA — read-only badge from backend */}
                    <td>
                      <span className={`badge ${waStatus.badge}`}>
                        {waStatus.icon} {waStatus.label}
                      </span>
                    </td>

                    {/* Status Propose — editable dropdown */}
                    <td>
                      <select
                        className="form-select"
                        value={lead.is_propose ?? "checking"}
                        onChange={(e) =>
                          handleUpdate(lead, { is_propose: e.target.value })
                        }
                        style={{ fontSize: "var(--fs-xs)", minWidth: "100px" }}
                      >
                        <option value="checking">Checking</option>
                        <option value="no">Belum</option>
                        <option value="pending">Pending</option>
                        <option value="yes">Sudah</option>
                      </select>
                    </td>

                    {/* Catatan */}
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{
                          fontSize: "var(--fs-xs)",
                          padding: "var(--space-1) var(--space-2)",
                          minWidth: "120px",
                        }}
                        placeholder="Tambah catatan..."
                        defaultValue={lead.description ?? ""}
                        onBlur={(e) => {
                          if (e.target.value !== (lead.description ?? ""))
                            handleUpdate(lead, {
                              description: e.target.value,
                            });
                        }}
                      />
                    </td>

                    {/* Aksi */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-2)",
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Cari Kontak — only if not enriched yet */}
                        {!enriched && (
                          <button
                            className="btn btn--primary btn--sm"
                            title="Cari Kontak dari Google"
                            disabled={isEnriching}
                            onClick={() => enrichMutation.mutate(lead)}
                          >
                            {isEnriching ? (
                              <Loader2
                                size={14}
                                style={{
                                  animation: "spin 0.6s linear infinite",
                                }}
                              />
                            ) : (
                              <Phone size={14} />
                            )}
                            {isEnriching ? "Mencari..." : "Cari Kontak"}
                          </button>
                        )}

                        {/* Chat WA — only if wa_link exists */}
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn--success btn--sm"
                            title="Chat via WhatsApp"
                          >
                            <MessageCircle size={14} /> Chat WA
                          </a>
                        )}

                        <button
                          className="btn btn--ghost btn--icon"
                          title="Detail"
                          onClick={() => setViewLead(lead)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn--ghost btn--icon"
                          title="Hapus"
                          onClick={() => setDeleteTarget(lead)}
                        >
                          <Trash2
                            size={16}
                            style={{ color: "var(--accent-danger)" }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal — Wajib 4 */}
      {viewLead && (
        <div className="modal-overlay" onClick={() => setViewLead(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Detail Lead</h3>
              <button
                className="btn btn--ghost btn--icon"
                onClick={() => setViewLead(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal__body">
              {detailLoading ? (
                <LoadingSpinner size="md" fullPage />
              ) : displayLead ? (
                <div className="detail-list">
                  {(
                    [
                      ["Nama Bisnis", getLeadName(displayLead)],
                      ["Alamat", getLeadAddress(displayLead)],
                      ["Telepon", getLeadPhone(displayLead) ?? "-"],
                      ["Kategori", getLeadTypes(displayLead)],
                      ["Status Bisnis", displayLead.business_status],
                      ["Place ID", displayLead.place_id],
                    ] as const
                  ).map(([label, value]) => (
                    <div className="detail-item" key={label}>
                      <span className="detail-item__label">{label}</span>
                      <span className="detail-item__value">{value ?? "-"}</span>
                    </div>
                  ))}

                  {/* Website from other_data */}
                  <div className="detail-item">
                    <span className="detail-item__label">Website</span>
                    <span className="detail-item__value">
                      {displayLead.other_data?.website ? (
                        <a
                          href={displayLead.other_data.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {displayLead.other_data.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>

                  {/* Google Maps link */}
                  {displayLead.other_data?.url && (
                    <div className="detail-item">
                      <span className="detail-item__label">Google Maps</span>
                      <span className="detail-item__value">
                        <a
                          href={displayLead.other_data.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Buka di Maps ↗
                        </a>
                      </span>
                    </div>
                  )}

                  <div className="detail-item">
                    <span className="detail-item__label">Rating</span>
                    <span className="detail-item__value">
                      {(() => {
                        const r = parseRating(displayLead.rating);
                        const reviews = displayLead.user_rating_total ?? 0;
                        return (
                          <span className={`rating ${getRatingClass(r)}`}>
                            ★ {r > 0 ? r.toFixed(1) : "-"} ({reviews} ulasan)
                          </span>
                        );
                      })()}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-item__label">Status WhatsApp</span>
                    <span className="detail-item__value">
                      {(() => {
                        const ws = waStatusConfig(displayLead.is_wa_active);
                        return (
                          <span className={`badge ${ws.badge}`}>
                            {ws.icon} {ws.label}
                          </span>
                        );
                      })()}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-item__label">Status Propose</span>
                    <span className="detail-item__value">
                      {proposeStatusLabel(displayLead.is_propose)}
                    </span>
                  </div>

                  {displayLead.description && (
                    <div className="detail-item">
                      <span className="detail-item__label">Catatan</span>
                      <span className="detail-item__value">
                        {displayLead.description}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: "var(--text-secondary)" }}>
                  Data tidak tersedia.
                </p>
              )}
            </div>
            <div className="modal__footer">
              {displayLead &&
                (() => {
                  const wl = getWaLink(displayLead);
                  return wl ? (
                    <a
                      href={wl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--success"
                    >
                      <MessageCircle size={16} /> Chat WA
                    </a>
                  ) : null;
                })()}
              <button
                className="btn btn--secondary"
                onClick={() => setViewLead(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Lead"
        message={`Yakin ingin menghapus "${deleteTarget ? getLeadName(deleteTarget) : ""}"? Tindakan ini tidak dapat dibatalkan.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
