import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Seller access only" }, { status: 403 });
  }

  const store = await prisma.store.findUnique({
    where: { ownerId: session.sub },
    include: {
      products: { orderBy: { createdAt: "desc" } },
      _count: { select: { sales: true } },
    },
  });

  return NextResponse.json(store || null);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Seller access only" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, legalName, city, credentialsNote, legalCredentials } = body;
  const credentials = legalCredentials || credentialsNote;

  if (!name || !legalName || !city || !credentials) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const existing = await prisma.store.findUnique({ where: { ownerId: session.sub } });
  if (existing) {
    const updated = await prisma.store.update({
      where: { id: existing.id },
      data: { name, description, legalName, city, legalCredentials: credentials, status: "PENDING" },
    });
    return NextResponse.json(updated);
  }

  const store = await prisma.store.create({
    data: { name, description, legalName, city, legalCredentials: credentials, ownerId: session.sub },
  });

  return NextResponse.json(store);
}
