import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { completeOrderPayment } from '@/lib/payments'
import { initiateTelebirrPayment } from '@/lib/payments/telebirr'
import { initiateCbeBirrPayment } from '@/lib/payments/cbebirr'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: session.sub },
    include: { payment: true, items: { include: { product: true } } },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (!order.payment) return NextResponse.json({ error: 'No payment record' }, { status: 400 })
  if (order.payment.status === 'COMPLETED') {
    return NextResponse.json({ ok: true, redirectUrl: `/shop/orders/${order.id}`, alreadyPaid: true })
  }

  const description = `Ali Addis order #${order.id.slice(-8).toUpperCase()}`
  const input = {
    orderId: order.id,
    amountBirr: order.totalBirr,
    phone: order.paymentPhone || order.payment.phone,
    description,
  }

  try {
    let result
    if (order.paymentMethod === 'TELEBIRR') {
      result = await initiateTelebirrPayment(input)
    } else if (order.paymentMethod === 'CBE_BIRR') {
      result = await initiateCbeBirrPayment(input)
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { transactionId: result.transactionId },
    })

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      transactionId: result.transactionId,
      sandbox: result.sandbox,
      provider: result.provider,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment initiation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

/** Sandbox / return-url confirmation */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, transactionId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: session.sub },
    include: { payment: true },
  })

  if (!order?.payment) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.payment.status === 'COMPLETED') {
    return NextResponse.json({ ok: true, orderId, redirectUrl: `/shop/orders/${order.id}` })
  }

  const txn = transactionId || order.payment.transactionId || `PAY-${order.id.slice(-8)}`

  try {
    await completeOrderPayment(order.id, txn, txn)
    return NextResponse.json({ ok: true, orderId, redirectUrl: `/shop/orders/${order.id}` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
