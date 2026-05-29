import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

// GET /api/shipping - Get shipping resources (public)
export async function GET() {
  try {
    const governorates = await prisma.governorate.findMany();
    const companies = await prisma.shippingCompany.findMany();
    const rates = await prisma.shippingRate.findMany({
      include: {
        governorate: true,
        company: true,
      },
    });

    return NextResponse.json({
      governorates,
      companies,
      rates,
    });
  } catch (error) {
    console.error("Error fetching shipping data:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات الشحن" },
      { status: 500 }
    );
  }
}

// POST /api/shipping - Create a new shipping rate (auth required)
export async function POST(request: NextRequest) {
  const user = authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const { companyId, govId, cost } = await request.json();

    if (!companyId || !govId || cost === undefined) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      );
    }

    const rate = await prisma.shippingRate.upsert({
      where: {
        companyId_govId: {
          companyId,
          govId,
        },
      },
      update: {
        cost: Number(cost),
      },
      create: {
        companyId,
        govId,
        cost: Number(cost),
      },
      include: {
        company: true,
        governorate: true,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping rate:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء تسعيرة الشحن" },
      { status: 500 }
    );
  }
}
