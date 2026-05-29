"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StoreShell from "@/components/store/StoreShell";

type PublicCoupon = {
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
};

export default function OffersPage() {
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/storefront/coupons")
      .then((r) => r.json())
      .then((d) => setCoupons(d.coupons || []))
      .catch(() => setCoupons([]));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <StoreShell>
      <main className="container page-section">
        <div className="page-hero-sm offers-hero">
          <h1>🏷️ العروض وكوبونات الخصم</h1>
          <p>انسخ الكود واستخدمه عند إتمام الطلب من السلة</p>
        </div>

        <div className="offers-grid">
          {coupons.length === 0 ? (
            <>
              <OfferCard
                code="WELCOME10"
                title="خصم ترحيبي 10%"
                desc="للعملاء الجدد — صالح 30 يوماً"
                onCopy={copyCode}
                copied={copied}
              />
              <OfferCard
                code="FRUIETEX50"
                title="50 ج.م خصم ثابت"
                desc="على الطلبات فوق 200 ج.م"
                onCopy={copyCode}
                copied={copied}
              />
            </>
          ) : (
            coupons.map((c) => (
              <OfferCard
                key={c.code}
                code={c.code}
                title={
                  c.discountPercent
                    ? `خصم ${c.discountPercent}%`
                    : `خصم ${c.discountAmount} ج.م`
                }
                desc={
                  c.expiresAt
                    ? `ينتهي ${new Date(c.expiresAt).toLocaleDateString("ar-EG")}`
                    : "عرض محدود"
                }
                onCopy={copyCode}
                copied={copied}
              />
            ))
          )}
        </div>

        <div className="offers-cta glass-panel">
          <h3>جاهز للتسوق؟</h3>
          <Link href="/" className="btn-primary">
            تصفح المنتجات
          </Link>
        </div>
      </main>
    </StoreShell>
  );
}

function OfferCard({
  code,
  title,
  desc,
  onCopy,
  copied,
}: {
  code: string;
  title: string;
  desc: string;
  onCopy: (c: string) => void;
  copied: string | null;
}) {
  return (
    <div className="offer-card glass-panel">
      <div className="offer-card-badge">كوبون</div>
      <h3>{title}</h3>
      <p className="text-muted">{desc}</p>
      <div className="offer-code-box">
        <code>{code}</code>
        <button type="button" className="btn-primary" onClick={() => onCopy(code)}>
          {copied === code ? "تم النسخ ✓" : "نسخ"}
        </button>
      </div>
    </div>
  );
}
