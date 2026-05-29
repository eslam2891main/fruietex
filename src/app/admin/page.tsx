"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface DashboardStats {
  totalSales: number;
  monthlySales: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  lowStockAlerts: number;
  lowStockProducts: {
    id: string;
    name: string;
    stock: number;
    imageUrl: string | null;
  }[];
  recentOrders: {
    id: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }[];
  salesData: { date: string; sales: number }[];
  orderStatusData: { name: string; value: number }[];
}

const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "قيد الانتظار", bg: "#fef3c7", color: "#d97706" },
  PROCESSING: { label: "قيد التجهيز", bg: "#dbeafe", color: "#2563eb" },
  SHIPPED: { label: "تم الشحن", bg: "#e0e7ff", color: "#4f46e5" },
  COMPLETED: { label: "مكتمل", bg: "#dcfce7", color: "#16a34a" },
  CANCELLED: { label: "ملغي", bg: "#fee2e2", color: "#dc2626" },
};

const paymentLabels: Record<string, string> = {
  INSTAPAY: "إنستاباي",
  VODAFONE_CASH: "فودافون كاش",
  PAYMOB: "بيموب",
  CASH: "الدفع عند الاستلام",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-empty">
        <span className="admin-empty-icon">⏳</span>
        <p>جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-empty">
        <span className="admin-empty-icon">❌</span>
        <p style={{ color: "#dc2626" }}>{error}</p>
        <button type="button" className="btn-primary" onClick={fetchDashboard} style={{ marginTop: "1rem" }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المبيعات",
      value: `${stats.totalSales.toLocaleString("ar-EG")} ج.م`,
      sub: `هذا الشهر: ${stats.monthlySales.toLocaleString("ar-EG")} ج.م`,
      icon: "💰",
      color: "var(--primary)",
      glowClass: "sales",
    },
    {
      title: "إجمالي الطلبات",
      value: stats.totalOrders.toString(),
      sub: `${stats.pendingOrders} قيد الانتظار`,
      icon: "📦",
      color: "#2563eb",
      glowClass: "orders",
    },
    {
      title: "إجمالي العملاء",
      value: stats.totalCustomers.toString(),
      sub: "عميل مسجل",
      icon: "👥",
      color: "#16a34a",
      glowClass: "revenue",
    },
    {
      title: "تنبيهات المخزون",
      value: `${stats.lowStockAlerts} منتجات`,
      sub: "قاربت على الانتهاء",
      icon: "⚠️",
      color: stats.lowStockAlerts > 0 ? "#dc2626" : "#16a34a",
      glowClass: stats.lowStockAlerts > 0 ? "orders" : "revenue",
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="مرحباً بك في لوحة التحكم 👋"
        subtitle="نظرة عامة على أداء المنصة والمبيعات والمخزون"
      />

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`stat-card-glow ${card.glowClass}`}
            style={{
              padding: "1.5rem",
              transition: "var(--transition)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.95rem",
                  fontWeight: "700",
                }}
              >
                {card.title}
              </span>
              <span style={{ fontSize: "1.8rem", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.06))" }}>{card.icon}</span>
            </div>
            <div
              style={{
                fontSize: "1.85rem",
                fontWeight: "800",
                color: card.color,
                marginBottom: "0.35rem",
                fontFamily: "var(--font-numbers)"
              }}
            >
              {card.value}
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                fontWeight: "600"
              }}
            >
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1.5rem" }}>📈 المبيعات آخر 7 أيام</h2>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: "rgba(217,119,6,0.05)"}}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-main)", textAlign: "right" }}
                />
                <Bar dataKey="sales" name="المبيعات (ج.م)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1.5rem" }}>📊 حالة الطلبات</h2>
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.orderStatusData.map((entry, index) => {
                    const statusInfo = statusLabels[entry.name] || { color: "#9ca3af" };
                    return <Cell key={`cell-${index}`} fill={statusInfo.color} />;
                  })}
                </Pie>
                <RechartsTooltip 
                  formatter={(value, name) => [value, statusLabels[name as string]?.label || name]}
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", justifyContent: "center", marginTop: "0.5rem" }}>
            {stats.orderStatusData.map((entry, idx) => {
              const statusInfo = statusLabels[entry.name] || { label: entry.name, color: "#9ca3af" };
              return (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: statusInfo.color }}></span>
                  <span>{statusInfo.label} ({entry.value})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockProducts.length > 0 && (
        <div
          className="glass-panel"
          style={{
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            marginBottom: "2rem",
            borderRight: "4px solid #dc2626",
          }}
        >
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ⚠️ تنبيهات المخزون المنخفض
          </h2>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            {stats.lowStockProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "#fef2f2",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  border: "1px solid #fecaca",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>
                  {p.imageUrl || "📦"}
                </span>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    {p.name}
                  </div>
                  <div
                    style={{
                      color: "#dc2626",
                      fontSize: "0.8rem",
                      fontWeight: "500",
                    }}
                  >
                    متبقي: {p.stock} فقط
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div>
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: "700",
            marginBottom: "1.25rem",
          }}
        >
          📋 أحدث الطلبات
        </h2>
        <div className="glass-table-container" style={{ overflowX: "auto" }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>الإجمالي</th>
                <th>الدفع</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => {
                const statusInfo = statusLabels[order.status] || {
                  label: order.status,
                  bg: "#f3f4f6",
                  color: "#374151",
                };
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: "700", color: "var(--primary)", fontFamily: "var(--font-numbers)" }}>
                      #{order.id.slice(-6)}
                    </td>
                    <td style={{ fontWeight: "600" }}>{order.customerName}</td>
                    <td style={{ direction: "ltr", textAlign: "right", color: "var(--text-muted)", fontWeight: "500", fontFamily: "var(--font-numbers)" }}>
                      {order.customerPhone}
                    </td>
                    <td style={{ fontWeight: "700", fontFamily: "var(--font-numbers)" }}>
                      {order.totalAmount.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)" }}>
                      {paymentLabels[order.paymentMethod] || order.paymentMethod}
                    </td>
                    <td>
                      <span
                        style={{
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          padding: "0.25rem 0.75rem",
                          borderRadius: "var(--radius-full)",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap", fontFamily: "var(--font-numbers)" }}>
                      {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    لا توجد طلبات حتى الآن
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
