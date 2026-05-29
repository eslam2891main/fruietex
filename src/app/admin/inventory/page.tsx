"use client";

import React, { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Product {
  id: string;
  name: string;
  stock: number;
  imageUrl: string | null;
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const json = await res.json();
        setProducts(json);
      }
    } catch (error) {
      console.error("Error fetching inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id: string) => {
    if (!newStock) return;
    
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const productToUpdate = products.find(p => p.id === id);
      if (!productToUpdate) return;

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...productToUpdate, stock: parseInt(newStock) })
      });
      
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: parseInt(newStock) } : p));
        setEditingId(null);
        setNewStock("");
      }
    } catch (error) {
      console.error("Error updating stock", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل المخزون...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="🏢 المخازن والجرد"
        subtitle="متابعة وتحديث كميات المنتجات في المخزن"
        action={
          <button type="button" className="btn-primary" onClick={fetchProducts} style={{ fontSize: "0.9rem" }}>
            🔄 تحديث الجرد
          </button>
        }
      />

      <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "right" }}>
            <thead>
              <tr style={{ background: "rgba(217,119,6,0.05)", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>المنتج</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)" }}>حالة المخزون</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)", width: "150px", textAlign: "center" }}>الكمية المتاحة</th>
                <th style={{ padding: "1rem", fontWeight: "600", color: "var(--text-muted)", width: "200px" }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{product.imageUrl || "📦"}</span>
                    {product.name}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {product.stock === 0 ? (
                      <span style={{ background: "#fef2f2", color: "#dc2626", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: "600" }}>نفذت الكمية</span>
                    ) : product.stock <= 5 ? (
                      <span style={{ background: "#fffbeb", color: "#d97706", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: "600" }}>كمية منخفضة</span>
                    ) : (
                      <span style={{ background: "#f0fdf4", color: "#16a34a", padding: "0.2rem 0.6rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: "600" }}>متوفر</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: "700", fontSize: "1.1rem", textAlign: "center", color: product.stock <= 5 ? "#dc2626" : "var(--text-main)" }}>
                    {editingId === product.id ? (
                      <input 
                        type="number" 
                        min="0" 
                        value={newStock} 
                        onChange={(e) => setNewStock(e.target.value)}
                        style={{ width: "80px", padding: "0.3rem", textAlign: "center", border: "1px solid var(--primary)", borderRadius: "var(--radius-md)" }}
                        autoFocus
                      />
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {editingId === product.id ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button 
                          onClick={() => handleUpdateStock(product.id)}
                          disabled={saving}
                          style={{ padding: "0.4rem 0.6rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          حفظ
                        </button>
                        <button 
                          onClick={() => { setEditingId(null); setNewStock(""); }}
                          style={{ padding: "0.4rem 0.6rem", background: "transparent", color: "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingId(product.id); setNewStock(product.stock.toString()); }}
                        style={{ padding: "0.4rem 0.8rem", background: "transparent", color: "var(--primary)", border: "1px solid var(--primary)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "0.85rem" }}
                      >
                        تعديل الكمية
                      </button>
                    )}
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
