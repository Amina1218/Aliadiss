'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
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
    stock: number
    category: string
    imageUrl?: string | null
    store: { name: string; city: string }
  }
}

export default function CartPage() {
  const { refresh, setCount } = useCart()
  const [items, setItems] = useState<CartLine[]>([])
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadCart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart')
      const data = await res.json()
      setItems(data.items ?? [])
      setSubtotal(data.subtotal ?? 0)
      setCount(data.count ?? 0)
    } catch {
      toast.error('Could not load cart')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const updateQty = async (productId: string, qty: number) => {
    setUpdating(productId)
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not update cart')
        return
      }
      setItems(data.items ?? [])
      setSubtotal(data.subtotal ?? 0)
      setCount(data.count ?? 0)
      await refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (productId: string) => {
    setUpdating(productId)
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      const data = await res.json()
      setItems(data.items ?? [])
      setSubtotal(data.subtotal ?? 0)
      setCount(data.count ?? 0)
      toast.success('Removed from cart')
      await refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center text-sm text-gray-400">Loading cart…</div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="card p-16 text-center animate-fade-in">
        <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="text-sm text-gray-400 mt-2 mb-6">Browse verified products and add items to checkout</p>
        <Link href="/shop/products" className="btn-primary">Browse products</Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="font-display text-xl font-bold text-gray-900">Shopping cart</h1>

        {items.map((item) => (
          <div key={item.productId} className="card p-4 flex gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <ProductImage src={item.product.imageUrl} category={item.product.category} alt={item.product.title} emojiClassName="text-3xl" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/shop/product/${item.product.id}`} className="font-semibold text-gray-900 hover:text-orange-600 line-clamp-2">
                {item.product.title}
              </Link>
              <p className="text-xs text-gray-400 mt-1">
                {item.product.store.name} · {item.product.store.city}
              </p>
              <p className="font-display font-bold text-gray-900 mt-2">{formatBirr(item.product.priceBirr)}</p>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    disabled={updating === item.productId}
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-medium">{item.qty}</span>
                  <button
                    type="button"
                    disabled={updating === item.productId || item.qty >= item.product.stock}
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    className="p-2 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={updating === item.productId}
                  onClick={() => removeItem(item.productId)}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Line total</p>
              <p className="font-display font-bold text-gray-900">{formatBirr(item.lineTotal)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 h-fit sticky top-24">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Order summary</h2>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal</span>
          <span className="font-semibold">{formatBirr(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-6">5% platform commission is calculated per item at checkout</p>
        <Link href="/shop/checkout" className="btn-primary w-full">
          Proceed to checkout
        </Link>
        <Link href="/shop/products" className="btn-secondary w-full mt-2">
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
