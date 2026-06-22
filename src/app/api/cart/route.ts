import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  CART_COOKIE,
  CART_COOKIE_OPTIONS,
  getCartCount,
  parseCart,
  serializeCart,
  type Cart,
} from '@/lib/cart'

function getCartFromRequest(req: NextRequest): Cart {
  return parseCart(req.cookies.get(CART_COOKIE)?.value)
}

function withCartCookie(cart: Cart, body: object, status = 200) {
  const res = NextResponse.json(body, { status })
  res.cookies.set(CART_COOKIE, serializeCart(cart), CART_COOKIE_OPTIONS)
  return res
}

async function enrichCart(cart: Cart) {
  if (cart.items.length === 0) {
    return { items: [], count: 0, subtotal: 0 }
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: cart.items.map((i) => i.productId) },
      status: 'VERIFIED',
      store: { status: 'APPROVED' },
    },
    include: { store: { select: { id: true, name: true, city: true } } },
  })

  const items = cart.items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return null
      return {
        productId: product.id,
        qty: item.qty,
        lineTotal: product.priceBirr * item.qty,
        product: {
          id: product.id,
          title: product.title,
          priceBirr: product.priceBirr,
          stock: product.stock,
          category: product.category,
          imageUrl: product.imageUrl,
          store: product.store,
        },
      }
    })
    .filter(Boolean)

  const subtotal = items.reduce((sum, item) => sum + (item?.lineTotal ?? 0), 0)

  return { items, count: getCartCount(cart), subtotal }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cart = getCartFromRequest(req)
  const data = await enrichCart(cart)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId, qty = 1 } = await req.json()
  if (!productId || qty < 1) {
    return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 })
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'VERIFIED', store: { status: 'APPROVED' } },
  })
  if (!product) return NextResponse.json({ error: 'Product not available' }, { status: 404 })
  if (product.stock < 1) return NextResponse.json({ error: 'Out of stock' }, { status: 400 })

  const cart = getCartFromRequest(req)
  const existing = cart.items.find((i) => i.productId === productId)
  const newQty = (existing?.qty ?? 0) + qty

  if (newQty > product.stock) {
    return NextResponse.json({ error: `Only ${product.stock} in stock` }, { status: 400 })
  }

  if (existing) {
    existing.qty = newQty
  } else {
    cart.items.push({ productId, qty })
  }

  const data = await enrichCart(cart)
  return withCartCookie(cart, { ...data, message: 'Added to cart' })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId, qty } = await req.json()
  if (!productId || typeof qty !== 'number') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const cart = getCartFromRequest(req)

  if (qty <= 0) {
    cart.items = cart.items.filter((i) => i.productId !== productId)
    const data = await enrichCart(cart)
    return withCartCookie(cart, data)
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: 'VERIFIED', store: { status: 'APPROVED' } },
  })
  if (!product) return NextResponse.json({ error: 'Product not available' }, { status: 404 })
  if (qty > product.stock) {
    return NextResponse.json({ error: `Only ${product.stock} in stock` }, { status: 400 })
  }

  const existing = cart.items.find((i) => i.productId === productId)
  if (!existing) return NextResponse.json({ error: 'Item not in cart' }, { status: 404 })

  existing.qty = qty
  const data = await enrichCart(cart)
  return withCartCookie(cart, data)
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await req.json()
  const cart = getCartFromRequest(req)
  cart.items = productId
    ? cart.items.filter((i) => i.productId !== productId)
    : []

  const data = await enrichCart(cart)
  return withCartCookie(cart, data)
}
