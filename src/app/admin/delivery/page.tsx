'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Truck, RefreshCw, Package } from 'lucide-react'
import { formatBirr, formatDate } from '@/lib/utils'
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
  customer: { name: string; email: string; phone: string | null }
  items: { product: { title: string; store: { name: string } } }[]
}

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/orders')
    if (res.ok) setOrders(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [])

  const updateStatus = async (orderId: string, status: string) => {
    setActionLoading(orderId)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        toast.success(`Order marked as ${status}`)
        fetchOrders()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'DELIVERED') return <Badge variant="verified">{status}</Badge>
    if (status === 'CANCELLED') return <Badge variant="rejected">{status}</Badge>
    if (status === 'SHIPPED') return <Badge variant="blue">{status}</Badge>
    return <Badge variant="pending">{status}</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Fulfillment</p>
          <h1 className="font-display text-2xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and update order delivery status</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-sm text-gray-400">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-display font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</h3>
                    {statusBadge(order.status)}
                    <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-orange-500 mt-1">{formatBirr(order.totalBirr)} · {order.deliveryMethod}</p>
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm space-y-1">
                    <p className="flex items-center gap-2 text-gray-700">
                      <Truck className="w-4 h-4 text-orange-500" />
                      {order.deliveryName} · {order.deliveryPhone || order.customer.phone || '—'}
                    </p>
                    <p className="text-gray-600">{order.deliveryAddress}, {order.deliveryCity}</p>
                    <p className="text-gray-500 text-xs">{order.items.map(i => i.product.title).join(', ')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'CONFIRMED' && (
                    <button disabled={actionLoading === order.id} onClick={() => updateStatus(order.id, 'SHIPPED')} className="btn-primary text-sm py-1.5 px-4">
                      Mark shipped
                    </button>
                  )}
                  {order.status === 'SHIPPED' && (
                    <button disabled={actionLoading === order.id} onClick={() => updateStatus(order.id, 'DELIVERED')} className="btn-primary text-sm py-1.5 px-4">
                      Mark delivered
                    </button>
                  )}
                  {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                    <button disabled={actionLoading === order.id} onClick={() => updateStatus(order.id, 'CANCELLED')} className="btn-danger text-sm py-1.5 px-4">
                      Cancel
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
