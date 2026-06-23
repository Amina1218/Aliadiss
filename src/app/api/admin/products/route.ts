import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const products = await prisma.product.findMany({
    where: status ? { status: status as any } : {},
    include: { store: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { productId, status, rejectionReason } = await req.json()
  const product = await prisma.product.update({ where: { id: productId }, data: { status, rejectionReason } })
  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 })

  const [orderItems, sales] = await Promise.all([
    prisma.orderItem.count({ where: { productId } }),
    prisma.sale.count({ where: { productId } }),
  ])

  if (orderItems > 0 || sales > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        status: 'REJECTED',
        stock: 0,
        rejectionReason: 'Removed from marketplace by admin',
      },
    })
    return NextResponse.json({ ok: true, softDeleted: true })
  }

  await prisma.product.delete({ where: { id: productId } })
  return NextResponse.json({ ok: true })
}
