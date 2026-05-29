"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./admin.css";

const navItems = [
  { name: "الرئيسية", path: "/admin", icon: "📊" },
  { name: "المبيعات والطلبات", path: "/admin/orders", icon: "📦" },
  { name: "المنتجات", path: "/admin/products", icon: "🍇" },
  { name: "المخازن", path: "/admin/inventory", icon: "🏢" },
  { name: "العملاء", path: "/admin/customers", icon: "👥" },
  { name: "شركات الشحن", path: "/admin/shipping", icon: "🚚" },
  { name: "رأس المال والماليات", path: "/admin/finance", icon: "💰" },
  { name: "كوبونات الخصم", path: "/admin/coupons", icon: "🏷️" },
  { name: "الفريق", path: "/admin/team", icon: "👨‍💼" },
  { name: "سجل المراقبة", path: "/admin/audit", icon: "🛡️" },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "لوحة التحكم",
  "/admin/orders": "المبيعات والطلبات",
  "/admin/products": "المنتجات",
  "/admin/inventory": "المخازن",
  "/admin/customers": "العملاء",
  "/admin/shipping": "شركات الشحن",
  "/admin/finance": "الماليات ورأس المال",
  "/admin/coupons": "كوبونات الخصم",
  "/admin/team": "فريق العمل",
  "/admin/audit": "سجل المراقبة",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState("ALL");
  const [userRole, setUserRole] = useState("ADMIN");
  const [username, setUsername] = useState("admin");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userStr = localStorage.getItem("admin_user");

    if (!token && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (token) {
      setIsAuthenticated(true);
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUserRole(userObj.role || "ADMIN");
          setUserPermissions(userObj.permissions || "ALL");
          setUsername(userObj.username || "admin");
        } catch {
          /* ignore */
        }
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="admin-loading-screen">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍇</div>
          <p style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pageTitle =
    navItems.find((n) =>
      n.path === "/admin" ? pathname === "/admin" : pathname.startsWith(n.path)
    )?.name ||
    PAGE_TITLES[pathname] ||
    "الإدارة";

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin/login");
  };

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <div
          className="cart-drawer-overlay"
          style={{ zIndex: 150 }}
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />
      )}

      <aside
        className={`admin-sidebar glass-panel ${sidebarCollapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="admin-sidebar-brand">
          <Link href="/admin" className="admin-brand-link">
            <span className="admin-brand-icon">🍇</span>
            {!sidebarCollapsed && <span>طبيعة - الإدارة</span>}
          </Link>
          <div className="admin-sidebar-tools">
            {!sidebarCollapsed && (
              <button
                type="button"
                className="icon-btn"
                onClick={toggleDarkMode}
                title={darkMode ? "وضع فاتح" : "وضع داكن"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "توسيع" : "طي"}
            >
              {sidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            if (userRole === "MANAGER" && userPermissions !== "ALL") {
              if (item.path === "/admin/orders" && !userPermissions.includes("ORDERS"))
                return null;
              if (item.path === "/admin/products" && !userPermissions.includes("PRODUCTS"))
                return null;
              if (item.path === "/admin/inventory" && !userPermissions.includes("INVENTORY"))
                return null;
              if (item.path === "/admin/customers" && !userPermissions.includes("CUSTOMERS"))
                return null;
              if (item.path === "/admin/shipping" && !userPermissions.includes("SHIPPING"))
                return null;
              if (item.path === "/admin/finance" && !userPermissions.includes("FINANCE"))
                return null;
              if (item.path === "/admin/coupons" && !userPermissions.includes("COUPONS"))
                return null;
              if (item.path === "/admin/team" && !userPermissions.includes("TEAM"))
                return null;
              if (item.path === "/admin/audit" && !userPermissions.includes("TEAM"))
                return null;
            }

            const isActive =
              item.path === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`admin-nav-link ${isActive ? "active" : ""}`}
                title={sidebarCollapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {!sidebarCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            {!sidebarCollapsed && "تسجيل الخروج"}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              className="icon-btn admin-mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة"
            >
              ☰
            </button>
            <p className="admin-breadcrumb">
              الإدارة / <strong>{pageTitle}</strong>
            </p>
          </div>

          <div className="admin-topbar-actions">
            <Link href="/" className="admin-topbar-link" target="_blank">
              🛒 المتجر
            </Link>
            <button type="button" className="icon-btn" onClick={toggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <div className="admin-user-chip">
              <span>👤 {username}</span>
              <span className="admin-user-role">{userRole}</span>
            </div>
          </div>
        </header>

        <div className="admin-content animate-fade-in">{children}</div>
      </div>

    </div>
  );
}
