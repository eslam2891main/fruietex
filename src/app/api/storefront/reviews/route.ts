import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomerToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const decoded = verifyCustomerToken(token);
  if (!decoded?.customerId) {
    return NextResponse.json({ error: "جلسة منتهية" }, { status: 401 });
  }

  try {
    const { productId, rating, comment } = await request.json();

    if (!productId || !rating) {
      return NextResponse.json({ error: "المنتج والتقييم مطلوبان" }, { status: 400 });
    }

    // Check if the user has bought the product
    const orders = await prisma.order.findMany({
      where: {
        customerId: decoded.customerId,
        status: "COMPLETED",
        items: { some: { productId } }
      }
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "لا يمكنك تقييم منتج لم تقم بشرائه واستلامه" }, { status: 403 });
    }

    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { customerId: decoded.customerId, productId }
    });

    if (existing) {
      return NextResponse.json({ error: "لقد قمت بتقييم هذا المنتج مسبقاً" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        customerId: decoded.customerId,
        productId,
        rating: parseInt(rating),
        comment
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Review Error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

// GET /api/storefront/reviews?productId=... - Fetch all reviews for a specific product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "معرف المنتج مطلوب" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب التقييمات" },
      { status: 500 }
    );
  }
}
