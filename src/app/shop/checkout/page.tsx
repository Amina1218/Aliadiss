'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatBirr, CATEGORY_EMOJI } from '@/lib/utils'
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
    store: { name: string }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { refresh, setCount } = useCart()
  const [items, setItems] = useState<CartLine[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

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

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not place order')
        return
      }
      setCount(0)
      await refresh()
      toast.success('Order placed successfully!')
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
      <div className="lg:col-span-2 space-y-4">
        <h1 className="font-display text-xl font-bold text-gray-900">Checkout</h1>

        <div className="card p-5 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center">
                <span className="text-2xl">{CATEGORY_EMOJI[item.product.category] ?? '📦'}</span>
              </div>
              <div className="flex-1">
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

        <div className="card p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Delivery notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add delivery instructions or phone number for the seller…"
            className="input resize-none"
          />
        </div>
      </div>

      <div className="card p-6 h-fit sticky top-24">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Payment summary</h2>
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <span>Total</span>
          <span className="font-display text-xl font-bold text-gray-900">{formatBirr(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          By placing this order, sellers receive payment minus Ali Addis commission (5% per store rate).
        </p>
        <button type="button" onClick={placeOrder} disabled={placing} className="btn-primary w-full">
          {placing ? 'Placing order…' : 'Place order'}
        </button>
        <Link href="/shop/cart" className="btn-secondary w-full mt-2">
          Back to cart
        </Link>
      </div>
    </div>
  )
}
