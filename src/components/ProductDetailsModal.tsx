"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/context/CartContext";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    name: string;
  };
}

interface ProductDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

interface ProductDetailsModalProps {
  productId: string;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const EMOJI_MAP: Record<string, string> = {
  "مانجو": "🥭",
  "فراولة": "🍓",
  "توت": "🫐",
  "تين": "🌰",
  "مشمش": "🍑",
  "تمر": "🌴",
  "زبيب": "🍇",
  "أناناس": "🍍",
  "جوز": "🥜",
  "لوز": "🌰",
  "كاجو": "🥜",
  "فستق": "🥜",
};

function getEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (name.includes(key)) return emoji;
  }
  return "🍎";
}

const StarIcon = ({ filled, size = 18 }: { filled: boolean; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "hsl(var(--primary-hue), 95%, 45%)" : "none"}
    stroke={filled ? "hsl(var(--primary-hue), 95%, 38%)" : "var(--text-muted)"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle", transition: "var(--transition)" }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function ProductDetailsModal({
  productId,
  onClose,
  onAddToCart,
}: ProductDetailsModalProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchProductReviews();
    const token = localStorage.getItem("customer_token");
    setIsCustomerLoggedIn(!!token);
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error("فشل في تحميل تفاصيل المنتج");
      const data = await res.json();
      setProduct(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductReviews = async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/storefront/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Error fetching reviews", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setReviewError("يجب تسجيل الدخول لإضافة تقييم 👤");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      const res = await fetch("/api/storefront/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل إرسال التقييم");
      }

      setReviewSuccess(true);
      setComment("");
      setRating(5);
      fetchProductReviews();
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : "عذراً، حدث خطأ أثناء إرسال التقييم");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div style={{ background: "var(--bg-card)", padding: "3rem", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
          <div className="spinner" style={{ borderTopColor: "var(--primary)", width: "36px", height: "36px" }} />
          <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>جاري تحميل التفاصيل...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="modal-overlay">
        <div style={{ background: "var(--bg-card)", padding: "2.5rem", borderRadius: "var(--radius-lg)", maxWidth: "450px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h3 style={{ color: "#dc2626", marginBottom: "1rem" }}>{error || "المنتج غير موجود"}</h3>
          <button className="btn-primary" onClick={onClose} style={{ width: "100%" }}>إغلاق</button>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const emoji = getEmoji(product.name);

  // Compute stars
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content-container"
        style={{
          maxWidth: "750px",
          width: "100%",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "var(--text-muted)",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background 0.2s",
            zIndex: 10
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border-color)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          ✕
        </button>

        {/* Two-column layout */}
        <div className="modal-grid-two-col" style={{ marginTop: "1rem" }}>
          
          {/* Column 1: Image & Basic Info */}
          <div>
            <div
              style={{
                height: "220px",
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "6rem",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "1.5rem",
              }}
            >
              <span style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.08))" }}>{emoji}</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--primary)" }}>
                {product.price} ج.م
              </div>

              <div>
                {outOfStock ? (
                  <span style={{ background: "#fee2e2", color: "#dc2626", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: "700" }}>
                    نفذ المخزون
                  </span>
                ) : (
                  <span style={{ background: "#dcfce7", color: "#16a34a", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: "700" }}>
                    متوفر في المخزن ({product.stock} وحدة)
                  </span>
                )}
              </div>

              <button
                className="btn-primary"
                disabled={outOfStock}
                onClick={() =>
                  onAddToCart({
                    id: product.id,
                    name: product.name,
                    description: product.description ?? "",
                    price: product.price,
                    imageUrl: product.imageUrl || "",
                    icon: getEmoji(product.name),
                  })
                }
                style={{
                  padding: "0.75rem",
                  fontSize: "1rem",
                  width: "100%",
                  marginTop: "0.5rem",
                  opacity: outOfStock ? 0.5 : 1,
                  cursor: outOfStock ? "not-allowed" : "pointer"
                }}
              >
                🛒 إضافة إلى السلة
              </button>
            </div>
          </div>

          {/* Column 2: Detailed Text & Tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.6rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                {product.name}
              </h2>
              
              {/* Stars Summary */}
              {reviews.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", gap: "2px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} filled={star <= Math.round(avgRating)} size={18} />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)", marginRight: "0.25rem" }}>
                    {avgRating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)" }}>
                    ({reviews.length} تقييم)
                  </span>
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  لا توجد تقييمات لهذا المنتج بعد.
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontWeight: "600", marginBottom: "0.4rem", fontSize: "0.95rem" }}>وصف المنتج:</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.7 }}>
                {product.description || "لا يوجد وصف متوفر لهذا المنتج."}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <h4 style={{ fontWeight: "700", marginBottom: "1rem", fontSize: "1.05rem" }}>💬 آراء وتقييمات العملاء</h4>

              {/* Reviews List */}
              {reviewsLoading ? (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>جاري تحميل التقييمات...</div>
              ) : reviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", marginBottom: "1rem" }}>
                  كن أول من يشتري ويقيّم هذا المنتج!
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "220px", overflowY: "auto", paddingLeft: "0.5rem", marginBottom: "1rem" }}>
                  {reviews.map((rev) => (
                    <div key={rev.id} className="review-bubble" style={{ display: "flex", flexDirection: "row", gap: "1rem", alignItems: "flex-start" }}>
                      <div className="reviewer-avatar">
                        {rev.customer.name ? rev.customer.name.charAt(0).toUpperCase() : "👤"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>{rev.customer.name}</span>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon key={star} filled={star <= rev.rating} size={14} />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-main)", lineHeight: 1.5 }}>{rev.comment}</p>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "left" }}>
                          {new Date(rev.createdAt).toLocaleDateString("ar-EG", { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Review Form */}
              <div style={{ background: "rgba(217, 119, 6, 0.03)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px dashed hsla(var(--primary-hue), 95%, 45%, 0.25)", marginTop: "1rem" }}>
                <h5 style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.5rem" }}>✍️ أضف تقييمك الخاص</h5>
                
                {!isCustomerLoggedIn ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    يجب عليك <a href="/login" style={{ color: "var(--primary)", fontWeight: "600" }}>تسجيل الدخول</a> لتقييم المنتج.
                  </p>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>التقييم بالنجوم:</span>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="star-btn"
                            title={`${star} نجوم`}
                          >
                            <StarIcon filled={star <= rating} size={24} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="اكتب رأيك هنا حول جودة المنتج..."
                      style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                        color: "inherit",
                        fontSize: "0.9rem",
                        transition: "var(--transition)"
                      }}
                    />

                    {reviewError && (
                      <div style={{ color: "#dc2626", fontSize: "0.85rem", fontWeight: "600" }}>
                        ❌ {reviewError}
                      </div>
                    )}

                    {reviewSuccess && (
                      <div style={{ color: "#16a34a", fontSize: "0.85rem", fontWeight: "600" }}>
                        ✅ تم نشر تقييمك بنجاح! شكراً لك.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary"
                      style={{
                        padding: "0.6rem 1.25rem",
                        fontSize: "0.9rem",
                        borderRadius: "var(--radius-full)",
                        fontWeight: "700"
                      }}
                    >
                      {submittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
