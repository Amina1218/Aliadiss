import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 1. CRUCIAL FIX: Forces Next.js to treat this endpoint as dynamic
export const dynamic = 'force-dynamic'

// 2. Added 'req: NextRequest' here so Next.js knows it handles incoming requests dynamically
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { title: true, store: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderId, status } = await req.json()
  if (!orderId || !status) {
    return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 })
  }

  const allowed = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  return NextResponse.json(order)
}