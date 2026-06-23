import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: session.sub },
    include: {
      payment: true,
      items: {
        include: {
          product: { select: { id: true, title: true, category: true, imageUrl: true } },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ order })
}
