import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🌱 بدء شحن أكواد كوبونات الخصم...");

  // Upsert WELCOME10 (10% off)
  const c1 = await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountPercent: 10,
      usageLimit: 100,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days expiry
    },
  });
  console.log(`✅ تم إعداد كوبون الخصم: ${c1.code} (${c1.discountPercent}% خصم مئوي)`);

  // Upsert TABIEA50 (50 EGP flat off)
  const c2 = await prisma.coupon.upsert({
    where: { code: "TABIEA50" },
    update: {},
    create: {
      code: "TABIEA50",
      discountAmount: 50,
      usageLimit: 200,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days expiry
    },
  });
  console.log(`✅ تم إعداد كوبون الخصم: ${c2.code} (${c2.discountAmount} ج.م خصم ثابت)`);

  console.log("🎉 تم شحن الكوبونات بنجاح!");
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
