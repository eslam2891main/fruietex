"use client";

import { useCart } from "@/context/CartContext";
import { getEmoji } from "@/lib/product-utils";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
};

export default function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, total, updateQuantity, removeFromCart } = useCart();

  if (!open) return null;

  return (
    <div className="cart-drawer-overlay" onClick={onClose} role="presentation">
      <aside
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
        aria-label="سلة التسوق"
      >
        <div className="cart-drawer-header">
          <h2>🛒 سلة التسوق</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer-empty">
            <span style={{ fontSize: "3rem" }}>🛍️</span>
            <p>سلتك فارغة حالياً</p>
            <button type="button" className="btn-primary" onClick={onClose}>
              تصفح المنتجات
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-drawer-list">
              {items.map((item) => (
                <li key={item.id} className="cart-drawer-item">
                  <span className="cart-item-emoji">{item.icon || getEmoji(item.name)}</span>
                  <div className="cart-item-info">
                    <strong>{item.name}</strong>
                    <span className="cart-item-price">{item.price} ج.م</span>
                    <div className="cart-item-qty">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cart-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  <span className="cart-item-total">
                    {(item.price * item.quantity).toFixed(0)} ج.م
                  </span>
                </li>
              ))}
            </ul>

            <div className="cart-drawer-footer">
              <div className="cart-drawer-total">
                <span>الإجمالي</span>
                <strong>{total.toFixed(0)} ج.م</strong>
              </div>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "100%", padding: "0.9rem" }}
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
              >
                إتمام الطلب
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
