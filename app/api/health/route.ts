import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota de diagnóstico temporária — remover depois de validar o deploy.
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_VERSION: process.version,
  };

  let db: { ok: boolean; error?: string } = { ok: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = { ok: true };
  } catch (e) {
    db = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return NextResponse.json({ env, db });
}
