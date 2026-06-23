import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { publishedProductWhere } from '@/lib/products'
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
      payment: true,
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
  const {
    deliveryName,
    deliveryPhone,
    deliveryCity,
    deliveryAddress,
    deliveryMethod = 'STANDARD',
    paymentMethod,
    paymentPhone,
  } = body

  if (!deliveryName?.trim() || !deliveryPhone?.trim() || !deliveryCity?.trim() || !deliveryAddress?.trim()) {
    return NextResponse.json({ error: 'Complete delivery address is required' }, { status: 400 })
  }

  if (!paymentMethod || !['TELEBIRR', 'CBE_BIRR'].includes(paymentMethod)) {
    return NextResponse.json({ error: 'Select Telebirr or CBE Birr to pay' }, { status: 400 })
  }

  const payPhone = (paymentPhone || deliveryPhone).trim()
  if (!payPhone) {
    return NextResponse.json({ error: 'Payment phone number is required' }, { status: 400 })
  }

  const deliveryFee = deliveryMethod === 'EXPRESS' ? 150 : 0

  const products = await prisma.product.findMany({
    where: {
      id: { in: cart.items.map((i) => i.productId) },
      ...publishedProductWhere,
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

  const totalBirr =
    lineItems.reduce((sum, { product, qty }) => sum + product.priceBirr * qty, 0) + deliveryFee

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerId: session.sub,
        totalBirr,
        notes,
        deliveryName: deliveryName.trim(),
        deliveryPhone: deliveryPhone.trim(),
        deliveryCity: deliveryCity.trim(),
        deliveryAddress: deliveryAddress.trim(),
        deliveryMethod,
        deliveryFee,
        paymentMethod,
        paymentPhone: payPhone,
        status: 'PENDING',
        items: {
          create: lineItems.map(({ product, qty }) => ({
            productId: product.id,
            qty,
            unitPrice: product.priceBirr,
          })),
        },
        payment: {
          create: {
            method: paymentMethod,
            amountBirr: totalBirr,
            phone: payPhone,
            status: 'PENDING',
          },
        },
      },
      include: {
        payment: true,
        items: {
          include: {
            product: { select: { id: true, title: true, category: true } },
          },
        },
      },
    })

    return created
  })

  const res = NextResponse.json({ order }, { status: 201 })
  res.cookies.set(CART_COOKIE, serializeCart({ items: [] }), CART_COOKIE_OPTIONS)
  return res
}
