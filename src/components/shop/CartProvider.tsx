'use client'

import { createContext, useCallback, useContext, useState } from 'react'

interface CartContextValue {
  count: number
  refresh: () => Promise<void>
  setCount: (count: number) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  children,
  initialCount,
}: {
  children: React.ReactNode
  initialCount: number
}) {
  const [count, setCount] = useState(initialCount)

  const refresh = useCallback(async () => {
    const res = await fetch('/api/cart')
    if (res.ok) {
      const data = await res.json()
      setCount(data.count ?? 0)
    }
  }, [])

  return (
    <CartContext.Provider value={{ count, refresh, setCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
