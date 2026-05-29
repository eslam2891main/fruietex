import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/customers - Get all customers (auth required)
export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { orders: true }
        },
        orders: {
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    // Transform the response to include total spent
    const customersWithTotalSpent = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // We might want to remove the raw orders array from the response to save bandwidth
      const { orders, ...customerData } = customer;
      
      return {
        ...customerData,
        totalSpent
      };
    });

    return NextResponse.json(customersWithTotalSpent);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات العملاء" },
      { status: 500 }
    );
  }
}
