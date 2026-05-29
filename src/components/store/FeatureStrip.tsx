const FEATURES = [
  { icon: "🌿", title: "100% طبيعي", desc: "بدون إضافات صناعية" },
  { icon: "📦", title: "تغليف محكم", desc: "يحافظ على الطزاجة" },
  { icon: "🚚", title: "شحن سريع", desc: "لكل المحافظات" },
  { icon: "💳", title: "دفع مرن", desc: "كاش أو محافظ إلكترونية" },
];

export default function FeatureStrip() {
  return (
    <section className="feature-strip">
      <div className="container feature-strip-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card">
            <span className="feature-icon">{f.icon}</span>
            <div>
              <strong>{f.title}</strong>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
