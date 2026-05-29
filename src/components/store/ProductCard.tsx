"use client";

import {
  CARD_COLORS,
  getEmoji,
  getProductCategory,
} from "@/lib/product-utils";

export type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
};

type ProductCardProps = {
  product: StoreProduct;
  index: number;
  darkMode: boolean;
  viewMode: "grid" | "list";
  inWishlist: boolean;
  onOpen: () => void;
  onAddToCart: () => void;
  onToggleWishlist: (e: React.MouseEvent) => void;
};

export default function ProductCard({
  product,
  index,
  darkMode,
  viewMode,
  inWishlist,
  onOpen,
  onAddToCart,
  onToggleWishlist,
}: ProductCardProps) {
  const bgColor = CARD_COLORS[index % CARD_COLORS.length];
  const emoji = getEmoji(product.name);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <article
      className={`product-card animate-fade-in ${viewMode === "list" ? "product-card-list" : ""}`}
      onClick={onOpen}
      style={{
        opacity: outOfStock ? 0.65 : 1,
        animationDelay: `${index * 0.04}s`,
      }}
    >
      <div
        className="product-card-visual"
        style={{
          background: darkMode
            ? `linear-gradient(135deg, ${bgColor}15 0%, ${bgColor}08 100%)`
            : `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}99 100%)`,
        }}
      >
        <span className="product-emoji">{emoji}</span>
        {outOfStock ? (
          <span className="product-badge badge-danger">نفذ المخزون</span>
        ) : lowStock ? (
          <span className="product-badge badge-warning">متبقي {product.stock}</span>
        ) : product.stock > 30 ? (
          <span className="product-badge badge-success">الأكثر مبيعاً</span>
        ) : null}

        <button
          type="button"
          className={`wishlist-btn ${inWishlist ? "active" : ""}`}
          onClick={onToggleWishlist}
          title={inWishlist ? "إزالة من المفضلة" : "أضف للمفضلة"}
        >
          {inWishlist ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="product-card-body">
        <span className="product-category-tag">{getProductCategory(product.name)}</span>
        <h4>{product.name}</h4>
        <p>{product.description || "منتج طبيعي مختار بعناية من فريق طبيعة."}</p>
        <div className="product-card-footer">
          <span className="product-price">{product.price} ج.م</span>
          <button
            type="button"
            className="btn-primary"
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!outOfStock) onAddToCart();
            }}
          >
            {outOfStock ? "غير متوفر" : "أضف للسلة"}
          </button>
        </div>
      </div>
    </article>
  );
}
