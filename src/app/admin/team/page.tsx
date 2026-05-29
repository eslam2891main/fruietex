"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface AdminUser {
  id: string;
  username: string;
  role: string;
  permissions: string;
  createdAt: string;
}

export default function AdminTeam() {
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [permissions, setPermissions] = useState<string[]>(["ORDERS", "PRODUCTS", "CUSTOMERS", "SHIPPING", "FINANCE", "TEAM", "INVENTORY"]);

  const togglePermission = (perm: string) => {
    setPermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/team", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTeam(json);
      }
    } catch (error) {
      console.error("Error fetching team", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, password, role, permissions: role === "ADMIN" ? "ALL" : permissions.join(",") })
      });
      
      if (res.ok) {
        await fetchTeam();
        setShowForm(false);
        setUsername("");
        setPassword("");
        setRole("ADMIN");
        setPermissions(["ORDERS", "PRODUCTS", "CUSTOMERS", "SHIPPING", "FINANCE", "TEAM", "INVENTORY"]);
      } else {
        const data = await res.json();
        alert(data.error || "فشل إضافة العضو");
      }
    } catch (error) {
      console.error("Error saving team member", error);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-md)",
    border: "1.5px solid var(--border-color)",
    background: "var(--bg-card)",
    color: "var(--text-main)",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل بيانات الفريق...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="👨‍💼 فريق العمل"
        subtitle="إدارة حسابات وصلاحيات دخول النظام"
        action={
          <button type="button" className="btn-primary" onClick={() => setShowForm(true)} style={{ fontSize: "0.9rem" }}>
            ➕ إضافة عضو جديد
          </button>
        }
      />

      {showForm && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            marginBottom: "2rem",
            borderTop: "3px solid var(--primary)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>➕ إضافة عضو جديد</h2>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
          </div>
          
          <form onSubmit={handleAddMember} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>اسم المستخدم</label>
                <input style={inputStyle} type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="مثال: ahmed_admin" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>كلمة المرور</label>
                <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>الصلاحية</label>
                <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="ADMIN">مدير كامل (Admin)</option>
                  <option value="MANAGER">مخصص (Custom Permissions)</option>
                </select>
              </div>
            </div>

            {role === "MANAGER" && (
              <div style={{ background: "rgba(217,119,6,0.05)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <label style={{ display: "block", marginBottom: "0.8rem", fontSize: "0.95rem", fontWeight: "600" }}>صلاحيات الوصول (تحديد ما يمكنه رؤيته وإدارته)</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                  {[
                    { id: "ORDERS", label: "الطلبات" },
                    { id: "PRODUCTS", label: "المنتجات" },
                    { id: "INVENTORY", label: "المخازن" },
                    { id: "CUSTOMERS", label: "العملاء" },
                    { id: "SHIPPING", label: "الشحن" },
                    { id: "FINANCE", label: "الماليات" },
                    { id: "TEAM", label: "فريق العمل" },
                  ].map(p => (
                    <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input 
                        type="checkbox" 
                        checked={permissions.includes(p.id)} 
                        onChange={() => togglePermission(p.id)}
                        style={{ width: "16px", height: "16px", accentColor: "var(--primary)" }} 
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={saving} style={{ fontFamily: "inherit", height: "45px", alignSelf: "flex-end", padding: "0 2rem" }}>
              {saving ? "جاري الحفظ..." : "حفظ الحساب"}
            </button>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "rgba(217,119,6,0.05)", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>اسم المستخدم</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الدور</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الصلاحيات</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>تاريخ الإضافة</th>
              </tr>
            </thead>
            <tbody>
              {team.map(member => (
                <tr key={member.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem", fontWeight: "600" }}>{member.username}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ 
                      background: member.role === "ADMIN" ? "rgba(217,119,6,0.1)" : "rgba(37,99,235,0.1)", 
                      color: member.role === "ADMIN" ? "var(--primary)" : "#2563eb",
                      padding: "0.2rem 0.6rem", 
                      borderRadius: "var(--radius-full)", 
                      fontSize: "0.85rem",
                      fontWeight: "600"
                    }}>
                      {member.role === "ADMIN" ? "مدير كامل" : "مخصص"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "200px" }}>
                    {member.permissions === "ALL" ? "كل الصلاحيات" : member.permissions.split(",").join("، ")}
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {new Date(member.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
