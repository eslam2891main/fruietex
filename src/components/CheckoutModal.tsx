"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";

type PaymentMethod = "INSTAPAY" | "VODAFONE_CASH" | "PAYMOB" | "CASH";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { value: "INSTAPAY", label: "انستا باي", icon: "💳", desc: "InstaPay" },
  { value: "VODAFONE_CASH", label: "فودافون كاش", icon: "📱", desc: "Vodafone Cash" },
  { value: "PAYMOB", label: "باي موب", icon: "💰", desc: "Paymob" },
  { value: "CASH", label: "الدفع عند الاستلام", icon: "🏠", desc: "Cash on Delivery" },
];

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type ShippingGovernorate = { id: string; name: string };
type ShippingCompany = { id: string; name: string };
type ShippingRate = { id: string; govId: string; companyId: string; cost: number };

type AppliedCoupon = {
  code: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
};

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { items, total, clearCart, updateQuantity, removeFromCart } = useCart();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    governorateId: "",
    shippingCompId: "",
    paymentMethod: "INSTAPAY" as PaymentMethod,
  });
  const [shippingData, setShippingData] = useState<{
    governorates: ShippingGovernorate[];
    companies: ShippingCompany[];
    rates: ShippingRate[];
  } | null>(null);
  const [shippingCost, setShippingCost] = useState(0);

  // Coupons States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    fetch("/api/shipping").then(res => res.json()).then(data => setShippingData(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.governorateId && formData.shippingCompId && shippingData) {
      const rate = shippingData.rates.find(r => r.govId === formData.governorateId && r.companyId === formData.shippingCompId);
      setShippingCost(rate ? rate.cost : 0);
    } else {
      setShippingCost(0);
    }
  }, [formData.governorateId, formData.shippingCompId, shippingData]);

  // Handle Coupon Apply
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/storefront/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل التحقق من الكوبون");
      }
      setAppliedCoupon(data);
      let calculatedDiscount = 0;
      if (data.discountPercent) {
        calculatedDiscount = (total * data.discountPercent) / 100;
      } else if (data.discountAmount) {
        calculatedDiscount = Math.min(data.discountAmount, total);
      }
      setDiscountAmount(calculatedDiscount);
    } catch (err: unknown) {
      setCouponError(err instanceof Error ? err.message : "كوبون غير صالح");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Handle Coupon Remove
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setDiscountAmount(0);
    setCouponError(null);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState<OrderItem[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderError(null);

    // Save order snapshot before clearing cart
    const snapshot = items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));
    const snapshotTotal = total;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          governorateId: formData.governorateId,
          shippingCompId: formData.shippingCompId,
          shippingCost: shippingCost,
          paymentMethod: formData.paymentMethod,
          couponCode: appliedCoupon?.code || null,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "فشل في إرسال الطلب. حاول مرة أخرى.");
      }

      const data = await res.json();
      setInvoiceId(data.invoiceNumber || data.id || `INV-${Date.now()}`);
      setOrderedItems(snapshot);
      setOrderTotal(Math.max(0, snapshotTotal - discountAmount) + shippingCost);
      clearCart();
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setOrderError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة - ${invoiceId}</title>
          <style>
            body { font-family: 'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif; padding: 2rem; color: #27272a; }
            h2 { color: #d97706; margin-bottom: 1rem; }
            table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
            th, td { padding: 0.75rem; text-align: right; border-bottom: 1px solid #e4e4e7; }
            th { background: #fef3c7; font-weight: 700; }
            .total-row { font-weight: 700; font-size: 1.1rem; color: #d97706; }
            .footer-info { margin-top: 2rem; color: #71717a; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer-info">
            <p>شكراً لتسوقكم من طبيعة 🍇</p>
            <p>تاريخ الطلب: ${new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // ═══════════════════════════════════════
  //  Empty Cart State
  // ═══════════════════════════════════════
  if (items.length === 0 && step !== 3) {
    return (
      <div className="modal-overlay">
        <div
          style={{
            background: "var(--bg-card)",
            padding: "2.5rem",
            borderRadius: "var(--radius-lg)",
            maxWidth: "450px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</div>
          <h2 style={{ marginBottom: "0.75rem", fontSize: "1.5rem", fontWeight: "700" }}>
            السلة فارغة
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.8 }}>
            لم تقم بإضافة أي منتجات للسلة بعد. تصفح منتجاتنا وأضف ما يناسبك!
          </p>
          <button className="btn-primary" onClick={onClose} style={{ width: "100%", fontSize: "1rem" }}>
            العودة للتسوق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div
        style={{
          background: "var(--bg-card)",
          padding: "2rem",
          borderRadius: "var(--radius-lg)",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          animation: "fadeIn 0.3s ease",
        }}
      >
        {/* Close button */}
        {step !== 3 && (
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              left: "1rem",
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border-color)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ✕
          </button>
        )}

        {/* Step Indicator */}
        <div className="step-container" style={{ marginTop: "0.5rem", marginBottom: "2.5rem" }}>
          <div className="step-line" style={{ right: 0, left: 0 }} />
          <div 
            className="step-line-active" 
            style={{ 
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
              right: 0,
              left: "auto"
            }} 
          />
          <div className={`step-item ${step === 1 ? "active" : "completed"}`}>
            <div className="step-circle">1</div>
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>السلة</span>
          </div>
          <div className={`step-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`}>
            <div className="step-circle">2</div>
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>التوصيل والدفع</span>
          </div>
          <div className={`step-item ${step === 3 ? "active completed" : ""}`}>
            <div className="step-circle">3</div>
            <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>الفاتورة</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/*  STEP 1: Cart Review                   */}
        {/* ═══════════════════════════════════════ */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", fontWeight: "700" }}>
              🛒 مراجعة السلة
            </h2>

            <div style={{ marginBottom: "1.5rem" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 0",
                    borderBottom: "1px solid var(--border-color)",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flex: 1 }}>
                    <div
                      style={{
                        fontSize: "2rem",
                        width: "50px",
                        height: "50px",
                        background: "#fef3c7",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon || "🍎"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontWeight: "600", fontSize: "0.95rem" }}>{item.name}</h4>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {item.price} ج.م × {item.quantity}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    {/* Quantity Controls */}
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{ opacity: item.quantity <= 1 ? 0.4 : 1 }}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: "600", minWidth: "1.5rem", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "1.1rem",
                        padding: "0.25rem",
                        marginRight: "0.25rem",
                      }}
                      title="إزالة"
                    >
                      🗑
                    </button>
                  </div>

                  <div style={{ fontWeight: "700", minWidth: "60px", textAlign: "left", flexShrink: 0 }}>
                    {item.price * item.quantity} ج.م
                  </div>
                </div>
              ))}

              {/* Subtotal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "1.5rem",
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "var(--primary)",
                  padding: "1rem",
                  background: "rgba(217, 119, 6, 0.06)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span>الإجمالي:</span>
                <span>{total} ج.م</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "inherit",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                }}
              >
                متابعة التسوق
              </button>
              <button
                className="btn-primary"
                style={{ flex: 2, fontSize: "1rem" }}
                onClick={() => setStep(2)}
              >
                متابعة الشراء ←
              </button>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/*  STEP 2: Customer Info & Payment        */}
        {/* ═══════════════════════════════════════ */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", fontWeight: "700" }}>
              📋 بيانات التوصيل والدفع
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Name */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.95rem" }}>
                  الاسم الكامل
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--border-color)",
                    background: "transparent",
                    color: "inherit",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.95rem" }}>
                  رقم الهاتف
                </label>
                <input
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--border-color)",
                    background: "transparent",
                    color: "inherit",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                />
              </div>

              {/* Shipping Dropdowns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.95rem" }}>
                    المحافظة
                  </label>
                  <select
                    required
                    name="governorateId"
                    value={formData.governorateId}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "0.875rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-color)", background: "var(--bg-color)", color: "inherit", fontSize: "1rem" }}
                  >
                    <option value="">-- اختر المحافظة --</option>
                    {shippingData?.governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.95rem" }}>
                    شركة الشحن
                  </label>
                  <select
                    required
                    name="shippingCompId"
                    value={formData.shippingCompId}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: "0.875rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-color)", background: "var(--bg-color)", color: "inherit", fontSize: "1rem" }}
                  >
                    <option value="">-- اختر شركة الشحن --</option>
                    {shippingData?.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", fontSize: "0.95rem" }}>
                  العنوان بالتفصيل
                </label>
                <textarea
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="المحافظة، المدينة، الشارع، رقم المبنى..."
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--border-color)",
                    background: "transparent",
                    color: "inherit",
                    fontSize: "1rem",
                    resize: "vertical",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              {/* Payment Method Cards */}
              <div>
                <label style={{ display: "block", marginBottom: "0.75rem", fontWeight: "600", fontSize: "0.95rem" }}>
                  طريقة الدفع
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`payment-card ${formData.paymentMethod === option.value ? "selected" : ""}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: option.value })}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setFormData({ ...formData, paymentMethod: option.value });
                        }
                      }}
                    >
                      {formData.paymentMethod === option.value && (
                        <div style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: "50%",
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          boxShadow: "0 2px 6px var(--primary-glow)",
                          animation: "fadeIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                        }}>
                          ✓
                        </div>
                      )}
                      <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{option.icon}</div>
                      <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{option.label}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        {option.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error message */}
              {orderError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    textAlign: "center",
                  }}
                >
                  ⚠️ {orderError}
                </div>
              )}

              {/* Coupon Field */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: "rgba(217, 119, 6, 0.03)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-color)" }}>
                <label style={{ display: "block", fontWeight: "600", fontSize: "0.9rem" }}>
                  🏷️ كوبون الخصم (إن وجد)
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="أدخل رمز الكوبون هنا"
                    disabled={!!appliedCoupon}
                    style={{
                      flex: 1,
                      padding: "0.6rem 0.8rem",
                      borderRadius: "var(--radius-md)",
                      border: "1.5px solid var(--border-color)",
                      background: "var(--bg-card)",
                      color: "inherit",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isCheckingCoupon || !couponCode || !!appliedCoupon}
                    className="btn-primary"
                    style={{
                      padding: "0 1.25rem",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.85rem",
                      background: !!appliedCoupon ? "var(--secondary)" : "var(--primary)",
                      height: "38px"
                    }}
                  >
                    {isCheckingCoupon ? "جاري التحقق..." : !!appliedCoupon ? "تم التطبيق ✓" : "تطبيق"}
                  </button>
                </div>
                {couponError && (
                  <div style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: "500" }}>
                    {couponError}
                  </div>
                )}
                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.2)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)" }}>
                    <span style={{ color: "#16a34a", fontSize: "0.8rem", fontWeight: "600" }}>
                      🎉 خصم {appliedCoupon.discountPercent ? `${appliedCoupon.discountPercent}%` : `${appliedCoupon.discountAmount} ج.م`} مفعّل!
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                    >
                      إزالة ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div style={{ background: "rgba(217, 119, 6, 0.05)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>المجموع:</span>
                  <span style={{ fontWeight: "600" }}>{total} ج.م</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#16a34a", fontWeight: "600" }}>
                    <span>الخصم المطبق:</span>
                    <span>-{discountAmount} ج.م</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>تكلفة الشحن:</span>
                  <span style={{ fontWeight: "600", color: formData.governorateId && formData.shippingCompId ? (shippingCost > 0 ? "var(--text-main)" : "#16a34a") : "var(--text-muted)" }}>
                    {formData.governorateId && formData.shippingCompId ? (shippingCost > 0 ? `${shippingCost} ج.م` : "غير متوفرة حالياً") : "يتم حسابها بناءً على المحافظة"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid var(--border-color)", fontWeight: "700", fontSize: "1.2rem", color: "var(--primary)" }}>
                  <span>الإجمالي المطلوب:</span>
                  <span>{Math.max(0, total - discountAmount) + shippingCost} ج.م</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: "0.875rem",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.95rem",
                    transition: "all 0.2s",
                  }}
                >
                  → رجوع
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    flex: 2,
                    fontSize: "1rem",
                    opacity: isSubmitting ? 0.8 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      <span className="spinner" />
                      جاري التأكيد...
                    </span>
                  ) : (
                    "تأكيد الطلب وإصدار الفاتورة ✓"
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/*  STEP 3: Invoice / Success              */}
        {/* ═══════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            {/* Success animation */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem auto",
                fontSize: "2.5rem",
                color: "white",
                boxShadow: "0 8px 24px rgba(34, 197, 94, 0.3)",
                animation: "fadeIn 0.5s ease",
              }}
            >
              ✓
            </div>

            <h2 style={{ fontSize: "1.6rem", marginBottom: "0.5rem", fontWeight: "700" }}>
              تم استلام طلبك بنجاح! 🎉
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
              سيتم التواصل معك قريباً لتأكيد الشحن
            </p>

            {/* Invoice Content (for printing) */}
            <div
              ref={invoiceRef}
              className="invoice-ticket"
              style={{
                textAlign: "right",
                marginBottom: "2rem",
                color: "var(--text-main)",
                background: "var(--bg-card)",
                border: "1.5px solid var(--border-color)",
                boxShadow: "var(--shadow-md)",
                padding: "2rem 1.5rem"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  paddingBottom: "1rem",
                  borderBottom: "2px solid var(--primary)",
                }}
              >
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--primary)" }}>
                  🍇 فاتورة - طبيعة
                </h3>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  رقم: <strong style={{ color: "var(--text-main)" }}>{invoiceId}</strong>
                </div>
              </div>

              {/* Order Items Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      المنتج
                    </th>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      الكمية
                    </th>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      السعر
                    </th>
                    <th style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      المجموع
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderedItems.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: "500" }}>{item.name}</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "center" }}>{item.price} ج.م</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: "600" }}>
                        {item.price * item.quantity} ج.م
                      </td>
                    </tr>
                  ))}
                  {discountAmount > 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: "600", color: "#16a34a" }}>خصم الكوبون ({appliedCoupon?.code})</td>
                      <td style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: "600", color: "#16a34a" }}>
                        -{discountAmount} ج.م
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: "600", color: "var(--text-muted)" }}>تكلفة الشحن</td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "left", fontWeight: "600", color: "var(--text-muted)" }}>
                      {shippingCost} ج.م
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1rem 0.5rem",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  color: "var(--primary)",
                  borderTop: "2px solid var(--primary)",
                }}
              >
                <span>الإجمالي الكلي:</span>
                <span>{orderTotal} ج.م</span>
              </div>

              {/* Payment Info */}
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  background: "rgba(217, 119, 6, 0.06)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>طريقة الدفع: </span>
                <strong>
                  {PAYMENT_OPTIONS.find((p) => p.value === formData.paymentMethod)?.label || formData.paymentMethod}
                </strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={handlePrint}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-full)",
                  border: "2px solid var(--primary)",
                  color: "var(--primary)",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                🖨 طباعة الفاتورة
              </button>
              <button className="btn-primary" onClick={onClose} style={{ fontSize: "0.95rem" }}>
                العودة للرئيسية
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
