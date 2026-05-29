"use client";

import { ReactNode, useState } from "react";
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

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => setCheckoutOpen(true)}
      />

      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </div>
  );
}
