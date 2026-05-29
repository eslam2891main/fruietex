import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback_secret_change_me";

export async function POST(request: NextRequest) {
  try {
    const { name, phone, password } = await request.json();

    if (!name || !phone || !password) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing && existing.passwordHash) {
      return NextResponse.json({ error: "رقم الهاتف مسجل بالفعل" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let customer;
    if (existing) {
      customer = await prisma.customer.update({
        where: { id: existing.id },
        data: { name, passwordHash }
      });
    } else {
      customer = await prisma.customer.create({
        data: { name, phone, passwordHash }
      });
    }

    const token = jwt.sign({ customerId: customer.id, phone: customer.phone }, AUTH_SECRET, { expiresIn: '30d' });

    return NextResponse.json({ token, customer: { id: customer.id, name: customer.name, phone: customer.phone } }, { status: 201 });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء التسجيل" }, { status: 500 });
  }
}
