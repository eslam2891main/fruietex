"use client";

import { useState } from "react";
import StoreShell from "@/components/store/StoreShell";
import { ORDER_STATUS_AR, PAYMENT_LABELS } from "@/lib/product-utils";

type TrackOrder = {
  id: string;
  status: string;
  totalAmount: number;
  shippingCost: number;
  paymentMethod: string;
  createdAt: string;
  customerAddress: string | null;
  governorate?: { name: string } | null;
  shippingCompany?: { name: string } | null;
  coupon?: { code: string } | null;
  items: { quantity: number; product: { name: string } }[];
};

export default function TrackPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<TrackOrder[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/storefront/orders/track?phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل البحث");
      setOrders(data.orders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreShell>
      <main className="container page-section">
        <div className="page-hero-sm">
          <h1>📦 تتبع طلبك</h1>
          <p>أدخل رقم الهاتف المستخدم عند الطلب لعرض حالة الشحن والتجهيز</p>
        </div>

        <form onSubmit={handleSearch} className="track-form glass-panel">
          <label htmlFor="phone">رقم الهاتف</label>
          <div className="track-form-row">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
              required
              dir="ltr"
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "جاري البحث..." : "بحث"}
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {searched && !loading && !error && orders.length === 0 && (
          <div className="empty-state">
            <span>🔍</span>
            <p>لا توجد طلبات مرتبطة بهذا الرقم</p>
          </div>
        )}

        <div className="track-orders-list">
          {orders.map((order) => {
            const st = ORDER_STATUS_AR[order.status] || {
              label: order.status,
              bg: "#f4f4f5",
              color: "#52525b",
            };
            return (
              <article key={order.id} className="track-order-card glass-panel">
                <div className="track-order-header">
                  <div>
                    <strong>طلب #{order.id.slice(-8).toUpperCase()}</strong>
                    <p className="text-muted">
                      {new Date(order.createdAt).toLocaleString("ar-EG")}
                    </p>
                  </div>
                  <span
                    className="status-pill"
                    style={{ background: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="track-order-meta">
                  <span>💳 {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                  {order.governorate && <span>📍 {order.governorate.name}</span>}
                  {order.shippingCompany && <span>🚚 {order.shippingCompany.name}</span>}
                  {order.coupon && <span>🏷️ {order.coupon.code}</span>}
                </div>

                <ul className="track-order-items">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.quantity} × {item.product.name}
                    </li>
                  ))}
                </ul>

                <div className="track-order-total">
                  <span>الإجمالي (شامل الشحن)</span>
                  <strong>{order.totalAmount} ج.م</strong>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </StoreShell>
  );
}
