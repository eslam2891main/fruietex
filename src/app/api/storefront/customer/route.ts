import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomerToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
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
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: { include: { product: true } },
          }
        },
        wishlist: {
          include: {
            items: { include: { product: true } }
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
