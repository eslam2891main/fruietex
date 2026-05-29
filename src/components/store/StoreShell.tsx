"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import StoreHeader from "./StoreHeader";
import StoreFooter from "./StoreFooter";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import { useTheme } from "./useTheme";

type StoreShellProps = {
  children: ReactNode;
  showFooter?: boolean;
};

export default function StoreShell({ children, showFooter = true }: StoreShellProps) {
  const pathname = usePathname();
  const { items } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="store-page">
      <StoreHeader
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        darkMode={darkMode}
        onToggleTheme={toggleDarkMode}
      />

      {children}

      {showFooter && <StoreFooter />}

      {/* Sticky Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link href="/" className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">الرئيسية</span>
        </Link>
        <Link href="/offers" className={`mobile-nav-item ${pathname === "/offers" ? "active" : ""}`}>
          <span className="nav-icon">🏷️</span>
          <span className="nav-label">العروض</span>
        </Link>
        <button type="button" onClick={() => setCartOpen(true)} className="mobile-nav-item">
          <span className="nav-icon">
            🛒
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </span>
          <span className="nav-label">السلة</span>
        </button>
        <Link href="/track" className={`mobile-nav-item ${pathname === "/track" ? "active" : ""}`}>
          <span className="nav-icon">📦</span>
          <span className="nav-label">تتبع الطلب</span>
        </Link>
        <Link href="/profile" className={`mobile-nav-item ${pathname === "/profile" ? "active" : ""}`}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">حسابي</span>
        </Link>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckoutOpen(true)}
      />

      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}
