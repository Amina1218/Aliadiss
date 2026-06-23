import { prisma } from '@/lib/db'

export type PaymentProvider = 'TELEBIRR' | 'CBE_BIRR'

export function isPaymentSandbox() {
  return process.env.PAYMENT_MODE !== 'production'
}

export function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
}

/** Finalize a pending order after successful payment */
export async function completeOrderPayment(orderId: string, transactionId: string, providerRef?: string) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            items: { include: { product: { include: { store: true } } } },
          },
        },
      },
    })

    if (!payment) throw new Error('Payment not found')
    if (payment.status === 'COMPLETED') return payment

    const order = payment.order
    if (order.status === 'CANCELLED') throw new Error('Order was cancelled')

    for (const item of order.items) {
      if (item.product.stock < item.qty) {
        throw new Error(`Insufficient stock for "${item.product.title}"`)
      }
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        transactionId,
        providerRef,
        paidAt: new Date(),
      },
    })

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    })

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      })

      const amountBirr = item.unitPrice * item.qty
      const commissionRate = item.product.store.commissionRate
      const commissionBirr = Math.round(amountBirr * commissionRate * 100) / 100

      await tx.sale.create({
        data: {
          orderId: order.id,
          storeId: item.product.storeId,
          productId: item.productId,
          amountBirr,
          commissionRate,
          commissionBirr,
        },
      })
    }

    return tx.payment.findUnique({
      where: { id: payment.id },
      include: { order: true },
    })
  })
}

export async function failOrderPayment(orderId: string, reason: string) {
  return prisma.payment.update({
    where: { orderId },
    data: { status: 'FAILED', failureReason: reason },
  })
}
