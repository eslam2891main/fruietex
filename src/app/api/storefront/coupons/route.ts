import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET — كوبونات نشطة للعرض في صفحة العروض */
export async function GET() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        code: true,
        discountPercent: true,
        discountAmount: true,
        expiresAt: true,
        usageLimit: true,
        usedCount: true,
      },
    });

    const active = coupons.filter(
      (c) => c.usageLimit === null || c.usedCount < c.usageLimit
    );

    return NextResponse.json({ coupons: active });
  } catch (error) {
    console.error("Public coupons error:", error);
    return NextResponse.json({ coupons: [] });
  }
}
