"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart, Product } from "@/context/CartContext";
import ProductDetailsModal from "@/components/ProductDetailsModal";
import StoreShell from "@/components/store/StoreShell";
import FeatureStrip from "@/components/store/FeatureStrip";
import ProductCard, { StoreProduct } from "@/components/store/ProductCard";
import { CATEGORIES, getEmoji, getProductCategory } from "@/lib/product-utils";
import { useTheme } from "@/components/store/useTheme";
import { useToast } from "@/context/ToastContext";

const NUTRITION_DATABASE: Record<string, { calories: number; protein: number; fiber: number; benefit: string; emoji: string }> = {
  "مانجو": { calories: 277, protein: 2.0, fiber: 6.7, benefit: "طاقة فورية غنية بالألياف وفيتامين C، ممتاز للهضم والمناعة 🥭", emoji: "🥭" },
  "فراولة": { calories: 241, protein: 2.5, fiber: 7.2, benefit: "مضاد للأكسدة وممتاز لصحة الخلايا والبشرة بمحتواه العالي 🍓", emoji: "🍓" },
  "توت": { calories: 299, protein: 3.1, fiber: 8.5, benefit: "ينشط الذاكرة ويعزز التركيز وصحة القلب بمضادات الأكسدة 🫐", emoji: "🫐" },
  "تين": { calories: 249, protein: 3.3, fiber: 9.8, benefit: "غني جداً بالكالسيوم، ممتاز لصحة العظام وصحة الأسنان 🌰", emoji: "🌰" },
  "مشمش": { calories: 241, protein: 1.4, fiber: 7.3, benefit: "غني بفيتامين A، ممتاز لصحة العينين، نضارة الجلد وحيوية البشرة 🍑", emoji: "🍑" },
  "تمر": { calories: 277, protein: 1.8, fiber: 6.7, benefit: "طاقة لحظية طبيعية، يعزز الهضم وصحة الدماغ ويحارب الأنيميا 🌴", emoji: "🌴" },
  "زبيب": { calories: 299, protein: 3.0, fiber: 3.7, benefit: "غني بالحديد، يمنع فقر الدم ويعزز تدفق الدم والنشاط الذهني 🍇", emoji: "🍇" },
  "أناناس": { calories: 282, protein: 2.1, fiber: 5.8, benefit: "يحتوي على إنزيم البروميلين، يساعد في الهضم ويسرع الشفاء 🍍", emoji: "🍍" },
  "جوز": { calories: 654, protein: 15.2, fiber: 6.7, benefit: "طعام الدماغ الأمثل، غني جداً بأوميجا 3 ويعزز صحة الشرايين 🥜", emoji: "🥜" },
  "لوز": { calories: 579, protein: 21.2, fiber: 12.5, benefit: "غني بفيتامين E ومضادات الأكسدة، ممتاز لتعديل الكوليسترول وصحة القلب 🌰", emoji: "🌰" },
  "كاجو": { calories: 553, protein: 18.2, fiber: 3.3, benefit: "يمد الجسم بالماغنسيوم، ممتاز لبناء العظام وتقليل التعب 🥜", emoji: "🥜" },
  "فستق": { calories: 562, protein: 20.2, fiber: 10.3, benefit: "صديق للرشاقة والتحكم بالوزن، يحسن صحة بطانة الأوعية الدموية 🥜", emoji: "🥜" },
};

const getNutritionInfo = (name: string) => {
  for (const [key, info] of Object.entries(NUTRITION_DATABASE)) {
    if (name.includes(key)) return info;
  }
  return { calories: 280, protein: 2.0, fiber: 6.0, benefit: "منتج طبيعي غني بالفيتامينات والمعادن الهامة لصحة ونشاط الجسم 🌱", emoji: "🍎" };
};

