import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { resolveDatabaseUrl } from "../src/lib/database-url";

const adapter = new PrismaBetterSqlite3({
  url: resolveDatabaseUrl(),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 بدء إعداد قاعدة البيانات الشاملة...");

  // Delete all old data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shippingRate.deleteMany();
  await prisma.shippingCompany.deleteMany();
  await prisma.governorate.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.partnerTransaction.deleteMany();
  await prisma.partner.deleteMany();

  // Create default admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: { passwordHash },
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`✅ تم إنشاء/تحديث المستخدم الإداري: ${admin.username}`);

  // Create Partners
  const p1 = await prisma.partner.create({ data: { name: "إسلام", sharePercent: 60 } });
  const p2 = await prisma.partner.create({ data: { name: "نور", sharePercent: 40 } });
  
  // Add initial capital transactions
  await prisma.partnerTransaction.create({ data: { partnerId: p1.id, amount: 60000, type: "DEPOSIT", description: "رأس مال أولي" } });
  await prisma.partnerTransaction.create({ data: { partnerId: p2.id, amount: 40000, type: "DEPOSIT", description: "رأس مال أولي" } });
  console.log("✅ تم إضافة الشركاء ورأس المال");

  // Expenses
  await prisma.expense.create({ data: { title: "أكياس وعلب تغليف", amount: 1500, category: "PACKAGING" } });
  await prisma.expense.create({ data: { title: "حملة فيسبوك", amount: 2000, category: "MARKETING" } });
  console.log("✅ تم إضافة بعض المصروفات");

  // Governorates
  const cairo = await prisma.governorate.create({ data: { name: "القاهرة" } });
  const giza = await prisma.governorate.create({ data: { name: "الجيزة" } });
  const alex = await prisma.governorate.create({ data: { name: "الإسكندرية" } });

  // Shipping Companies
  const bosta = await prisma.shippingCompany.create({ data: { name: "بوسطة", phone: "19000" } });
  const aramex = await prisma.shippingCompany.create({ data: { name: "أرامكس", phone: "16996" } });

  // Shipping Rates
  await prisma.shippingRate.create({ data: { companyId: bosta.id, govId: cairo.id, cost: 50 } });
  await prisma.shippingRate.create({ data: { companyId: bosta.id, govId: giza.id, cost: 50 } });
  await prisma.shippingRate.create({ data: { companyId: bosta.id, govId: alex.id, cost: 70 } });
  
  await prisma.shippingRate.create({ data: { companyId: aramex.id, govId: cairo.id, cost: 60 } });
  await prisma.shippingRate.create({ data: { companyId: aramex.id, govId: alex.id, cost: 80 } });
  console.log("✅ تم إعداد المحافظات وشركات الشحن والأسعار");

  // Products with costPrice
  const products = [
    { name: "تمر مجدول فاخر", description: "تمر مجدول ممتاز من أجود المزارع المصرية، طري وحلو المذاق. عبوة 500 جرام.", price: 185, costPrice: 130, stock: 50, imageUrl: "🌴" },
    { name: "مشمش مجفف", description: "مشمش مجفف طبيعي بدون سكر مضاف، غني بالفيتامينات والألياف. عبوة 250 جرام.", price: 95, costPrice: 65, stock: 35, imageUrl: "🍑" },
    { name: "تين مجفف تركي", description: "تين مجفف فاخر مستورد من تركيا، طعم رائع ومغذي. عبوة 300 جرام.", price: 120, costPrice: 85, stock: 40, imageUrl: "🫐" },
    { name: "زبيب ذهبي", description: "زبيب ذهبي ممتاز، حلو المذاق ومثالي للطبخ والحلويات. عبوة 500 جرام.", price: 65, costPrice: 40, stock: 80, imageUrl: "🍇" },
    { name: "قراصيا (برقوق مجفف)", description: "قراصيا طبيعية غنية بالألياف، مفيدة للهضم والصحة العامة. عبوة 250 جرام.", price: 110, costPrice: 75, stock: 3, imageUrl: "🫐" },
    { name: "مانجو مجففة", description: "شرائح مانجو مجففة طبيعياً بدون مواد حافظة، وجبة خفيفة لذيذة. عبوة 200 جرام.", price: 145, costPrice: 100, stock: 2, imageUrl: "🥭" },
  ];

  const createdProducts = [];
  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    createdProducts.push(created);
  }
  console.log("✅ تم إضافة المنتجات مع حساب سعر التكلفة");

  // Customers
  const c1 = await prisma.customer.create({ data: { name: "أحمد محمد", phone: "01012345678", address: "15 شارع التحرير، القاهرة" } });
  const c2 = await prisma.customer.create({ data: { name: "فاطمة علي", phone: "01098765432", address: "8 شارع النيل، الجيزة" } });

  // Orders
  const orderItems1 = [
    { productId: createdProducts[0].id, quantity: 2, price: createdProducts[0].price },
    { productId: createdProducts[3].id, quantity: 1, price: createdProducts[3].price }
  ];
  const order1Amount = orderItems1.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await prisma.order.create({
    data: {
      customerId: c1.id,
      customerName: c1.name,
      customerPhone: c1.phone,
      customerAddress: c1.address,
      governorateId: cairo.id,
      shippingCompId: bosta.id,
      shippingCost: 50,
      totalAmount: order1Amount + 50,
      paymentMethod: "INSTAPAY",
      status: "COMPLETED",
      paymentStatus: "PAID",
      items: { create: orderItems1 }
    }
  });

  const orderItems2 = [
    { productId: createdProducts[1].id, quantity: 3, price: createdProducts[1].price },
    { productId: createdProducts[2].id, quantity: 1, price: createdProducts[2].price }
  ];
  const order2Amount = orderItems2.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await prisma.order.create({
    data: {
      customerId: c2.id,
      customerName: c2.name,
      customerPhone: c2.phone,
      customerAddress: c2.address,
      governorateId: giza.id,
      shippingCompId: bosta.id,
      shippingCost: 50,
      totalAmount: order2Amount + 50,
      paymentMethod: "VODAFONE_CASH",
      status: "PROCESSING",
      paymentStatus: "PAID",
      items: { create: orderItems2 }
    }
  });
  console.log("✅ تم إضافة العملاء والطلبات وتكلفة الشحن");

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountPercent: 10,
      usageLimit: 100,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
  await prisma.coupon.upsert({
    where: { code: "TABIEA50" },
    update: {},
    create: {
      code: "TABIEA50",
      discountAmount: 50,
      usageLimit: 200,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
    },
  });
  console.log("✅ تم إعداد كوبونات الخصم (WELCOME10, TABIEA50)");

  console.log("\n🎉 تم إعداد قاعدة البيانات بنجاح!");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
