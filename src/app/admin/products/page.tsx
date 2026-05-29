"use client";

import { useEffect, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  costPrice: number;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
}

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  costPrice: "",
  stock: "",
  imageUrl: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const getToken = () => localStorage.getItem("admin_token") || "";

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProducts(data);
    } catch {
      console.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const headers = {
      name: "اسم المنتج",
      description: "الوصف",
      price: "سعر البيع (ج.م)",
      costPrice: "سعر التكلفة (ج.م)",
      stock: "المخزون الحالي",
      createdAt: "تاريخ الإضافة"
    };

    const formattedData = products.map(p => ({
      name: p.name,
      description: p.description || "لا يوجد",
      price: p.price,
      costPrice: p.costPrice || 0,
      stock: p.stock,
      createdAt: new Date(p.createdAt).toLocaleDateString("ar-EG")
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
    link.setAttribute("download", `products_report_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchProducts();
        resetForm();
      }
    } catch {
      console.error("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
      }
    } catch {
      console.error("Error deleting product");
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      costPrice: product.costPrice ? product.costPrice.toString() : "0",
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(emptyProduct);
    setEditingProduct(null);
    setShowForm(false);
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
    transition: "var(--transition)",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
        <p style={{ color: "var(--text-muted)" }}>جاري تحميل المنتجات...</p>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="🍇 المنتجات"
        subtitle={`إدارة جميع المنتجات (${products.length} منتج)`}
        action={
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{ fontFamily: "inherit", fontSize: "0.9rem" }}
          >
            ➕ إضافة منتج
          </button>
        </div>
        }
      />

      {/* Add/Edit Product Form */}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: "600" }}>
              {editingProduct ? "✏️ تعديل المنتج" : "➕ إضافة منتج جديد"}
            </h2>
            <button
              onClick={resetForm}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="مثال: تمر مجدول فاخر"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  الأيقونة / رابط الصورة
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="🌴 أو رابط صورة"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  السعر (ج.م) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  سعر التكلفة (ج.م) *
                </label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, costPrice: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.4rem",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  المخزون *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  required
                  min="0"
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                }}
              >
                الوصف
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                rows={3}
                placeholder="وصف مختصر للمنتج..."
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "80px",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
                style={{
                  fontFamily: "inherit",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? "جاري الحفظ..."
                  : editingProduct
                  ? "💾 حفظ التعديلات"
                  : "➕ إضافة المنتج"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-color)",
                  background: "transparent",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: "500",
                }}
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="glass-panel"
            style={{
              padding: "1.5rem",
              borderRadius: "var(--radius-lg)",
              transition: "var(--transition)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Product Header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(217,119,6,0.08)",
                  borderRadius: "var(--radius-md)",
                  flexShrink: 0,
                }}
              >
                {product.imageUrl || "📦"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                  }}
                >
                  {product.name}
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    lineHeight: "1.5",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {product.description || "بدون وصف"}
                </p>
              </div>
            </div>

            {/* Price & Stock */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "rgba(217,119,6,0.04)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.15rem",
                  }}
                >
                  السعر
                </div>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    color: "var(--primary)",
                  }}
                >
                  {product.price.toLocaleString("ar-EG")} ج.م
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  التكلفة: {product.costPrice ? product.costPrice.toLocaleString("ar-EG") : 0} ج.م
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: "0.15rem",
                  }}
                >
                  المخزون
                </div>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "700",
                    color:
                      product.stock <= 5
                        ? "#dc2626"
                        : "var(--secondary)",
                  }}
                >
                  {product.stock}
                  {product.stock <= 5 && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        marginRight: "0.25rem",
                      }}
                    >
                      ⚠️
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginTop: "auto",
              }}
            >
              <button
                onClick={() => startEdit(product)}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--primary)",
                  background: "transparent",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: "500",
                  fontSize: "0.9rem",
                  transition: "var(--transition)",
                }}
              >
                ✏️ تعديل
              </button>
              {deleteConfirm === product.id ? (
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{
                      padding: "0.6rem 0.9rem",
                      borderRadius: "var(--radius-md)",
                      border: "none",
                      background: "#dc2626",
                      color: "white",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: "600",
                      fontSize: "0.8rem",
                    }}
                  >
                    تأكيد
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: "0.6rem 0.9rem",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      background: "transparent",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "0.8rem",
                    }}
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(product.id)}
                  style={{
                    padding: "0.6rem 0.9rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: "500",
                    fontSize: "0.9rem",
                    transition: "var(--transition)",
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "4rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</div>
            <p>لا توجد منتجات حتى الآن. أضف أول منتج!</p>
          </div>
        )}
      </div>
    </div>
  );
}
