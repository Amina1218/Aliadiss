'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Truck, MapPin, Phone, User, Package, CreditCard, Smartphone } from 'lucide-react'
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

const PAYMENT_OPTIONS = [
  {
    id: 'TELEBIRR',
    label: 'Telebirr',
    desc: 'Pay with your Ethio Telecom Telebirr wallet',
    icon: Smartphone,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  {
    id: 'CBE_BIRR',
    label: 'CBE Birr',
    desc: 'Pay with Commercial Bank of Ethiopia Birr',
    icon: CreditCard,
    color: 'bg-blue-50 border-blue-200 text-blue-800',
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { refresh, setCount } = useCart()
  const [items, setItems] = useState<CartLine[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [form, setForm] = useState({
    deliveryName: '',
    deliveryPhone: '',
    deliveryCity: 'Addis Ababa',
    deliveryAddress: '',
    deliveryMethod: 'STANDARD',
    paymentMethod: 'TELEBIRR',
    paymentPhone: '',
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

  const deliveryFee = form.deliveryMethod === 'EXPRESS' ? 150 : 0
  const total = subtotal + deliveryFee

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not create order')
        return
      }

      setCount(0)
      await refresh()

      const initRes = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.order.id }),
      })
      const initData = await initRes.json()

      if (!initRes.ok) {
        toast.error(initData.error ?? 'Could not start payment')
        router.push(`/shop/orders/${data.order.id}`)
        return
      }

      toast.success('Redirecting to payment…')
      window.location.href = initData.redirectUrl
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
        <div>
          <h1 className="font-display text-xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">Complete delivery details and pay securely with Telebirr or CBE Birr.</p>
        </div>

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
              <input required value={form.deliveryName} onChange={e => setForm(f => ({ ...f, deliveryName: e.target.value }))} className="input" placeholder="Recipient name" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone
              </label>
              <input required value={form.deliveryPhone} onChange={e => setForm(f => ({ ...f, deliveryPhone: e.target.value, paymentPhone: f.paymentPhone || e.target.value }))} className="input" placeholder="09XX XXX XXX" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> City
              </label>
              <input required value={form.deliveryCity} onChange={e => setForm(f => ({ ...f, deliveryCity: e.target.value }))} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Street address</label>
              <input required value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} className="input" placeholder="Sub-city, woreda, building, floor…" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium text-gray-700">Delivery method</p>
            {DELIVERY_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${form.deliveryMethod === opt.id ? 'border-orange-400 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <input type="radio" name="deliveryMethod" value={opt.id} checked={form.deliveryMethod === opt.id} onChange={() => setForm(f => ({ ...f, deliveryMethod: opt.id }))} className="text-orange-500 focus:ring-orange-400" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900">{opt.fee === 0 ? 'Free' : formatBirr(opt.fee)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-500" /> Payment method
          </h2>
          <p className="text-sm text-gray-500">Choose how you want to pay. You will be redirected to complete payment on your phone.</p>

          <div className="space-y-2">
            {PAYMENT_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.paymentMethod === opt.id ? 'border-orange-400 bg-orange-50/50 ring-1 ring-orange-200' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <input type="radio" name="paymentMethod" value={opt.id} checked={form.paymentMethod === opt.id} onChange={() => setForm(f => ({ ...f, paymentMethod: opt.id }))} className="text-orange-500 focus:ring-orange-400" />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.color}`}>
                  <opt.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Payment phone number</label>
            <input
              required
              value={form.paymentPhone}
              onChange={e => setForm(f => ({ ...f, paymentPhone: e.target.value }))}
              className="input"
              placeholder="Telebirr / CBE Birr registered number"
            />
            <p className="text-xs text-gray-400 mt-1">Must match the wallet linked to your chosen payment method.</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Delivery notes (optional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Gate code, landmarks…" className="input resize-none" />
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
          Pay with Telebirr or CBE Birr. Your order is confirmed only after successful payment.
        </p>
        <button type="button" onClick={placeOrder} disabled={placing} className="btn-primary w-full">
          {placing ? 'Processing…' : `Pay ${formatBirr(total)}`}
        </button>
        <Link href="/shop/cart" className="btn-secondary w-full mt-2">Back to cart</Link>
      </div>
    </div>
  )
}
