import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/storefront/orders/track?phone=01xxxxxxxxx — تتبع الطلبات بالهاتف */
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone")?.trim();

  if (!phone || phone.length < 10) {
    return NextResponse.json(
      { error: "رقم الهاتف مطلوب (10 أرقام على الأقل)" },
      { status: 400 }
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: true } },
        governorate: true,
        shippingCompany: true,
        coupon: true,
      },
    });

    return NextResponse.json({ orders, count: orders.length });
  } catch (error) {
    console.error("Track orders error:", error);
    return NextResponse.json({ error: "حدث خطأ في البحث" }, { status: 500 });
  }
}
