import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "الرمز مطلوب" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "كوبون الخصم هذا غير صحيح ❌" },
        { status: 404 }
      );
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "عذراً، هذا الكوبون منتهي الصلاحية ⏰" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "عذراً، تم استخدام هذا الكوبون للحد الأقصى المسموح ⚠️" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: coupon.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount: coupon.discountAmount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التحقق من الكوبون" },
      { status: 500 }
    );
  }
}
