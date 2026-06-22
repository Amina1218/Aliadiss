'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from './CartProvider'
import { AddToCartButton } from './AddToCartButton'

interface ProductActionsProps {
  productId: string
  inStock: boolean
}

export function ProductActions({ productId, inStock }: ProductActionsProps) {
  const router = useRouter()
  const { refresh, setCount } = useCart()
  const [buying, setBuying] = useState(false)

  const buyNow = async () => {
    if (!inStock || buying) return
    setBuying(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty: 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not proceed')
        return
      }
      setCount(data.count ?? 0)
      await refresh()
      router.push('/shop/checkout')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="space-y-2.5">
      <AddToCartButton productId={productId} disabled={!inStock} />
      <button
        type="button"
        onClick={buyNow}
        disabled={!inStock || buying}
        className="btn-secondary w-full h-11 text-sm"
      >
        <Zap className="w-4 h-4" />
        {buying ? 'Redirecting…' : 'Buy now'}
      </button>
    </div>
  )
}
