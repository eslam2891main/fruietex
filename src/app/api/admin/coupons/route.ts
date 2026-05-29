import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/admin/coupons - List all coupons (auth required)
export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الكوبونات" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create a new coupon (auth required)
export async function POST(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const {
      code,
      discountPercent,
      discountAmount,
      usageLimit,
      expiresAt,
    } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "رمز الكوبون مطلوب" },
        { status: 400 }
      );
    }

    if (!discountPercent && !discountAmount) {
      return NextResponse.json(
        { error: "يجب تحديد إما نسبة الخصم أو مبلغ الخصم" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "رمز الكوبون هذا موجود بالفعل" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          adminUserId: user.userId,
          action: "CREATE_COUPON",
          entity: "Coupon",
          entityId: coupon.id,
          details: `تم إنشاء كوبون خصم جديد: ${coupon.code} (خصم: ${
            coupon.discountPercent
              ? `${coupon.discountPercent}%`
              : `${coupon.discountAmount} ج.م`
          })`,
        },
      });
    } catch (auditErr) {
      console.error("Error creating audit log:", auditErr);
    }

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الكوبون" },
      { status: 500 }
    );
  }
}
