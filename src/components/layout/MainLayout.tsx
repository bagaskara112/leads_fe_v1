import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/discovery": "Discovery",
  "/leads": "Leads Manager",
  "/users": "User Management",
  "/profile": "Profile",
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? "ScoutLeads";

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <Navbar collapsed={collapsed} title={title} />
      <main
        className={`main-content ${collapsed ? "main-content--collapsed" : ""}`}
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
