import { cookies } from 'next/headers'

export const CART_COOKIE = 'aliadiss_cart'

export interface CartItem {
  productId: string
  qty: number
}

export interface Cart {
  items: CartItem[]
}

export function parseCart(raw?: string): Cart {
  if (!raw) return { items: [] }
  try {
    const parsed = JSON.parse(raw) as Cart
    if (!Array.isArray(parsed.items)) return { items: [] }
    return {
      items: parsed.items.filter(
        (item): item is CartItem =>
          typeof item?.productId === 'string' && typeof item?.qty === 'number' && item.qty > 0
      ),
    }
  } catch {
    return { items: [] }
  }
}

export function serializeCart(cart: Cart): string {
  return JSON.stringify(cart)
}

export function getCartFromCookie(): Cart {
  const cookieStore = cookies()
  return parseCart(cookieStore.get(CART_COOKIE)?.value)
}

export function getCartCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.qty, 0)
}

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}
