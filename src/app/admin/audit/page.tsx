"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface AuditLog {
  id: string;
  adminUserId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/audit", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json);
      } else {
        const data = await res.json();
        setError(data.error || "فشل تحميل السجل");
      }
    } catch (error) {
      console.error("Error fetching audit logs", error);
      setError("حدث خطأ في جلب بيانات السجل");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل سجل المراقبة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#dc2626" }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="🛡️ سجل المراقبة"
        subtitle="تتبع الأنشطة والتعديلات في النظام"
        action={
          <button type="button" className="btn-primary" onClick={fetchLogs} style={{ fontSize: "0.9rem" }}>
            🔄 تحديث السجل
          </button>
        }
      />

      <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "rgba(217,119,6,0.05)", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>التاريخ والوقت</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>المستخدم</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الإجراء</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>القسم</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {new Date(log.createdAt).toLocaleString("ar-EG")}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: "600", color: "var(--primary)" }}>
                    {log.adminUserId}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      background: "rgba(37,99,235,0.1)",
                      color: "#2563eb",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.85rem",
                      fontWeight: "600"
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontWeight: "500" }}>{log.entity}</td>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "250px" }}>
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    لا توجد سجلات بعد
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
