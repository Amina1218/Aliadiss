'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCart } from './CartProvider'

interface AddToCartButtonProps {
  productId: string
  disabled?: boolean
  variant?: 'primary' | 'text'
  className?: string
  label?: string
}

export function AddToCartButton({
  productId,
  disabled,
  variant = 'primary',
  className = '',
  label = 'Add to cart',
}: AddToCartButtonProps) {
  const { refresh, setCount } = useCart()
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || loading) return

    setLoading(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, qty: 1 }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not add to cart')
        return
      }
      setCount(data.count ?? 0)
      toast.success('Added to cart')
      await refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 disabled:opacity-50 ${className}`}
      >
        {loading ? 'Adding…' : label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`btn-primary w-full h-11 text-sm ${className}`}
    >
      <ShoppingCart className="w-4 h-4" />
      {loading ? 'Adding…' : disabled ? 'Out of stock' : label}
    </button>
  )
}
