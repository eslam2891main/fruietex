"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type StoreHeaderProps = {
  cartCount: number;
  onCartClick: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
};

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/offers", label: "العروض" },
  { href: "/track", label: "تتبع الطلب" },
  { href: "/about", label: "من نحن" },
];

export default function StoreHeader({
  cartCount,
  onCartClick,
  darkMode,
  onToggleTheme,
}: StoreHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="store-header glass-panel">
      <div className="container store-header-inner">
        <Link href="/" className="store-brand">
          <span className="store-brand-icon">🍇</span>
          <span className="store-brand-text">fruietex</span>
        </Link>

        <nav className={`store-nav ${menuOpen ? "open" : ""}`}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="store-header-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleTheme}
            title={darkMode ? "وضع فاتح" : "وضع داكن"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <Link href="/profile" className="store-account-link">
            <span>👤</span>
            <span className="hide-mobile">حسابي</span>
          </Link>

          <button type="button" className="btn-primary store-cart-btn" onClick={onCartClick}>
            🛒 السلة
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button
            type="button"
            className="icon-btn mobile-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="القائمة"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
    </header>
  );
}
