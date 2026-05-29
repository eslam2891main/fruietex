import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user || (user.role !== "ADMIN" && !user.permissions?.includes("ALL"))) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to recent 100 logs
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجل المراقبة" },
      { status: 500 }
    );
  }
}
