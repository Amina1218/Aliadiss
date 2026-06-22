'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Truck, MapPin, Phone, User, Package } from 'lucide-react'
import { formatBirr } from '@/lib/utils'
import { ProductImage } from '@/components/shop/ProductImage'
import { useCart } from '@/components/shop/CartProvider'

interface CartLine {
  productId: string
  qty: number
  lineTotal: number
  product: {
    id: string
    title: string
    priceBirr: number
    category: string
    imageUrl?: string | null
    store: { name: string }
  }
}

const DELIVERY_OPTIONS = [
  { id: 'STANDARD', label: 'Standard delivery', desc: '3–5 business days', fee: 0 },
  { id: 'EXPRESS', label: 'Express delivery', desc: '1–2 business days', fee: 150 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { refresh, setCount } = useCart()
  const [items, setItems] = useState<CartLine[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [delivery, setDelivery] = useState({
    deliveryName: '',
    deliveryPhone: '',
    deliveryCity: 'Addis Ababa',
    deliveryAddress: '',
    deliveryMethod: 'STANDARD',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/cart')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items ?? [])
        setSubtotal(data.subtotal ?? 0)
        if (!data.items?.length) router.replace('/shop/cart')
      })
      .finally(() => setLoading(false))
  }, [router])

  const deliveryFee = delivery.deliveryMethod === 'EXPRESS' ? 150 : 0
  const total = subtotal + deliveryFee

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(delivery),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not place order')
        return
      }
      setCount(0)
      await refresh()
      toast.success('Order placed! Track delivery in My Orders.')
      router.push(`/shop/orders/${data.order.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) {
    return <div className="card p-12 text-center text-sm text-gray-400">Loading checkout…</div>
  }

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-5">
        <h1 className="font-display text-xl font-bold text-gray-900">Checkout</h1>

        <div className="card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-500" /> Order items
          </h2>
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <ProductImage src={item.product.imageUrl} category={item.product.category} alt={item.product.title} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{item.product.title}</p>
                <p className="text-xs text-gray-400">{item.product.store.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {item.qty} × {formatBirr(item.product.priceBirr)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">{formatBirr(item.lineTotal)}</p>
            </div>
          ))}
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-500" /> Delivery details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" /> Full name
              </label>
              <input required value={delivery.deliveryName} onChange={e => setDelivery(d => ({ ...d, deliveryName: e.target.value }))} className="input" placeholder="Recipient name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone
              </label>
              <input required value={delivery.deliveryPhone} onChange={e => setDelivery(d => ({ ...d, deliveryPhone: e.target.value }))} className="input" placeholder="+251 9XX XXX XXX" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> City
              </label>
              <input required value={delivery.deliveryCity} onChange={e => setDelivery(d => ({ ...d, deliveryCity: e.target.value }))} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Street address</label>
              <input required value={delivery.deliveryAddress} onChange={e => setDelivery(d => ({ ...d, deliveryAddress: e.target.value }))} className="input" placeholder="Sub-city, woreda, building, floor…" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium text-gray-700">Delivery method</p>
            {DELIVERY_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${delivery.deliveryMethod === opt.id ? 'border-orange-400 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={opt.id}
                    checked={delivery.deliveryMethod === opt.id}
                    onChange={() => setDelivery(d => ({ ...d, deliveryMethod: opt.id }))}
                    className="text-orange-500 focus:ring-orange-400"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">{opt.fee === 0 ? 'Free' : formatBirr(opt.fee)}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Delivery notes (optional)</label>
            <textarea
              value={delivery.notes}
              onChange={e => setDelivery(d => ({ ...d, notes: e.target.value }))}
              rows={2}
              placeholder="Gate code, landmarks, preferred time…"
              className="input resize-none"
            />
          </div>
        </div>
      </div>

      <div className="card p-6 h-fit lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Payment summary</h2>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatBirr(subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : formatBirr(deliveryFee)}</span></div>
          <div className="flex justify-between pt-2 border-t border-gray-100 font-display text-xl font-bold text-gray-900">
            <span>Total</span><span>{formatBirr(total)}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Cash on delivery or bank transfer arranged with the seller. Track your order status after placing.
        </p>
        <button type="button" onClick={placeOrder} disabled={placing} className="btn-primary w-full">
          {placing ? 'Placing order…' : 'Place order'}
        </button>
        <Link href="/shop/cart" className="btn-secondary w-full mt-2">Back to cart</Link>
      </div>
    </div>
  )
}
