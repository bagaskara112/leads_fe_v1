import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { useUser } from "../../hooks/useUser";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/leads", icon: ClipboardList, label: "Leads" },
  { path: "/users", icon: Users, label: "Users", adminOnly: true },
  { path: "/profile", icon: UserCircle, label: "Profile" },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { data: user } = useUser();

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar__brand">
        <img
          src="/logo.png"
          alt="ScoutLeads"
          style={{ width: 32, height: 32, borderRadius: 8 }}
        />
        <span className="sidebar__brand-text">ScoutLeads</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/dashboard" &&
                location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar__nav-item ${isActive ? "sidebar__nav-item--active" : ""}`}
              >
                <Icon className="sidebar__nav-icon" size={20} />
                <span className="sidebar__nav-label">{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Toggle */}
      <div className="sidebar__footer">
        <button className="sidebar__toggle" onClick={onToggle}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
