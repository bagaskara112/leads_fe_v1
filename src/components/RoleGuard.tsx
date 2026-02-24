import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useUser } from "../hooks/useUser";
import LoadingSpinner from "./ui/LoadingSpinner";

interface RoleGuardProps {
  children: ReactNode;
  role: "admin" | "user";
  fallbackPath?: string;
}

export default function RoleGuard({
  children,
  role,
  fallbackPath = "/dashboard",
}: RoleGuardProps) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <LoadingSpinner size="lg" fullPage />;
  }

  if (!user || user.role !== role) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
