import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import { ShopProductCard } from '@/components/shop/ShopProductCard'

import { publishedProductWhere } from '@/lib/products'

async function getDeals() {
  const [featured, recent] = await Promise.all([
    prisma.product.findMany({
      where: { ...publishedProductWhere, featured: true },
      include: { store: { select: { id: true, name: true, city: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.findMany({
      where: publishedProductWhere,
      include: { store: { select: { id: true, name: true, city: true } } },
      orderBy: { priceBirr: 'asc' },
      take: 8,
    }),
  ])

  return { featured, recent }
}

export default async function DealsPage() {
  const { featured, recent } = await getDeals()

  return (
    <div className="animate-fade-in space-y-10">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-orange-500" />
          <h1 className="font-display text-xl font-bold text-gray-900">Deals & featured picks</h1>
        </div>
        <p className="text-sm text-gray-400">
          Featured listings and best-value verified products from Ethiopian sellers
        </p>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Featured deals</h2>
        {featured.length === 0 ? (
          <div className="card p-10 text-center text-sm text-gray-400">No featured deals right now</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((product) => (
              <ShopProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Best value</h2>
          <Link href="/shop/products?sort=price_asc" className="text-sm text-orange-500 font-medium hover:text-orange-600">
            View all by price →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recent.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
