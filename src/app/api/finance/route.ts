import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });

    const partners = await prisma.partner.findMany({
      include: {
        transactions: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const completedOrders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // 1. Calculate Revenue & Product Costs (COGS)
    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of completedOrders) {
      totalRevenue += (order.totalAmount || 0) - (order.shippingCost || 0);
      for (const item of order.items) {
        totalCost += (item.quantity || 0) * (item.product.costPrice || 0);
      }
    }

    // 2. Calculate Expenses Category Breakdown & Totals
    let totalExpenses = 0;
    let salaryExpenses = 0;
    let marketingExpenses = 0;
    let packagingExpenses = 0;
    let generalExpenses = 0;

    for (const expense of expenses) {
      totalExpenses += expense.amount || 0;
      if (expense.category === "SALARY") {
        salaryExpenses += expense.amount || 0;
      } else if (expense.category === "MARKETING") {
        marketingExpenses += expense.amount || 0;
      } else if (expense.category === "PACKAGING") {
        packagingExpenses += expense.amount || 0;
      } else {
        generalExpenses += expense.amount || 0;
      }
    }

    // 3. Calculate True Net Profit & Gross Profit
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses; // Deduct operational expenses

    // 4. Calculate Partner Deposits & Withdrawals for Liquidity Cash
    let totalCapitalDeposits = 0;
    let totalWithdrawals = 0;

    for (const partner of partners) {
      for (const trans of partner.transactions) {
        if (trans.type === "DEPOSIT") {
          totalCapitalDeposits += trans.amount || 0;
        } else if (trans.type === "WITHDRAWAL") {
          totalWithdrawals += trans.amount || 0;
        }
      }
    }

    // Cash liquidity in the fund: Capital + Net Profit - Withdrawals
    // Or equivalently: Capital + Revenue - COGS - Expenses - Withdrawals
    const liquidity = totalCapitalDeposits + totalRevenue - totalCost - totalExpenses - totalWithdrawals;

    return NextResponse.json({
      expenses,
      partners,
      stats: {
        totalRevenue,
        totalCost,
        totalExpenses,
        grossProfit,
        netProfit,
        totalCapitalDeposits,
        totalWithdrawals,
        liquidity,
      },
      expensesBreakdown: {
        SALARY: salaryExpenses,
        MARKETING: marketingExpenses,
        PACKAGING: packagingExpenses,
        GENERAL: generalExpenses,
      }
    });
  } catch (error) {
    console.error("Error fetching finance data:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب البيانات المالية" },
      { status: 500 }
    );
  }
}
