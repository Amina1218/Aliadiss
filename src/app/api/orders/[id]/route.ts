import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: { id: string }
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: {
      id: params.id,
      customerId: session.sub,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: { select: { id: true, name: true, city: true } },
            },
          },
        },
      },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json(order)
}
