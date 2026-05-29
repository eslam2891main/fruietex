import StoreFooter from "@/components/store/StoreFooter";
import Link from "next/link";

const VALUES = [
  {
    icon: "🌱",
    title: "مصدر موثوق",
    text: "نختار موردينا بعناية ونفحص كل دفعة قبل التعبئة.",
  },
  {
    icon: "⚖️",
    title: "أوزان دقيقة",
    text: "كل عبوة موزونة بدقة مع ملصق واضح بالمحتوى والتاريخ.",
  },
  {
    icon: "♻️",
    title: "تغليف مستدام",
    text: "أكياس قابلة للإغلاق تحافظ على القرمشة والطعم أطول.",
  },
  {
    icon: "🤝",
    title: "شراكة مع المزارعين",
    text: "ندعم إنتاجاً محلياً ونضمن عدالة في التسعير.",
  },
];

export default function AboutPage() {
  return (
    <div className="store-page">
      <header className="store-header glass-panel">
        <div className="container store-header-inner">
          <Link href="/" className="store-brand">
            <span className="store-brand-icon">🍇</span>
            <span className="store-brand-text">fruietex</span>
          </Link>
          <Link href="/" className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.9rem" }}>
            العودة للمتجر
          </Link>
        </div>
      </header>

      <main className="container page-section">
        <section className="about-hero">
          <h1>قصة fruietex 🍇</h1>
          <p>
            بدأنا من شغف بسيط ونبيل: تقديم فواكه مجففة غنية ومكسرات طازجة مقرمشة بجودة يثق بها كل بيت. اليوم، تجمع منصة فرويتكس (fruietex) بين المذاق الطبيعي الفاخر، وتكنولوجيا قياس السعرات والفوائد التفاعلية، مع التزام تام بالعدالة والشفافية التامة في التسعير والشحن.
          </p>
        </section>

        <section className="values-grid">
          {VALUES.map((v) => (
            <div key={v.title} className="value-card glass-panel">
              <span className="value-icon">{v.icon}</span>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </section>

        <section className="about-timeline glass-panel">
          <h2>رحلتنا</h2>
          <ol>
            <li>
              <strong>2024</strong> — إطلاق أول تشكيلة فواكه مجففة محلية
            </li>
            <li>
              <strong>2025</strong> — توسيع خط المكسرات والتمور
            </li>
            <li>
              <strong>2026</strong> — منصة رقمية متكاملة للطلب والتوصيل والإدارة
            </li>
          </ol>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}
