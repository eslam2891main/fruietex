"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  createdAt: string;
  orders: { totalAmount: number }[];
  _count: {
    orders: number;
  };
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const headers = {
      name: "اسم العميل",
      phone: "رقم الهاتف",
      address: "العنوان",
      createdAt: "تاريخ الانضمام",
      ordersCount: "عدد الطلبات",
      totalSpent: "إجمالي المشتريات (ج.م)"
    };

    const formattedData = customers.map(c => {
      const totalSpent = c.orders?.reduce((sum, o) => sum + o.totalAmount, 0) || 0;
      return {
        name: c.name,
        phone: c.phone,
        address: c.address || "غير متوفر",
        createdAt: new Date(c.createdAt).toLocaleDateString("ar-EG"),
        ordersCount: c._count?.orders || 0,
        totalSpent: totalSpent
      };
    });

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
    link.setAttribute("download", `customers_report_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل العملاء...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="👥 العملاء"
        subtitle={`إدارة قاعدة العملاء (${customers.length} عميل)`}
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
            onClick={fetchCustomers}
            style={{ fontFamily: "inherit", fontSize: "0.9rem" }}
          >
            🔄 تحديث
          </button>
        </div>
        }
      />

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
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الاسم</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>رقم الهاتف</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>العنوان</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>تاريخ الانضمام</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>عدد الطلبات</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>إجمالي المشتريات</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const totalSpent = c.orders?.reduce((sum, o) => sum + o.totalAmount, 0) || 0;
                
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      transition: "var(--transition)",
                    }}
                  >
                    <td style={{ padding: "1rem", fontWeight: "600" }}>{c.name}</td>
                    <td style={{ padding: "1rem", direction: "ltr", textAlign: "right" }}>{c.phone}</td>
                    <td style={{ padding: "1rem" }}>{c.address || "-"}</td>
                    <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                      {new Date(c.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "600", color: "var(--primary)" }}>
                      {c._count?.orders || 0} طلب
                    </td>
                    <td style={{ padding: "1rem", fontWeight: "700" }}>
                      {totalSpent.toLocaleString("ar-EG")} ج.م
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</div>
                    لا يوجد عملاء حتى الآن
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
