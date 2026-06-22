import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft } from 'lucide-react'
import { formatBirr, formatDate, CATEGORY_EMOJI } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

async function getOrder(id: string, userId: string) {
  return prisma.order.findFirst({
    where: { id, customerId: userId },
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
}

function statusVariant(status: string) {
  if (status === 'DELIVERED') return 'verified'
  if (status === 'CANCELLED') return 'rejected'
  return 'pending'
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const order = await getOrder(params.id, session.sub)
  if (!order) notFound()

  return (
    <div className="animate-fade-in space-y-6">
      <Link href="/shop/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400">Order #{order.id.slice(-8).toUpperCase()}</p>
            <h1 className="font-display text-2xl font-bold text-gray-900 mt-1">{formatBirr(order.totalBirr)}</h1>
            <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
        </div>
        {order.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
            <span className="font-medium text-gray-700">Notes: </span>
            {order.notes}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-display text-sm font-bold text-gray-900">Order items</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="p-5 flex gap-4">
              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
                <span className="text-2xl">{CATEGORY_EMOJI[item.product.category] ?? '📦'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/product/${item.product.id}`} className="font-medium text-gray-900 hover:text-orange-600">
                  {item.product.title}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  Sold by{' '}
                  <Link href={`/shop/stores/${item.product.store.id}`} className="text-orange-500 hover:text-orange-600">
                    {item.product.store.name}
                  </Link>{' '}
                  · {item.product.store.city}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {item.qty} × {formatBirr(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">{formatBirr(item.qty * item.unitPrice)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
