import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Seller access only" }, { status: 403 });
  }

  const store = await prisma.store.findUnique({ where: { ownerId: session.sub } });
  if (!store || store.status !== "APPROVED") {
    return NextResponse.json({ error: "Your store must be approved first" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title, description, category, condition, priceBirr,
    warrantyType, warrantyMonths, imageUrl, stock,
    screenSizeIn, screenResolution, cameraMp, ramGb, processorType, batteryMah, storageGb,
  } = body;

  if (!title || !category || !priceBirr || !imageUrl) {
    return NextResponse.json({ error: "Title, category, price, and product photo are required" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      title, description, category, condition: condition || "New",
      priceBirr: Number(priceBirr),
      warrantyType: warrantyType || "NONE",
      warrantyMonths: Number(warrantyMonths) || 0,
      stock: Number(stock) || 1,
      imageUrl: imageUrl || null,
      screenSizeIn, screenResolution, cameraMp, ramGb, processorType, batteryMah, storageGb,
      storeId: store.id,
      status: "PENDING",
    },
  });

  return NextResponse.json(product);
}
