import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// DELETE /api/admin/coupons/[id] - Delete a coupon (auth required)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "الكوبون غير موجود" },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({
      where: { id },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          adminUserId: user.userId,
          action: "DELETE_COUPON",
          entity: "Coupon",
          entityId: id,
          details: `تم حذف كوبون الخصم: ${coupon.code}`,
        },
      });
    } catch (auditErr) {
      console.error("Error creating audit log:", auditErr);
    }

    return NextResponse.json({ message: "تم حذف الكوبون بنجاح" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الكوبون" },
      { status: 500 }
    );
  }
}
