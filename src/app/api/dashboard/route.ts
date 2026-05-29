import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/dashboard - Dashboard stats (auth required)
export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    // Total sales
    const orders = await prisma.order.findMany();
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;

    // Pending orders count
    const pendingOrders = orders.filter(
      (o) => o.status === "PENDING"
    ).length;

    // Unique customers (by phone)
    const uniquePhones = new Set(orders.map((o) => o.customerPhone));
    const totalCustomers = uniquePhones.size;

    // Low stock alerts (stock <= 5)
    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: 5 } },
      orderBy: { stock: "asc" },
    });

    // Recent orders (latest 10)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Monthly sales (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlySales = orders
      .filter((o) => o.createdAt >= startOfMonth)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Order status data
    const orderStatusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const orderStatusData = Object.keys(orderStatusCounts).map(status => ({
      name: status,
      value: orderStatusCounts[status]
    }));

    // Sales data (last 7 days)
    const salesData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayOrders = orders.filter(o => o.createdAt >= d && o.createdAt < nextDay);
      const daySales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      
      salesData.push({
        date: d.toLocaleDateString('ar-EG', { weekday: 'short' }),
        sales: daySales
      });
    }

    return NextResponse.json({
      totalSales,
      monthlySales,
      totalOrders,
      pendingOrders,
      totalCustomers,
      lowStockAlerts: lowStockProducts.length,
      lowStockProducts,
      recentOrders,
      salesData,
      orderStatusData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الإحصائيات" },
      { status: 500 }
    );
  }
}
