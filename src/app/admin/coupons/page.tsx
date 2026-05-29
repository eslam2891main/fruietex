"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Coupon {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      } else {
        throw new Error("Failed to load");
      }
    } catch {
      setError("فشل في تحميل الكوبونات المتاحة ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      code: code.toUpperCase().trim(),
      discountPercent: discountType === "PERCENT" ? parseFloat(discountValue) : null,
      discountAmount: discountType === "AMOUNT" ? parseFloat(discountValue) : null,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل إنشاء الكوبون");
      }

      setCoupons((prev) => [data, ...prev]);
      setShowAddForm(false);
      // Reset form
      setCode("");
      setDiscountValue("");
      setUsageLimit("");
      setExpiresAt("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ ما");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف كوبون الخصم هذا؟")) return;

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (res.ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      } else {
        const data = await res.json();
        throw new Error(data.error || "فشل الحذف");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "فشل حذف الكوبون");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل الكوبونات...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="🏷️ كوبونات الخصم"
        subtitle="إدارة رموز الخصومات والحملات التسويقية"
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
            style={{ fontSize: "0.9rem" }}
          >
            ➕ كوبون جديد
          </button>
        }
      />

      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontWeight: "600",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Coupons Table */}
      <div
        className="glass-panel"
        style={{
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "right",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(217,119,6,0.05)",
                  borderBottom: "2px solid var(--border-color)",
                }}
              >
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الرمز</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>نوع الخصم</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>قيمة الخصم</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>حد الاستخدام</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الاستخدامات الفعلية</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>تاريخ الانتهاء</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>تاريخ الإنشاء</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const isLimitReached = c.usageLimit !== null && c.usedCount >= c.usageLimit;
                const statusColor = isExpired || isLimitReached ? "#dc2626" : "#16a34a";

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      transition: "var(--transition)",
                      background: isExpired || isLimitReached ? "rgba(220,38,38,0.01)" : "transparent"
                    }}
                  >
                    <td style={{ padding: "1rem", fontWeight: "700", color: "var(--primary)" }}>{c.code}</td>
                    <td style={{ padding: "1rem" }}>
                      {c.discountPercent !== null ? "نسبة مئوية" : "مبلغ ثابت"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>
                      {c.discountPercent !== null ? `${c.discountPercent}%` : `${c.discountAmount} ج.م`}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {c.usageLimit !== null ? `${c.usageLimit} مرة` : "لا نهائي"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600" }}>
                      <span style={{ color: statusColor }}>{c.usedCount} استخدام</span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: isExpired ? "#dc2626" : "var(--text-main)" }}>
                      {c.expiresAt
                        ? `${new Date(c.expiresAt).toLocaleDateString("ar-EG")} ${isExpired ? "(منتهي)" : ""}`
                        : "مستمر"}
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {new Date(c.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        style={{
                          background: "#fee2e2",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          color: "#b91c1c",
                          padding: "0.35rem 0.75rem",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.8rem",
                          transition: "var(--transition)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fca5a5")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fee2e2")}
                      >
                        🗑️ حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                    لا توجد كوبونات مخصصة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showAddForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-panel animate-fade-in" style={{ padding: "2rem", width: "420px", borderRadius: "var(--radius-lg)", background: "var(--bg-card)", boxShadow: "var(--shadow-lg)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1.5rem", borderBottom: "2px solid var(--primary)", paddingBottom: "0.5rem" }}>➕ إنشاء كوبون خصم جديد</h3>
            
            <form onSubmit={handleAddCoupon} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", fontWeight: "600" }}>رمز الكوبون (الرمز الترويجي)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: WELCOME20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-color)", background: "var(--bg-color)", color: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", fontWeight: "600" }}>نوع التخفيض</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <input type="radio" checked={discountType === "PERCENT"} onChange={() => setDiscountType("PERCENT")} />
                    نسبة مئوية (%)
                  </label>
                  <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <input type="radio" checked={discountType === "AMOUNT"} onChange={() => setDiscountType("AMOUNT")} />
                    مبلغ ثابت (ج.م)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", fontWeight: "600" }}>قيمة التخفيض</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={discountType === "PERCENT" ? "مثال: 15 (%)" : "مثال: 50 (ج.م)"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-color)", background: "var(--bg-color)", color: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", fontWeight: "600" }}>الحد الأقصى لعدد الاستخدامات (اختياري)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 100 (اتركه فارغاً للاستخدام اللانهائي)"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-color)", background: "var(--bg-color)", color: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.85rem", fontWeight: "600" }}>تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border-color)", background: "var(--bg-color)", color: "inherit", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ flex: 1, fontSize: "0.9rem" }}
                >
                  {isSubmitting ? "جاري الإنشاء..." : "حفظ الكوبون"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    background: "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
