import { NextRequest, NextResponse } from 'next/server'
import { completeOrderPayment } from '@/lib/payments'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const transactionId = body.outTradeNo || body.transactionId
    const status = body.tradeStatus || body.status

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction reference' }, { status: 400 })
    }

    if (status && !['SUCCESS', 'COMPLETED', 'PAID', 'success'].includes(String(status))) {
      return NextResponse.json({ ok: false, message: 'Payment not successful' })
    }

    const payment = await prisma.payment.findFirst({ where: { transactionId } })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    await completeOrderPayment(payment.orderId, transactionId, body.tradeNo || body.providerRef)

    return NextResponse.json({ ok: true, orderId: payment.orderId })
  } catch (error) {
    console.error('Telebirr webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
