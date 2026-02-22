import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface NavbarProps {
  collapsed: boolean;
  title: string;
}

export default function Navbar({ collapsed, title }: NavbarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useUser();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    queryClient.clear();
    toast.success("Berhasil logout");
    navigate("/login");
  };

  const displayName = user?.fullname ?? user?.full_name ?? "User";
  const initials =
    displayName !== "User"
      ? displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "??";

  return (
    <header className={`navbar ${collapsed ? "navbar--collapsed" : ""}`}>
      <h2 className="navbar__title">{title}</h2>
      <div className="navbar__right">
        <span className="navbar__greeting">
          Halo, <strong>{displayName}</strong>
        </span>
        <div
          className="navbar__avatar"
          onClick={() => navigate("/profile")}
          title="Profile"
        >
          {initials}
        </div>
        <button
          className="btn btn--ghost btn--icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
