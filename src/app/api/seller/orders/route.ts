import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'STORE_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({ where: { ownerId: session.sub } })
  if (!store) return NextResponse.json([])

  const orders = await prisma.order.findMany({
    where: {
      items: { some: { product: { storeId: store.id } } },
    },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      items: {
        where: { product: { storeId: store.id } },
        include: { product: { select: { title: true, imageUrl: true, category: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(orders)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'STORE_OWNER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, status } = await req.json()
  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { ownerId: session.sub } })
  if (!store) return NextResponse.json({ error: 'No store found' }, { status: 404 })

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      items: { some: { product: { storeId: store.id } } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  if (!['SHIPPED', 'DELIVERED'].includes(status)) {
    return NextResponse.json({ error: 'Sellers can only mark orders as SHIPPED or DELIVERED' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  return NextResponse.json(updated)
}
