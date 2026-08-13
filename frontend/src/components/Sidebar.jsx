import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "▢", perm: "dashboard.view" },
  { to: "/clients", label: "Клиенты", icon: "◔", perm: "clients.view" },
  { to: "/vehicles", label: "Транспорт", icon: "▭", perm: "vehicles.view" },
  { to: "/debts", label: "Должники", icon: "◆", perm: "debts.view" },
  { to: "/maintenance", label: "Регламентные работы", icon: "⚙", perm: "maintenance.view" },
  { to: "/branches", label: "Филиалы", icon: "◈", perm: "branches.view" },
  { to: "/admin/employees", label: "Сотрудники", icon: "◎", perm: "employees.view" },
];

export default function Sidebar() {
  const { employee, hasPermission, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 bg-navy text-white/90 flex flex-col h-screen sticky top-0 relative overflow-hidden">
      {/* ambient glow accents */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold font-display shadow-glow">
            B
          </span>
          <div className="text-lg font-semibold tracking-tight font-display brand-gradient-text">
            BezProblem
          </div>
        </div>
        <div className="text-xs text-white/50 mt-1">Внутренняя система</div>
      </div>

      <nav className="relative flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.filter((item) => hasPermission(item.perm)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 my-0.5 px-3 py-2 rounded-sm text-sm font-medium transition-all ${
                isActive
                  ? "bg-brand-gradient text-white shadow-glow"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="relative px-5 py-4 border-t border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-white/60">Тема</span>
          <ThemeToggle />
        </div>
        <div className="text-sm font-medium truncate">
          {employee?.firstName} {employee?.lastName}
        </div>
        <div className="text-xs text-white/50 truncate">{employee?.role?.label}</div>
        <button
          onClick={logout}
          className="mt-3 text-xs text-white/60 hover:text-accent transition-colors"
        >
          Выйти →
        </button>
      </div>
    </aside>
  );
}
