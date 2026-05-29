import Link from "next/link";

export default function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="container store-footer-grid">
        <div className="store-footer-col">
          <div className="store-brand" style={{ marginBottom: "0.75rem" }}>
            <span className="store-brand-icon">🍇</span>
            <span className="store-brand-text">fruietex</span>
          </div>
          <p className="store-footer-desc">
            بوابتك الفاخرة للغذاء الصحي النقي. نختار لك بعناية فائقة أفضل ثمار الطبيعة من فواكه مجففة غنية ومكسرات مقرمشة وتمر فاخر لترافق نمط حياتك الصحي المتوازن.
          </p>
        </div>

        <div className="store-footer-col">
          <h4>روابط سريعة</h4>
          <ul className="store-footer-links">
            <li>
              <Link href="/">تسوق الآن</Link>
            </li>
            <li>
              <Link href="/offers">كوبونات وعروض</Link>
            </li>
            <li>
              <Link href="/track">تتبع طلبك</Link>
            </li>
            <li>
              <Link href="/about">قصتنا</Link>
            </li>
          </ul>
        </div>

        <div className="store-footer-col">
          <h4>تواصل معنا</h4>
          <ul className="store-footer-links">
            <li>📞 01000000000</li>
            <li>📧 info@fruietex.com</li>
            <li>🕐 يومياً 9 ص — 10 م</li>
            <li>🚚 توصيل 2–5 أيام عمل</li>
          </ul>
        </div>

        <div className="store-footer-col">
          <h4>لماذا fruietex؟</h4>
          <ul className="store-footer-links">
            <li>✅ طبيعي 100% وبدون سكر مضاف</li>
            <li>✅ تغليف محكم يحفظ النكهة والقرمشة</li>
            <li>✅ قيمة غذائية مثالية محسوبة بدقة</li>
            <li>✅ دعم فني ودود وسريع عبر الواتساب</li>
          </ul>
        </div>
      </div>

      <div className="store-footer-bottom container">
        <p>© {new Date().getFullYear()} fruietex. جميع الحقوق محفوظة.</p>
        <Link href="/admin/login">لوحة الإدارة</Link>
      </div>
    </footer>
  );
}
