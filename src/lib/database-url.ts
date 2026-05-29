import path from "path";

/** Resolve SQLite file URL relative to project root (Next.js cwd can vary). */
export function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;

  const filePath = raw.slice("file:".length).replace(/^\/+/, "");
  if (path.isAbsolute(filePath)) return raw;

  const absolute = path.join(process.cwd(), filePath.replace(/^\.\//, ""));
  return `file:${absolute}`;
}
