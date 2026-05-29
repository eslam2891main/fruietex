# طبيعة — منصة تجارة إلكترونية

منصة Next.js لبيع الفواكه المجففة والمكسرات، مع لوحة تحكم إدارية كاملة.

## المتطلبات

- Node.js 20+
- npm

## الإعداد السريع

```bash
npm install
npm run db:setup
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) للمتجر و [http://localhost:3000/admin/login](http://localhost:3000/admin/login) للوحة التحكم.

## بيانات التجربة

| الحساب | المستخدم | كلمة المرور |
|--------|----------|-------------|
| الإدارة | `admin` | `admin123` |

كوبونات الخصم بعد `db:setup`: `WELCOME10` (10%)، `TABIEA50` (50 ج.م).

## متغيرات البيئة

أنشئ ملف `.env` في جذر المشروع:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ضع-سلسلة-عشوائية-طويلة-هنا"
```

## أوامر مفيدة

| الأمر | الوصف |
|-------|--------|
| `npm run dev` | تشغيل بيئة التطوير |
| `npm run build` | بناء الإنتاج |
| `npm run db:push` | مزامنة مخطط Prisma مع SQLite |
| `npm run db:seed` | تعبئة البيانات التجريبية |
| `npm run db:setup` | دفع المخطط + البذر + الكوبونات |
| `npm run lint` | فحص ESLint |

## هيكل المشروع

- `src/app/` — صفحات المتجر والإدارة وواجهات API
- `prisma/` — مخطط قاعدة البيانات والبذر
- `src/lib/` — Prisma، المصادقة، مسار قاعدة البيانات
"# fruietex" 
