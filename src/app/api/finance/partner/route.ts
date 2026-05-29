import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user || (user.role === "MANAGER" && !user.permissions?.includes("FINANCE") && !user.permissions?.includes("ALL"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { name, sharePercent } = await request.json();

    if (!name || sharePercent === undefined) {
      return NextResponse.json({ error: "الاسم والنسبة مطلوبان" }, { status: 400 });
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        sharePercent: parseFloat(sharePercent),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminUserId: user.userId,
        action: "CREATE",
        entity: "Partner",
        entityId: partner.id,
        details: `إضافة شريك جديد: ${name} بنسبة ${sharePercent}%`,
      }
    });

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json({ error: "حدث خطأ في إضافة الشريك" }, { status: 500 });
  }
}
