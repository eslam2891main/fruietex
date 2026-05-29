"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StoreShell from "@/components/store/StoreShell";
import { ORDER_STATUS_AR, getEmoji } from "@/lib/product-utils";
import { useCart } from "@/context/CartContext";

type ProfileProduct = { id: string; name: string; price: number; imageUrl: string | null };
type WishlistItem = { id: string; product: ProfileProduct };
type OrderLine = { id: string; quantity: number; product: ProfileProduct };
type CustomerOrder = {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderLine[];
};
type CustomerProfile = {
  name: string;
  phone?: string;
  wishlist?: { items: WishlistItem[] } | null;
  orders: CustomerOrder[];
};

export default function ProfilePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAddToCart = (product: ProfileProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      description: "",
      icon: getEmoji(product.name),
      imageUrl: ""
    });
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("customer_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/storefront/customer", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("unauthorized");

      const data = await res.json();
      setCustomer(data);
    } catch {
      localStorage.removeItem("customer_token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    router.push("/login");
  };

  if (loading) {
    return (
      <StoreShell>
        <div className="loading-state container">
          <div className="spinner-lg" />
          <p>جاري التحميل...</p>
        </div>
      </StoreShell>
    );
  }

  if (!customer) return null;

  return (
    <StoreShell>
      <main className="container page-section profile-page" style={{ margin: "3rem auto" }}>
        <div className="profile-header glass-panel" style={{ display: "flex", flexDirection: "row", gap: "1.5rem", alignItems: "center", padding: "1.5rem 2rem", borderRadius: "var(--radius-lg)" }}>
          <div className="reviewer-avatar" style={{ width: "60px", height: "60px", fontSize: "1.6rem", flexShrink: 0 }}>
            {customer.name ? customer.name.charAt(0).toUpperCase() : "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "0.25rem" }}>مرحباً، {customer.name} 👋</h1>
            {customer.phone && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", fontFamily: "var(--font-numbers)" }} dir="ltr">
                {customer.phone}
              </p>
            )}
          </div>
          <div className="profile-header-actions" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/track" className="btn-secondary" style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--radius-full)", fontSize: "0.9rem" }}>
              🚚 تتبع الطلبات
            </Link>
            <button type="button" className="profile-logout" onClick={handleLogout} style={{ padding: "0.6rem 1.25rem", borderRadius: "var(--radius-full)", fontSize: "0.9rem", cursor: "pointer", background: "none", border: "1px solid var(--border-color)", color: "inherit", fontWeight: "600", transition: "var(--transition)" }}>
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>

        <div className="profile-grid" style={{ marginTop: "2rem" }}>
          {/* Wishlist */}
          <section className="glass-panel profile-card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.25rem" }}>❤️ المفضلة الخاصة بي</h2>
            {!customer.wishlist?.items?.length ? (
              <p className="text-muted" style={{ fontStyle: "italic", fontSize: "0.9rem" }}>لا توجد منتجات في المفضلة حالياً.</p>
            ) : (
              <ul className="profile-wishlist" style={{ display: "flex", flexDirection: "column", gap: "1rem", listStyle: "none" }}>
                {customer.wishlist.items.map((item) => (
                  <li key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.85rem", borderBottom: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span className="profile-item-emoji" style={{ fontSize: "2rem", width: "48px", height: "48px", background: "rgba(217, 119, 6, 0.05)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {getEmoji(item.product.name)}
                      </span>
                      <div>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>{item.product.name}</strong>
                        <span className="product-price" style={{ color: "var(--primary)", fontWeight: "700", fontSize: "0.85rem", fontFamily: "var(--font-numbers)" }}>{item.product.price} ج.م</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item.product)}
                      className="btn-primary"
                      style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", borderRadius: "var(--radius-full)" }}
                    >
                      🛒 إضافة
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Orders */}
          <section className="glass-panel profile-card profile-orders" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.25rem" }}>📦 سجل طلباتي</h2>
            {!customer.orders?.length ? (
              <p className="text-muted" style={{ fontStyle: "italic", fontSize: "0.9rem" }}>لم تقم بأي طلبات بعد.</p>
            ) : (
              <div className="profile-orders-list" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {customer.orders.map((order) => {
                  const st = ORDER_STATUS_AR[order.status] || {
                    label: order.status,
                    bg: "#f4f4f5",
                    color: "#52525b",
                  };
                  return (
                    <article key={order.id} className="profile-order-item" style={{ background: "rgba(0,0,0,0.01)", border: "1px solid var(--border-color)", padding: "1.25rem", borderRadius: "var(--radius-lg)" }}>
                      <div className="profile-order-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <div>
                          <strong style={{ fontSize: "0.95rem", fontFamily: "var(--font-numbers)" }}>#{order.id.slice(-8).toUpperCase()}</strong>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "var(--font-numbers)", marginTop: "0.15rem" }}>
                            {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                          </p>
                        </div>
                        <span
                          className="status-pill"
                          style={{ background: st.bg, color: st.color, padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.8rem", fontWeight: "700" }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <ul style={{ listStyle: "circle", paddingRight: "1.25rem", color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {order.items.map((item) => (
                          <li key={item.id}>
                            <span style={{ color: "var(--text-main)", fontWeight: "500" }}>{item.quantity} × {item.product.name}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="profile-order-total" style={{ textAlign: "left", fontWeight: "800", color: "var(--primary)", fontSize: "1.1rem", fontFamily: "var(--font-numbers)", borderTop: "1px dashed var(--border-color)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                        {order.totalAmount} ج.م
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </StoreShell>
  );
}
