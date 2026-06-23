import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Truck, MapPin, Phone, User, CheckCircle, Package, Clock, CreditCard } from 'lucide-react'
import { formatBirr, formatDate } from '@/lib/utils'
import { ProductImage } from '@/components/shop/ProductImage'
import { PayNowButton } from '@/components/shop/PayNowButton'

interface PageProps {
  params: { id: string }
}

async function getOrder(id: string, userId: string) {
  return prisma.order.findFirst({
    where: { id, customerId: userId },
    include: {
      payment: true,
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
  if (status === 'SHIPPED') return 'blue'
  return 'pending'
}

const DELIVERY_STEPS = [
  { key: 'CONFIRMED', label: 'Order confirmed', icon: CheckCircle },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Package },
]

function stepIndex(status: string) {
  if (status === 'DELIVERED') return 2
  if (status === 'SHIPPED') return 1
  if (status === 'CONFIRMED' || status === 'PENDING') return 0
  return -1
}

function paymentLabel(method: string | null | undefined) {
  if (method === 'TELEBIRR') return 'Telebirr'
  if (method === 'CBE_BIRR') return 'CBE Birr'
  return '—'
}

function paymentStatusVariant(status: string) {
  if (status === 'COMPLETED') return 'verified'
  if (status === 'FAILED' || status === 'CANCELLED') return 'rejected'
  return 'pending'
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) redirect('/login')

  const order = await getOrder(params.id, session.sub)
  if (!order) notFound()

  const currentStep = stepIndex(order.status)
  const cancelled = order.status === 'CANCELLED'
  const awaitingPayment = order.payment?.status === 'PENDING' && order.status === 'PENDING'

  return (
    <div className="animate-fade-in space-y-6">
      <Link href="/shop/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-orange-500 transition-colors">
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
      </div>

      {awaitingPayment && (
        <div className="card p-5 border-orange-200 bg-orange-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                Payment required
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Pay {formatBirr(order.totalBirr)} via {paymentLabel(order.paymentMethod)} to confirm this order.
              </p>
            </div>
            <PayNowButton orderId={order.id} className="btn-primary whitespace-nowrap" />
          </div>
        </div>
      )}

      {order.payment && (
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold text-gray-900 mb-3">Payment</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={paymentStatusVariant(order.payment.status)}>{order.payment.status}</Badge>
            <span className="text-gray-600">{paymentLabel(order.paymentMethod || order.payment.method)}</span>
            {order.payment.phone && <span className="text-gray-400">· {order.payment.phone}</span>}
            {order.payment.transactionId && (
              <span className="text-gray-400 text-xs">Ref: {order.payment.transactionId}</span>
            )}
          </div>
        </div>
      )}

      {!cancelled && !awaitingPayment && (
        <div className="card p-6">
          <h2 className="font-display text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-500" /> Delivery tracking
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between">
            {DELIVERY_STEPS.map((step, i) => {
              const done = i <= currentStep
              const active = i === currentStep
              const Icon = step.icon
              return (
                <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'} ${active ? 'ring-4 ring-orange-100' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {order.deliveryAddress && (
        <div className="card p-5">
          <h2 className="font-display text-sm font-bold text-gray-900 mb-3">Delivery address</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2"><User className="w-4 h-4 text-orange-500" /> {order.deliveryName}</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-500" /> {order.deliveryPhone}</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-500" /> {order.deliveryAddress}, {order.deliveryCity}</p>
            <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> {order.deliveryMethod} delivery{order.deliveryFee > 0 ? ` · ${formatBirr(order.deliveryFee)}` : ''}</p>
          </div>
        </div>
      )}

      {order.notes && (
        <div className="card p-4 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Notes: </span>{order.notes}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <h2 className="font-display text-sm font-bold text-gray-900">Order items</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item) => (
            <div key={item.id} className="p-5 flex gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <ProductImage src={item.product.imageUrl} category={item.product.category} alt={item.product.title} />
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/product/${item.product.id}`} className="font-medium text-gray-900 hover:text-orange-600">
                  {item.product.title}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  Sold by{' '}
                  <Link href={`/shop/stores/${item.product.store.id}`} className="text-orange-500 hover:text-orange-600">
                    {item.product.store.name}
                  </Link>
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
