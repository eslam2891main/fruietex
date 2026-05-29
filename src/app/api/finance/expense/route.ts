import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user || (user.role === "MANAGER" && !user.permissions?.includes("FINANCE") && !user.permissions?.includes("ALL"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { title, amount, category } = await request.json();

    if (!title || amount === undefined) {
      return NextResponse.json(
        { error: "العنوان والمبلغ مطلوبان" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        category: category || "GENERAL",
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: user.userId,
        action: "CREATE",
        entity: "Expense",
        entityId: expense.id,
        details: `إضافة مصروف جديد: ${title} بمبلغ ${amount} ج.م (تصنيف: ${category})`,
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة المصروف" },
      { status: 500 }
    );
  }
}
