'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Truck, RefreshCw, Package, MapPin } from 'lucide-react'
import { formatBirr, formatDate } from '@/lib/utils'
import { ProductImage } from '@/components/shop/ProductImage'
import toast from 'react-hot-toast'

type Order = {
  id: string
  status: string
  totalBirr: number
  deliveryName: string | null
  deliveryPhone: string | null
  deliveryCity: string | null
  deliveryAddress: string | null
  deliveryMethod: string
  createdAt: string
  customer: { name: string; email: string }
  items: { qty: number; product: { title: string; imageUrl: string | null; category: string } }[]
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/seller/orders')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (orderId: string, status: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch('/api/seller/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        toast.success(`Order ${status.toLowerCase()}`)
        fetchOrders()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'DELIVERED') return <Badge variant="verified">{status}</Badge>
    if (status === 'SHIPPED') return <Badge variant="blue">{status}</Badge>
    return <Badge variant="pending">{status}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Fulfillment</p>
          <h1 className="font-display text-2xl font-bold text-gray-900">Orders to Deliver</h1>
          <p className="text-gray-500 text-sm mt-1">Ship products to customers and update delivery status</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Customer orders for your products will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    <ProductImage src={order.items[0]?.product.imageUrl} category={order.items[0]?.product.category} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</h3>
                      {statusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.items.map(i => `${i.qty}× ${i.product.title}`).join(', ')}</p>
                    <p className="text-sm font-bold text-orange-500 mt-1">{formatBirr(order.totalBirr)}</p>
                    <div className="mt-2 p-2.5 bg-orange-50/50 rounded-lg text-xs text-gray-600 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-orange-500" /> {order.deliveryName} · {order.deliveryPhone}</p>
                      <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-orange-500" /> {order.deliveryAddress}, {order.deliveryCity}</p>
                      <p className="text-gray-400">{formatDate(order.createdAt)} · {order.deliveryMethod}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:justify-center">
                  {['CONFIRMED', 'PENDING'].includes(order.status) && (
                    <button disabled={actionLoading === order.id} onClick={() => updateStatus(order.id, 'SHIPPED')} className="btn-primary text-sm py-1.5 px-4">
                      Mark shipped
                    </button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button disabled={actionLoading === order.id} onClick={() => updateStatus(order.id, 'DELIVERED')} className="btn-primary text-sm py-1.5 px-4">
                      Mark delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