export default function Home() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [sortBy, setSortBy] = useState("default");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceMax, setPriceMax] = useState(500);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Calculator States
  const [calcProductId, setCalcProductId] = useState("");
  const [calcWeight, setCalcWeight] = useState(100);

  useEffect(() => {
    if (products.length > 0 && !calcProductId) {
      setCalcProductId(products[0].id);
    }
  }, [products, calcProductId]);

  const handleCalcAddToCart = () => {
    const apiProduct = products.find(p => p.id === calcProductId);
    if (!apiProduct) return;
    addToCart({
      id: apiProduct.id,
      name: `${apiProduct.name} (${calcWeight} جم)`,
      description: `وجبة مخصصة بوزن ${calcWeight} جم`,
      price: parseFloat((apiProduct.price * (calcWeight / 100)).toFixed(2)),
      imageUrl: "",
      icon: getEmoji(apiProduct.name),
    });
    showToast(`تمت إضافة ${apiProduct.name} (${calcWeight} جم) إلى السلة`);
  };

  const maxPrice = useMemo(
    () => Math.max(500, ...products.map((p) => p.price), 0),
    [products]
  );

  useEffect(() => {
    setPriceMax(maxPrice);
  }, [maxPrice]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("فشل في تحميل المنتجات");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    try {
      const res = await fetch("/api/storefront/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWishlistIds(new Set(data.productIds || []));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
  }, []);

  const handleAddToCart = (apiProduct: StoreProduct) => {
    const product: Product = {
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description ?? "",
      price: apiProduct.price,
      imageUrl: "",
      icon: getEmoji(apiProduct.name),
    };
    addToCart(product);
    showToast(`تمت إضافة «${product.name}» إلى السلة`);
  };

  const handleToggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem("customer_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/storefront/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (data.added) next.add(productId);
        else next.delete(productId);
        return next;
      });
    } catch {
      /* ignore */
    }
  };

  const filteredProducts = products
    .filter((product) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(q) ||
        (product.description?.toLowerCase().includes(q) ?? false);
      const cat =
        selectedCategory === "الكل" ||
        getProductCategory(product.name) === selectedCategory;
      const matchesStock = !inStockOnly || product.stock > 0;
      const matchesPrice = product.price <= priceMax;
      return matchesSearch && cat && matchesStock && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
      return 0;
    });

  const featured = [...products].filter((p) => p.stock > 0).slice(0, 4);

  return (
    <StoreShell>
      <main className="container">
        <section className="home-hero">
          <div className="home-hero-content">
            <span className="home-hero-badge">✨ وجبات ذكية من الطبيعة</span>
            <h1>فرويتكس | فخامة الفواكه المجففة والمكسرات الفاخرة 🥭🍓</h1>
            <p>
              اكتشف طعم الفخامة الحقيقي ونقاء الغذاء مع فرويتكس (fruietex). نوفر لك تشكيلة ملكية من أرقى الفواكه المجففة الغنية، المكسرات المقرمشة، والتمور الفاخرة المنتقاة حبة بحبة، طبيعية 100% وبدون أي إضافات صناعية أو سكريات مضافة لترافق نمط حياتك المتوازن.
            </p>
            <div className="home-hero-actions">
              <a href="#products" className="btn-primary">
                تسوق صحتك الآن
              </a>
              <a href="/offers" className="btn-secondary">
                🏷️ كوبونات وعروض ممتازة
              </a>
            </div>
          </div>
          <div className="home-hero-visual" aria-hidden>
            🥭🍓🥜🌴
          </div>
        </section>

        <FeatureStrip />

        {/* 🥑 Fruietex Healthy Nutrition Calculator Section */}
        {products.length > 0 && (
          <section className="featured-section" style={{ marginTop: "3rem", marginBottom: "3rem" }}>
            <h2 className="section-title">🥑 حاسبة fruietex الذكية للغذاء والصحة</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              اختر مكونك المفضل وحدد الكمية بالجرام لاستكشاف السعرات الحرارية، البروتينات، والفوائد الصحية المذهلة لجسمك!
            </p>

            {(() => {
              const selectedCalcProductObj = products.find(p => p.id === calcProductId) || products[0];
              const nutrition = selectedCalcProductObj ? getNutritionInfo(selectedCalcProductObj.name) : { calories: 280, protein: 2.0, fiber: 6.0, benefit: "منتج طبيعي غني بالفيتامينات والمعادن 🌱", emoji: "🍎" };
              const calculatedCalories = ((nutrition.calories * calcWeight) / 100).toFixed(0);
              const calculatedProtein = ((nutrition.protein * calcWeight) / 100).toFixed(1);
              const calculatedFiber = ((nutrition.fiber * calcWeight) / 100).toFixed(1);

              return (
                <div className="glass-panel" style={{ padding: "2rem", borderRadius: "var(--radius-lg)", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2.5rem", alignItems: "center" }}>
                  
                  {/* Inputs Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>🌱 اختر المكون الطبيعي:</label>
                      <select 
                        value={calcProductId} 
                        onChange={(e) => setCalcProductId(e.target.value)}
                        style={{ padding: "0.75rem 1rem", width: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-card)", color: "inherit", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" }}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {getEmoji(p.name)} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontWeight: "700", fontSize: "0.9rem" }}>
                        <span>⚖️ حدد الكمية المطلوبة:</span>
                        <span style={{ color: "var(--primary)", fontWeight: "800", fontFamily: "var(--font-numbers)" }}>{calcWeight} جم</span>
                      </label>
                      <input 
                        type="range" 
                        min="50" 
                        max="500" 
                        step="50"
                        value={calcWeight} 
                        onChange={(e) => setCalcWeight(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", fontFamily: "var(--font-numbers)" }}>
                        <span>50 جم</span>
                        <span>250 جم</span>
                        <span>500 جم</span>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleCalcAddToCart}
                      className="btn-primary" 
                      style={{ width: "100%", padding: "0.8rem", fontSize: "1rem", borderRadius: "var(--radius-full)", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                    >
                      🛒 إضافة هذه الحصة الذكية للسلة ({parseFloat((selectedCalcProductObj.price * (calcWeight / 100)).toFixed(2))} ج.م)
                    </button>
                  </div>

                  {/* Outputs Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
                      
                      {/* Calories badge */}
                      <div className="glass-panel" style={{ flex: 1, padding: "1rem", textAlign: "center", borderRadius: "var(--radius-md)", borderRight: "4px solid #ef4444" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>🔥</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>السعرات الحرارية</div>
                        <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ef4444", fontFamily: "var(--font-numbers)", marginTop: "0.25rem" }}>{calculatedCalories} <span style={{ fontSize: "0.75rem" }}>kcal</span></div>
                      </div>

                      {/* Protein badge */}
                      <div className="glass-panel" style={{ flex: 1, padding: "1rem", textAlign: "center", borderRadius: "var(--radius-md)", borderRight: "4px solid #3b82f6" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>💪</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>البروتينات</div>
                        <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#3b82f6", fontFamily: "var(--font-numbers)", marginTop: "0.25rem" }}>{calculatedProtein} <span style={{ fontSize: "0.75rem" }}>جم</span></div>
                      </div>

                      {/* Fiber badge */}
                      <div className="glass-panel" style={{ flex: 1, padding: "1rem", textAlign: "center", borderRadius: "var(--radius-md)", borderRight: "4px solid #f59e0b" }}>
                        <div style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>🌾</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>الألياف الغذائية</div>
                        <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#f59e0b", fontFamily: "var(--font-numbers)", marginTop: "0.25rem" }}>{calculatedFiber} <span style={{ fontSize: "0.75rem" }}>جم</span></div>
                      </div>

                    </div>

                    {/* Health Benefit Text Box */}
                    <div style={{ background: "rgba(22, 163, 74, 0.04)", border: "1px dashed rgba(22, 163, 74, 0.3)", borderRadius: "var(--radius-md)", padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "2rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))", flexShrink: 0 }}>🌱</span>
                      <div>
                        <strong style={{ display: "block", color: "var(--secondary)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>الفوائد الصحية المعتمدة:</strong>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-main)", lineHeight: "1.6" }}>
                          {nutrition.benefit}
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })()}
          </section>
        )}

        {featured.length > 0 && (
          <section className="featured-section">
            <h2 className="section-title">⭐ الأكثر طلباً</h2>
            <div className="featured-scroll">
              {featured.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className="featured-chip"
                  onClick={() => setSelectedProductId(p.id)}
                >
                  <span>{getEmoji(p.name)}</span>
                  <span>{p.name}</span>
                  <strong>{p.price} ج.م</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        <section id="products" className="products-section">
          <div className="section-header-row">
            <h2 className="section-title">منتجاتنا</h2>
            <div className="view-toggle">
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
              >
                ⊞ شبكة
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
              >
                ☰ قائمة
              </button>
            </div>
          </div>

          <div className="filters-panel glass-panel">
            <div className="filters-row">
              <div className="category-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={selectedCategory === cat ? "pill active" : "pill"}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 ابحث عن منتج..."
              />
            </div>

            <div className="filters-row filters-row-secondary">
              <label className="filter-control">
                ترتيب:
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="default">الافتراضي</option>
                  <option value="price_asc">السعر ↑</option>
                  <option value="price_desc">السعر ↓</option>
                  <option value="name">الاسم</option>
                </select>
              </label>

              <label className="filter-control price-slider">
                حتى {priceMax} ج.م
                <input
                  type="range"
                  min={10}
                  max={maxPrice}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                />
              </label>

              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                متوفر فقط
              </label>
            </div>
          </div>

          <p className="results-count">
            {loading ? "..." : `${filteredProducts.length} منتج`}
          </p>

          {loading && (
            <div className="loading-state">
              <div className="spinner-lg" />
              <p>جاري التحميل...</p>
            </div>
          )}

          {error && !loading && (
            <div className="alert alert-error">
              {error}
              <button type="button" className="btn-primary" onClick={fetchProducts}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="empty-state">
              <span>📦</span>
              <p>لا توجد منتجات مطابقة</p>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <div className={viewMode === "grid" ? "products-grid" : "products-list"}>
              {filteredProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  darkMode={darkMode}
                  viewMode={viewMode}
                  inWishlist={wishlistIds.has(product.id)}
                  onOpen={() => setSelectedProductId(product.id)}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleWishlist={(e) => handleToggleWishlist(product.id, e)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedProductId && (
        <ProductDetailsModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
          onAddToCart={(p) => {
            addToCart(p);
            showToast(`تمت إضافة «${p.name}» إلى السلة`);
          }}
        />
      )}
    </StoreShell>
  );
}
