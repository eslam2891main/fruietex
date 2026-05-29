import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/orders - Get all orders (auth required)
export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        governorate: true,
        shippingCompany: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الطلبات" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create an order (public - from storefront)
export async function POST(request: NextRequest) {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      governorateId,
      shippingCompId,
      shippingCost = 0,
      paymentMethod,
      items,
      couponCode,
    } = await request.json();

    if (!customerName || !customerPhone || !paymentMethod || !items?.length) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    // Handle customer upsert (check by phone)
    let customer = await prisma.customer.findUnique({
      where: { phone: customerPhone },
    });

    if (customer) {
      if (customerAddress) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { address: customerAddress },
        });
      }
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress || null,
        },
      });
    }

    // Validate items and calculate subTotal
    let subTotal = 0;
    const orderItems: { productId: string; quantity: number; price: number }[] =
      [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `المنتج ${item.productId} غير موجود` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `الكمية المطلوبة من ${product.name} غير متوفرة` },
          { status: 400 }
        );
      }

      const itemPrice = item.price !== undefined ? item.price : product.price;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: itemPrice,
      });

      subTotal += itemPrice * item.quantity;
    }

    // Validate Coupon if couponCode is provided
    let couponId: string | null = null;
    let discount = 0;

    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: cleanCode },
      });

      if (!coupon) {
        return NextResponse.json(
          { error: "كوبون الخصم غير صحيح ❌" },
          { status: 400 }
        );
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "عذراً، هذا الكوبون منتهي الصلاحية ⏰" },
          { status: 400 }
        );
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json(
          { error: "عذراً، تم استخدام هذا الكوبون للحد الأقصى المسموح ⚠️" },
          { status: 400 }
        );
      }

      couponId = coupon.id;
      if (coupon.discountPercent) {
        discount = (subTotal * coupon.discountPercent) / 100;
      } else if (coupon.discountAmount) {
        discount = Math.min(coupon.discountAmount, subTotal);
      }
    }

    const totalAmount = Math.max(0, subTotal - discount) + shippingCost;

    // Create order with items and update stock
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerId: customer.id,
          customerName,
          customerPhone,
          customerAddress: customerAddress || null,
          governorateId: governorateId || null,
          shippingCompId: shippingCompId || null,
          shippingCost,
          totalAmount,
          paymentMethod,
          couponId,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          coupon: true,
        },
      });

      // Update stock for each product
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // If coupon was used, increment usedCount
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء الطلب" },
      { status: 500 }
    );
  }
}
