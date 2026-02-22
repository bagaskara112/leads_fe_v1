import { X } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="btn btn--ghost btn--icon" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        <div className="modal__body">
          <p
            style={{ color: "var(--text-secondary)", fontSize: "var(--fs-sm)" }}
          >
            {message}
          </p>
        </div>
        <div className="modal__footer">
          <button
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn btn--${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <div className="spinner spinner--sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
