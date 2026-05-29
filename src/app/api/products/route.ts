import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/products - Get all products (public)
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب المنتجات" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a product (auth required)
export async function POST(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { name, description, price, costPrice, stock, imageUrl } =
      await request.json();

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "الاسم والسعر مطلوبان" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice) || 0,
        stock: parseInt(stock) || 0,
        imageUrl: imageUrl || null,
      },
    });

    if (user && user.userId) {
      await prisma.auditLog.create({
        data: {
          adminUserId: user.userId,
          action: "CREATE",
          entity: "Product",
          entityId: product.id,
          details: `إضافة منتج جديد: ${name} بسعر ${price} ج.م`,
        }
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء المنتج" },
      { status: 500 }
    );
  }
}
