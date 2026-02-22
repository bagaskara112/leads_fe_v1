import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  color: "purple" | "teal" | "orange";
}

export default function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-card__gradient stat-card__gradient--${color}`} />
      <div className={`stat-card__icon stat-card__icon--${color}`}>{icon}</div>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </div>
  );
}
