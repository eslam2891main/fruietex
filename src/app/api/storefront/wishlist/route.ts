import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomerToken } from "@/lib/auth";

/** GET — قائمة معرفات المنتجات في المفضلة */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ productIds: [] });
  }

  const decoded = verifyCustomerToken(authHeader.slice(7));
  if (!decoded?.customerId) {
    return NextResponse.json({ productIds: [] });
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { customerId: decoded.customerId },
    include: { items: { select: { productId: true } } },
  });

  const productIds = wishlist?.items.map((i) => i.productId) ?? [];
  return NextResponse.json({ productIds });
}

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
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    // Find or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { customerId: decoded.customerId },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { customerId: decoded.customerId }
      });
    }

    // Check if item exists
    const existing = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId }
    });

    if (existing) {
      // Remove it (Toggle functionality)
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ message: "تمت الإزالة من المفضلة", added: false });
    } else {
      // Add it
      await prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId }
      });
      return NextResponse.json({ message: "تمت الإضافة للمفضلة", added: true });
    }
  } catch (error) {
    console.error("Wishlist Error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
