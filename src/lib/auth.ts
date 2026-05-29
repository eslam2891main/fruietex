import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback_secret_change_me";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  permissions?: string;
}

export interface CustomerTokenPayload {
  customerId: string;
  phone?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, AUTH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    return jwt.verify(token, AUTH_SECRET) as CustomerTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract and verify token from Authorization header.
 * Returns the decoded payload or null if invalid/missing.
 */
export function authenticateRequest(
  request: NextRequest
): TokenPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}
