import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Package } from 'lucide-react'
import { formatBirr, formatDate } from '@/lib/utils'

async function getOrders(userId: string) {
  return prisma.order.findMany({
    where: { customerId: userId },
    include: {
      items: {
        include: {
          product: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

function statusVariant(status: string) {
  if (status === 'DELIVERED') return 'verified'
  if (status === 'CANCELLED') return 'rejected'
  return 'pending'
}

export default async function OrdersPage() {
  const session = await getSession()
  if (!session) return null

  const orders = await getOrders(session.sub)

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-gray-900">My orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {orders.length} order{orders.length !== 1 ? 's' : ''} placed
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-medium text-gray-700">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Your purchase history will appear here</p>
          <Link href="/shop/products" className="btn-primary">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/shop/orders/${order.id}`}
              className="card p-5 block hover:shadow-card-hover hover:border-orange-100 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatBirr(order.totalBirr)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                    {order.items.map((i) => i.product.title).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:text-right">
                  <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
