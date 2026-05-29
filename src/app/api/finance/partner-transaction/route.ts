import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user || (user.role === "MANAGER" && !user.permissions?.includes("FINANCE") && !user.permissions?.includes("ALL"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { partnerId, amount, type, description } = await request.json();

    if (!partnerId || !amount || !type) {
      return NextResponse.json(
        { error: "بيانات الحركة غير مكتملة" },
        { status: 400 }
      );
    }

    const transaction = await prisma.partnerTransaction.create({
      data: {
        partnerId,
        amount: parseFloat(amount),
        type, // "DEPOSIT" | "WITHDRAWAL"
        description: description || "",
      },
    });

    const actionText = type === "DEPOSIT" ? "إيداع رأس مال" : "سحب";
    await prisma.auditLog.create({
      data: {
        adminUserId: user.userId,
        action: "CREATE",
        entity: "PartnerTransaction",
        entityId: transaction.id,
        details: `تسجيل ${actionText} للشريك بمبلغ ${amount} ج.م ${description ? `(${description})` : ""}`,
      }
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة الحركة" },
      { status: 500 }
    );
  }
}
