"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Governorate {
  id: string;
  name: string;
}

interface ShippingCompany {
  id: string;
  name: string;
  phone: string | null;
}

interface ShippingRate {
  id: string;
  companyId: string;
  govId: string;
  cost: number;
}

interface ShippingData {
  governorates: Governorate[];
  companies: ShippingCompany[];
  rates: ShippingRate[];
}

export default function AdminShipping() {
  const [data, setData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(true);

  // New rate form state
  const [showRateForm, setShowRateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [govId, setGovId] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    fetchShippingData();
  }, []);

  const fetchShippingData = async () => {
    try {
      const res = await fetch("/api/shipping");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Error fetching shipping data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !govId || !cost) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ companyId, govId, cost: parseFloat(cost) })
      });
      
      if (res.ok) {
        await fetchShippingData();
        setShowRateForm(false);
        setCompanyId("");
        setGovId("");
        setCost("");
      } else {
        alert("فشل إضافة التسعيرة. قد تكون موجودة بالفعل.");
      }
    } catch (error) {
      console.error("Error saving rate", error);
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
        <p style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="🚚 شركات الشحن"
        subtitle="إدارة شركات الشحن والمحافظات وتكلفة التوصيل"
        action={
          <button type="button" className="btn-primary" onClick={() => setShowRateForm(true)} style={{ fontSize: "0.9rem" }}>
            ➕ تسعيرة جديدة
          </button>
        }
      />

      {showRateForm && (
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
            <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>➕ إضافة تسعيرة شحن جديدة</h2>
            <button onClick={() => setShowRateForm(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
          </div>
          
          <form onSubmit={handleAddRate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>شركة الشحن</label>
              <select style={inputStyle} value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
                <option value="">-- اختر الشركة --</option>
                {data?.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>المحافظة</label>
              <select style={inputStyle} value={govId} onChange={(e) => setGovId(e.target.value)} required>
                <option value="">-- اختر المحافظة --</option>
                {data?.governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>التكلفة (ج.م)</label>
              <input style={inputStyle} type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} required placeholder="مثال: 50" />
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ fontFamily: "inherit", height: "45px" }}>
              {saving ? "جاري الحفظ..." : "حفظ التسعيرة"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem" }}>
        {/* Companies List */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem" }}>🏢 شركات الشحن</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {data?.companies.map(company => (
              <div key={company.id} style={{ padding: "1rem", background: "var(--bg-color)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>{company.name}</div>
                {company.phone && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>📞 {company.phone}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Rates Table */}
        <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "1rem" }}>💰 تسعيرة الشحن للمحافظات</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
              <thead>
                <tr style={{ background: "rgba(217,119,6,0.05)", borderBottom: "2px solid var(--border-color)" }}>
                  <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>الشركة</th>
                  <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>المحافظة</th>
                  <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>التكلفة</th>
                </tr>
              </thead>
              <tbody>
                {data?.rates.map(rate => {
                  const company = data.companies.find(c => c.id === rate.companyId);
                  const gov = data.governorates.find(g => g.id === rate.govId);
                  return (
                    <tr key={rate.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: "600" }}>{company?.name || "-"}</td>
                      <td style={{ padding: "1rem" }}>{gov?.name || "-"}</td>
                      <td style={{ padding: "1rem", fontWeight: "700", color: "var(--primary)" }}>{rate.cost} ج.م</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
