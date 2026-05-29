"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  totalAmount: number;
  shippingCost: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
  governorate?: { name: string };
  shippingCompany?: { name: string };
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

const paymentStatusLabels: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "في انتظار الدفع", bg: "#fef3c7", color: "#d97706" },
  PAID: { label: "مدفوع", bg: "#dcfce7", color: "#16a34a" },
  FAILED: { label: "فشل الدفع", bg: "#fee2e2", color: "#dc2626" },
};

const statusOptions = [
  { value: "PENDING", label: "قيد الانتظار" },
  { value: "PROCESSING", label: "قيد التجهيز" },
  { value: "SHIPPED", label: "تم الشحن" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "CANCELLED", label: "ملغي" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrders(data);
    } catch {
      console.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const headers = {
      id: "رقم الطلب",
      customerName: "العميل",
      customerPhone: "رقم الهاتف",
      customerAddress: "العنوان",
      totalAmount: "الإجمالي (ج.م)",
      shippingCost: "تكلفة الشحن",
      paymentMethod: "طريقة الدفع",
      paymentStatus: "حالة الدفع",
      status: "حالة الطلب",
      createdAt: "تاريخ الطلب"
    };

    const formattedData = orders.map(order => ({
      id: order.id.slice(-6),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress || "غير متوفر",
      totalAmount: order.totalAmount,
      shippingCost: order.shippingCost,
      paymentMethod: paymentLabels[order.paymentMethod] || order.paymentMethod,
      paymentStatus: order.paymentStatus === "PAID" ? "مدفوع" : "غير مدفوع",
      status: statusLabels[order.status]?.label || order.status,
      createdAt: new Date(order.createdAt).toLocaleDateString("ar-EG")
    }));

    const csvHeaders = Object.values(headers).join(",") + "\n";
    const keys = Object.keys(headers);
    
    const csvRows = formattedData.map(item => {
      return keys.map(key => {
        const val = item[key as keyof typeof item] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(",");
    }).join("\n");
    
    const csvBlob = new Blob(["\uFEFF" + csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_report_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsRows = order.items.map(item => `
      <tr style="border-bottom: 1px solid #e4e4e7;">
        <td style="padding: 0.75rem; text-align: right;">${item.product.name}</td>
        <td style="padding: 0.75rem; text-align: center;">${item.quantity}</td>
        <td style="padding: 0.75rem; text-align: center;">${item.price} ج.م</td>
        <td style="padding: 0.75rem; text-align: left; font-weight: 600;">${item.quantity * item.price} ج.م</td>
      </tr>
    `).join("");

    const subTotal = order.items.reduce((s, i) => s + (i.quantity * i.price), 0);
    const discount = Math.max(0, subTotal + order.shippingCost - order.totalAmount);

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة - ${order.id.slice(-6)}</title>
          <style>
            body { font-family: 'IBM Plex Sans Arabic', 'IBM Plex Sans', sans-serif; padding: 2rem; color: #27272a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #d97706; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            h2 { color: #d97706; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
            th, td { padding: 0.75rem; text-align: right; border-bottom: 1px solid #e4e4e7; }
            th { background: #fef3c7; font-weight: 700; }
            .total-row { font-weight: 700; font-size: 1.1rem; color: #d97706; }
            .footer-info { margin-top: 3rem; color: #71717a; font-size: 0.9rem; border-top: 1px solid #e4e4e7; padding-top: 1rem; }
            .info-block { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
            .info-card { background: #fafaf9; border: 1px solid #e4e4e7; padding: 1rem; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🍇 فاتورة شراء - طبيعة</h2>
            <div style="font-size: 0.9rem; text-align: left;">
              <strong>رقم الفاتورة:</strong> #${order.id.slice(-6)}<br/>
              <strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleDateString("ar-EG")}<br/>
              <strong>حالة الدفع:</strong> ${order.paymentStatus === "PAID" ? "مدفوع" : "غير مدفوع"}
            </div>
          </div>

          <div class="info-block">
            <div class="info-card">
              <strong>👤 بيانات العميل:</strong><br/>
              الاسم: ${order.customerName}<br/>
              الهاتف: ${order.customerPhone}<br/>
              العنوان: ${order.customerAddress || "غير متوفر"}
            </div>
            <div class="info-card">
              <strong>🚚 الشحن والدفع:</strong><br/>
              المحافظة: ${order.governorate?.name || "غير محدد"}<br/>
              شركة الشحن: ${order.shippingCompany?.name || "غير محدد"}<br/>
              طريقة الدفع: ${paymentLabels[order.paymentMethod] || order.paymentMethod}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: center;">السعر</th>
                <th style="text-align: left;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
              <tr>
                <td colSpan="3" style="text-align: right; color: #71717a;">المجموع الفرعي</td>
                <td style="text-align: left; color: #71717a;">${subTotal} ج.م</td>
              </tr>
              ${discount > 0 ? `
              <tr>
                <td colSpan="3" style="text-align: right; color: #16a34a; font-weight: 600;">خصم الكوبون</td>
                <td style="text-align: left; color: #16a34a; font-weight: 600;">-${discount} ج.م</td>
              </tr>
              ` : ""}
              <tr>
                <td colSpan="3" style="text-align: right; color: #71717a;">تكلفة الشحن</td>
                <td style="text-align: left; color: #71717a;">${order.shippingCost} ج.م</td>
              </tr>
              <tr class="total-row">
                <td colSpan="3" style="text-align: right;">الإجمالي المطلوب</td>
                <td style="text-align: left;">${order.totalAmount} ج.م</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-info">
            <p>شكراً لتعاملكم معنا - متجر طبيعة لبيع الفواكه المجففة والمكسرات 🍇</p>
            <p>لأي استفسار يرجى التواصل على الهاتف: 01000000000 أو البريد الإلكتروني: info@tabiea.com</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? updated : o))
        );
      }
    } catch {
      console.error("Error updating order");
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل الطلبات...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="📦 المبيعات والطلبات"
        subtitle={`إدارة ومتابعة جميع الطلبات (${orders.length} طلب)`}
        action={
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleExportExcel}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "var(--radius-full)",
              background: "#16a34a",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "inherit"
            }}
          >
            📊 تصدير إكسيل
          </button>
          <button
            className="btn-primary"
            onClick={fetchOrders}
            style={{ fontFamily: "inherit", fontSize: "0.9rem" }}
          >
            🔄 تحديث
          </button>
        </div>
        }
      />

      <div className="glass-table-container">
        <div style={{ overflowX: "auto" }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>العميل</th>
                <th>الهاتف</th>
                <th>الإجمالي</th>
                <th>الدفع</th>
                <th>حالة الدفع</th>
                <th>الحالة</th>
                <th>التاريخ</th>
                <th>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusInfo = statusLabels[order.status] || {
                  label: order.status,
                  bg: "#f3f4f6",
                  color: "#374151",
                };
                const paymentStatusInfo =
                  paymentStatusLabels[order.paymentStatus] || {
                    label: order.paymentStatus,
                    bg: "#f3f4f6",
                    color: "#374151",
                  };
                const isExpanded = expandedOrder === order.id;

                return (
                  <React.Fragment key={order.id}>
                    <tr
                      style={{
                        borderBottom: isExpanded
                          ? "none"
                          : "1px solid var(--border-color)",
                        background: isExpanded
                          ? "rgba(217,119,6,0.03)"
                          : "transparent",
                        transition: "var(--transition)",
                      }}
                    >
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontWeight: "600",
                          color: "var(--primary)",
                          fontSize: "0.85rem",
                        }}
                      >
                        #{order.id.slice(-6)}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: "500" }}>
                        {order.customerName}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          direction: "ltr",
                          textAlign: "right",
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {order.customerPhone}
                      </td>
                      <td style={{ padding: "0.85rem 1rem", fontWeight: "600" }}>
                        {order.totalAmount.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        {paymentLabels[order.paymentMethod] ||
                          order.paymentMethod}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            background: paymentStatusInfo.bg,
                            color: paymentStatusInfo.color,
                            padding: "0.2rem 0.6rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {paymentStatusInfo.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value)
                          }
                          disabled={updatingStatus === order.id}
                          style={{
                            background: statusInfo.bg,
                            color: statusInfo.color,
                            padding: "0.3rem 0.5rem",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${statusInfo.color}30`,
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            opacity: updatingStatus === order.id ? 0.6 : 1,
                          }}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {new Date(order.createdAt).toLocaleDateString(
                          "ar-EG",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <button
                          onClick={() =>
                            setExpandedOrder(
                              isExpanded ? null : order.id
                            )
                          }
                          style={{
                            background: "none",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.35rem 0.75rem",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            color: "var(--text-main)",
                            fontFamily: "inherit",
                            transition: "var(--transition)",
                          }}
                        >
                          {isExpanded ? "▲ إخفاء" : "▼ عرض"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Order Details */}
                    {isExpanded && (
                      <tr key={`${order.id}-details`}>
                        <td
                          colSpan={9}
                          style={{
                            padding: "0 1.5rem 1.5rem",
                            borderBottom: "1px solid var(--border-color)",
                            background: "rgba(217,119,6,0.03)",
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "2fr 1fr 1fr",
                              gap: "1.5rem",
                            }}
                          >
                            {/* Order Items */}
                            <div>
                              <h4
                                style={{
                                  fontWeight: "600",
                                  marginBottom: "0.75rem",
                                  fontSize: "0.95rem",
                                }}
                              >
                                📋 عناصر الطلب
                              </h4>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.5rem",
                                }}
                              >
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.75rem",
                                      padding: "0.5rem 0.75rem",
                                      background: "var(--bg-card)",
                                      borderRadius: "var(--radius-md)",
                                      border: "1px solid var(--border-color)",
                                    }}
                                  >
                                    <span style={{ fontSize: "1.3rem" }}>
                                      {item.product.imageUrl || "📦"}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          fontWeight: "500",
                                          fontSize: "0.9rem",
                                        }}
                                      >
                                        {item.product.name}
                                      </div>
                                      <div
                                        style={{
                                          color: "var(--text-muted)",
                                          fontSize: "0.8rem",
                                        }}
                                      >
                                        {item.quantity} × {item.price} ج.م ={" "}
                                        <strong>
                                          {(
                                            item.quantity * item.price
                                          ).toLocaleString("ar-EG")}{" "}
                                          ج.م
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div>
                              <h4
                                style={{
                                  fontWeight: "600",
                                  marginBottom: "0.75rem",
                                  fontSize: "0.95rem",
                                }}
                              >
                                👤 معلومات العميل
                              </h4>
                              <div
                                style={{
                                  padding: "1rem",
                                  background: "var(--bg-card)",
                                  borderRadius: "var(--radius-md)",
                                  border: "1px solid var(--border-color)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.5rem",
                                }}
                              >
                                <div>
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    الاسم:
                                  </span>{" "}
                                  <strong>{order.customerName}</strong>
                                </div>
                                <div>
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      fontSize: "0.85rem",
                                    }}
                                  >
                                    الهاتف:
                                  </span>{" "}
                                  <strong
                                    style={{ direction: "ltr", display: "inline-block" }}
                                  >
                                    {order.customerPhone}
                                  </strong>
                                </div>
                                {order.customerAddress && (
                                  <div>
                                    <span
                                      style={{
                                        color: "var(--text-muted)",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      العنوان:
                                    </span>{" "}
                                    <strong>{order.customerAddress}</strong>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Shipping Info */}
                            <div>
                              <h4
                                style={{
                                  fontWeight: "600",
                                  marginBottom: "0.75rem",
                                  fontSize: "0.95rem",
                                }}
                              >
                                🚚 معلومات الشحن
                              </h4>
                              <div
                                style={{
                                  padding: "1rem",
                                  background: "var(--bg-card)",
                                  borderRadius: "var(--radius-md)",
                                  border: "1px solid var(--border-color)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.5rem",
                                }}
                              >
                                <div>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>المحافظة:</span>{" "}
                                  <strong>{order.governorate?.name || "غير محدد"}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>شركة الشحن:</span>{" "}
                                  <strong>{order.shippingCompany?.name || "غير محدد"}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>تكلفة الشحن:</span>{" "}
                                  <strong>{order.shippingCost?.toLocaleString("ar-EG") || 0} ج.م</strong>
                                </div>
                                <button
                                  onClick={() => handlePrintInvoice(order)}
                                  style={{
                                    marginTop: "0.75rem",
                                    padding: "0.45rem 1rem",
                                    borderRadius: "var(--radius-md)",
                                    border: "1.5px solid var(--primary)",
                                    background: "transparent",
                                    color: "var(--primary)",
                                    fontWeight: "600",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.4rem",
                                    width: "100%",
                                    transition: "var(--transition)",
                                    fontFamily: "inherit"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "var(--primary)";
                                    e.currentTarget.style.color = "white";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "var(--primary)";
                                  }}
                                >
                                  🖨️ طباعة الفاتورة
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📭
                    </div>
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
