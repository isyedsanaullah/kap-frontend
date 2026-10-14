// components/layout/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { useOffline } from "../../context/OfflineContext";
import { useEffect, useState } from "react";
import service from "../../api/service";

/* ── Nav data ──────────────────────────────────────────────── */
const ADMIN_MAIN = [
  { path: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { path: "/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { path: "/customers", label: "Customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { path: "/sales", label: "Sales", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/analytics", label: "Analytics", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

const ADMIN_PANEL = [
  { path: "/employees", label: "Employees", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { path: "/payment-history", label: "Payments", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { path: "/due-reminders", label: "Due Reminders", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/stock", label: "Stock", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
  { path: "/analytics/profit", label: "Profit", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { path: "/export-reports", label: "Export Reports", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
  { path: "/notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { path: "/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

const EMP_MENU = [
  { path: "/products", label: "Products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { path: "/customers", label: "Customers", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { path: "/sales", label: "Sales", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/payment-history", label: "Payments", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { path: "/due-reminders", label: "Due Reminders", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/stock", label: "Stock", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
  { path: "/notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
];

/* ── NavItem ───────────────────────────────────────────────── */
const NavItem = ({ item, active, badge }) => (
  <Link
    to={item.path}
    aria-current={active ? "page" : undefined}
    className={`
      relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
      transition-all duration-200 group
      ${active
        ? "bg-white/15 text-white shadow-sm"
        : "text-slate-300 hover:bg-white/8 hover:text-white"
      }
    `}
  >
    {active && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-full" />
    )}
    <svg className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-blue-300" : "text-slate-400 group-hover:text-slate-200"}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
    </svg>
    <span className="truncate flex-1">{item.label}</span>
    {badge > 0 && (
      <span className="ml-auto min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </Link>
);

/* ── Sidebar ───────────────────────────────────────────────── */
const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isOpen, isMobile, closeSidebar } = useSidebar();
  const { isOnline, pendingCount } = useOffline();

  useEffect(() => { if (isMobile) closeSidebar(); }, [location.pathname]);

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const mainMenu = isAdmin ? ADMIN_MAIN : EMP_MENU;
  const initials = user.name
    ? user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || "U";
  const isActive = (p) => location.pathname === p || location.pathname.startsWith(p + "/");

  const [company, setCompany] = useState(null);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await service.getCompany();
        if (res) setCompany(res);
      } catch (err) {
        console.error("Failed to load company info for sidebar", err);
      }
    };
    if (user) {
      fetchCompany();
    }
    window.addEventListener('company-updated', fetchCompany);
    return () => window.removeEventListener('company-updated', fetchCompany);
  }, [user]);

  useEffect(() => {
    service.getVersion()
      .then(v => setVersion(v))
      .catch(() => { });  // silently ignore if backend unreachable
  }, []);

  return (
    <>
      {/* ── Mobile overlay ── */}
      <div
        aria-hidden="true"
        onClick={closeSidebar}
        className={`
          fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px]
          transition-opacity duration-300 ease-in-out lg:hidden
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* ── Sidebar panel ── */}
      <aside
        id="sidebar"
        aria-label="Sidebar navigation"
        className={`
          fixed lg:static inset-y-0 left-0 top-14 z-40
          w-72 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800
          border-r border-white/5
          shadow-2xl lg:shadow-none
          will-change-transform
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Brand / Logo (Aligned with Header height with cohesive palette) ── */}
        <div className="h-14 flex items-center gap-3 px-4 flex-shrink-0 border-b border-white/10 bg-slate-950/50 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
            {company?.logo ? (
              <img src={company.logo} alt="Company Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-[11px] font-black text-white tracking-wider">KAP</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white tracking-wide truncate">
                {company?.shortcut || "KAP"}
              </h1>
              <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25 leading-none">
                PARTS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {company?.shopName || "Karachi Auto Parts"}
            </p>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scroll">

          {/* Main */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Main</p>
            <div className="space-y-0.5">
              {mainMenu.map(item => (
                <NavItem key={item.path} item={item} active={isActive(item.path)} />
              ))}
            </div>
          </div>

          {/* Admin panel */}
          {isAdmin && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Admin</p>
              <div className="space-y-0.5">
                {ADMIN_PANEL.map(item => (
                  <NavItem key={item.path} item={item} active={isActive(item.path)} />
                ))}
                {/* Drafts with pending badge */}
                <NavItem
                  item={{
                    path: '/drafts',
                    label: 'Offline Drafts',
                    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                  }}
                  active={isActive('/drafts')}
                  badge={pendingCount}
                />
              </div>
            </div>
          )}

          {/* Drafts for employees too */}
          {!isAdmin && (
            <div>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Offline</p>
              <div className="space-y-0.5">
                <NavItem
                  item={{
                    path: '/drafts',
                    label: 'Offline Drafts',
                    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
                  }}
                  active={isActive('/drafts')}
                  badge={pendingCount}
                />
              </div>
            </div>
          )}
        </nav>

        {/* ── Footer ── */}
        <div className="px-5 py-4 border-t border-white/8 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">© 2026 KAP</span>
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Online
              </span>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-900/40 border border-red-800">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                <span className="text-xs font-medium text-red-400">Offline</span>
                {pendingCount > 0 && (
                  <span className="text-xs font-bold text-red-400 bg-red-800/60 px-1.5 py-0.5 rounded-full leading-none">
                    {pendingCount}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Version badge ── */}
          {version && (
            <div
              title={`Release v${version.version || "2.9.0"} (${version.date || "Latest"})\n${version.subject || ""}`}
              className="mt-2.5 flex items-center justify-between text-xs cursor-default select-none group"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  v{version.version || "2.9.0"}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[105px]" title={version.subject}>
                  {version.subject || "Latest"}
                </span>
              </div>
              <span className="text-[10px] text-slate-600 flex-shrink-0">
                {version.date}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;