// components/layout/Header.jsx
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { useNavigate, useLocation } from "react-router-dom";
import { usePWASync } from "../../hooks/usePWASync";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/customers": "Customers",
  "/sales": "Sales",
  "/analytics": "Analytics",
  "/analytics/profit": "Profit Analytics",
  "/employees": "Employees",
  "/payment-history": "Payment History",
  "/due-reminders": "Due Reminders",
  "/export-reports": "Export Reports",
  "/notifications": "Notifications",
  "/profile": "Profile",
};

const getPageTitle = (pathname) => {
  if (pathname.includes("/sales/") && pathname.includes("/edit")) return "Edit Sale";
  if (pathname.includes("/sales/new")) return "New Sale";
  if (pathname.includes("/sales/")) return "Sale Detail";
  if (pathname.includes("/products/new")) return "Add Product";
  if (pathname.includes("/products/") && pathname.includes("/edit")) return "Edit Product";
  if (pathname.includes("/products/")) return "Product Detail";
  if (pathname.includes("/customers/") && pathname.includes("/edit")) return "Edit Customer";
  if (pathname.includes("/customers/")) return "Customer Detail";
  return PAGE_TITLES[pathname] || "KAP";
};

export default function Header() {
  const { logout, user } = useAuth();
  const { toggleSidebar, isMobile, isOpen } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, isSyncing, lastSyncedAt, pendingCount } = usePWASync();

  /* Show "Synced ✓" briefly after sync completes */
  const [showSynced, setShowSynced] = useState(false);
  useEffect(() => {
    if (lastSyncedAt) {
      setShowSynced(true);
      const t = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(t);
    }
  }, [lastSyncedAt]);

  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  /* ── dark mode ── */
  // Apply stored preference immediately on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  /* ── close user menu on outside click ── */
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "U";

  const pageTitle = getPageTitle(location.pathname);

  /* ── quick action buttons ── */
  const actions = [
    { label: "New Sale", shortLabel: "+Sale", onClick: () => navigate("/sales/new"), color: "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" },
    { label: "Add Product", shortLabel: "+Product", onClick: () => navigate("/products/new"), color: "from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700" },
    { label: "Receive ₨", shortLabel: "₨", onClick: () => navigate("/payment-history"), color: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" },
  ];

  return (
    <header className="
      sticky top-0 z-40 h-14 flex items-center justify-between
      px-3 sm:px-4 lg:px-5
      bg-white/90 dark:bg-slate-900/90 backdrop-blur-md
      border-b border-gray-200/80 dark:border-white/8
      shadow-sm
    ">

      {/* ── LEFT: hamburger + page title ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — animated 3-bar to X */}
        <button
          id="menu-button"
          onClick={toggleSidebar}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="
            relative w-9 h-9 flex flex-col items-center justify-center gap-[5px]
            rounded-xl hover:bg-gray-100 dark:hover:bg-white/10
            transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
            lg:hidden flex-shrink-0
          "
        >
          <span className={`block h-0.5 w-5 bg-gray-700 dark:bg-gray-200 rounded-full origin-center transition-all duration-300 ${isOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block h-0.5 bg-gray-700 dark:bg-gray-200 rounded-full transition-all duration-200 ${isOpen ? "w-0 opacity-0" : "w-4 opacity-100"}`} />
          <span className={`block h-0.5 w-5 bg-gray-700 dark:bg-gray-200 rounded-full origin-center transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>

        {/* Page title */}
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{pageTitle}</h2>
          <p className="hidden sm:block text-xs text-gray-400 dark:text-gray-500">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── RIGHT: actions + dark toggle + user ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Quick actions — desktop: labeled, mobile: icon only for first */}
        <div className="flex items-center gap-1">
          {actions.map((a, i) => (
            <button key={a.label} onClick={a.onClick}
              className={`
                bg-gradient-to-r ${a.color} text-white font-medium text-xs
                rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                ${i === 0
                  ? "px-3 py-1.5 flex items-center gap-1"           // always show
                  : "hidden sm:flex px-2.5 py-1.5 items-center gap-1" // hide on mobile
                }
              `}
            >
              <span className="hidden sm:inline">{a.label}</span>
              <span className="sm:hidden">{a.shortLabel}</span>
              <span className="hidden sm:inline" aria-hidden="true">›</span>
            </button>
          ))}
        </div>

        {/* ── Online / Sync status pill ───────────────────────────── */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            <span className="text-xs font-medium text-red-700 dark:text-red-300 hidden sm:inline">Offline</span>
            {pendingCount > 0 && (
              <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-200 dark:bg-red-800 px-1.5 py-0.5 rounded-full leading-none">
                {pendingCount}
              </span>
            )}
          </div>
        )}
        {isOnline && isSyncing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
            <svg className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 hidden sm:inline">Syncing…</span>
          </div>
        )}
        {isOnline && showSynced && !isSyncing && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hidden sm:inline">Synced ✓</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1" aria-hidden="true" />

        {/* Dark mode toggle */}
        <button onClick={toggleDark} aria-label="Toggle dark mode"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
          {isDark ? (
            <svg className={`w-5 h-5 text-yellow-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowUserMenu(p => !p)} aria-label="User menu"
            className="flex items-center gap-1 pl-1 pr-2 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <svg className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div className="
              absolute right-0 top-full mt-2 w-52
              bg-white dark:bg-slate-800
              border border-gray-200 dark:border-white/10
              rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30
              overflow-hidden z-50
              dropdown-menu
            ">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/8">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs capitalize font-medium">
                  {user?.role}
                </span>
              </div>
              {/* Links */}
              <div className="py-1">
                {[
                  { label: "Profile & Settings", path: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                  { label: "Notifications", path: "/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
                ].map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
              </div>
              {/* Logout */}
              <div className="border-t border-gray-100 dark:border-white/8 p-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
