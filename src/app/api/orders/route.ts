import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  CART_COOKIE,
  CART_COOKIE_OPTIONS,
  parseCart,
  serializeCart,
} from '@/lib/cart'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { customerId: session.sub },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, title: true, category: true, imageUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cart = parseCart(req.cookies.get(CART_COOKIE)?.value)
  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const notes = typeof body.notes === 'string' ? body.notes.trim() || undefined : undefined

  const products = await prisma.product.findMany({
    where: {
      id: { in: cart.items.map((i) => i.productId) },
      status: 'VERIFIED',
      store: { status: 'APPROVED' },
    },
    include: { store: true },
  })

  const lineItems: { product: (typeof products)[0]; qty: number }[] = []

  for (const item of cart.items) {
    const product = products.find((p) => p.id === item.productId)
    if (!product) {
      return NextResponse.json({ error: 'One or more products are no longer available' }, { status: 400 })
    }
    if (product.stock < item.qty) {
      return NextResponse.json(
        { error: `Insufficient stock for "${product.title}" (${product.stock} left)` },
        { status: 400 }
      )
    }
    lineItems.push({ product, qty: item.qty })
  }

  const totalBirr = lineItems.reduce((sum, { product, qty }) => sum + product.priceBirr * qty, 0)

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerId: session.sub,
        totalBirr,
        notes,
        status: 'CONFIRMED',
        items: {
          create: lineItems.map(({ product, qty }) => ({
            productId: product.id,
            qty,
            unitPrice: product.priceBirr,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true, category: true } },
          },
        },
      },
    })

    for (const { product, qty } of lineItems) {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: qty } },
      })

      const amountBirr = product.priceBirr * qty
      const commissionRate = product.store.commissionRate
      const commissionBirr = Math.round(amountBirr * commissionRate * 100) / 100

      await tx.sale.create({
        data: {
          orderId: created.id,
          storeId: product.storeId,
          productId: product.id,
          amountBirr,
          commissionRate,
          commissionBirr,
        },
      })
    }

    return created
  })

  const res = NextResponse.json({ order }, { status: 201 })
  res.cookies.set(CART_COOKIE, serializeCart({ items: [] }), CART_COOKIE_OPTIONS)
  return res
}
