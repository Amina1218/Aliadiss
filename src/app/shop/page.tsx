import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ShieldCheck, Star, Package, ArrowRight } from 'lucide-react'
import { CATEGORY_EMOJI } from '@/lib/utils'
import { publishedProductWhere } from '@/lib/products'
import { ShopProductCard } from '@/components/shop/ShopProductCard'
import { SectionHeader } from '@/components/shop/SectionHeader'

async function getShopData() {
  const [featured, categories, recentProducts, storeCount, productCount] = await Promise.all([
    prisma.product.findMany({
      where: { ...publishedProductWhere, featured: true },
      include: { store: { select: { id: true, name: true, city: true } } },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: publishedProductWhere,
      _count: { category: true },
    }),
    prisma.product.findMany({
      where: publishedProductWhere,
      include: { store: { select: { id: true, name: true, city: true } } },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.store.count({ where: { status: 'APPROVED' } }),
    prisma.product.count({ where: publishedProductWhere }),
  ])
  return { featured, categories, recentProducts, storeCount, productCount }
}
export default async function ShopPage() {
  const session = await getSession()
  const { featured, categories, recentProducts, storeCount, productCount } = await getShopData()

  return (
    <div className="space-y-10 animate-fade-in">
      <section className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl overflow-hidden shadow-lg shadow-orange-200/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-400/30 rounded-full blur-3xl" />

        <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              All sellers are admin-verified
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              Welcome back, <span className="text-orange-100">{session?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-orange-50 mt-3 text-base max-w-md">
              Browse admin-approved tech from trusted Ethiopian sellers. Read full descriptions, compare specs, and order with delivery tracking.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/shop/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-all text-sm shadow-sm">
                Browse all products <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop/stores" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-medium rounded-xl transition-all text-sm border border-white/25">
                View stores
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[160px]">
            {[
              { icon: ShieldCheck, value: '100%', label: 'Verified sellers' },
              { icon: Package, value: `${productCount}`, label: 'In stock now' },
              { icon: Star, value: String(storeCount), label: 'Active stores' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2.5 border border-white/20 backdrop-blur-sm">
                <s.icon className="w-4 h-4 text-white" />
                <div>
                  <p className="text-sm font-bold text-white leading-none">{s.value}</p>
                  <p className="text-xs text-orange-100 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Shop by category"
          description="Find phones, laptops, accessories and more — only listings that are in stock and admin-approved."
          action={
            <Link href="/shop/categories" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['PHONE', 'LAPTOP', 'ACCESSORY', 'OTHER'] as const).map(cat => {
            const count = categories.find(c => c.category === cat)?._count.category ?? 0
            const labels = { PHONE: 'Phones', LAPTOP: 'Laptops', ACCESSORY: 'Accessories', OTHER: 'Other' }
            return (
              <Link
                key={cat}
                href={`/shop/products?category=${cat}`}
                className="card p-5 flex flex-col items-center gap-3 hover:shadow-card-hover hover:border-orange-100 transition-all group"
              >
                <span className="text-3xl">{CATEGORY_EMOJI[cat]}</span>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{labels[cat]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{count} items</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section>
          <SectionHeader
            title="Featured products"
            description="Hand-picked listings from verified sellers — updated as admins approve new inventory."
            action={
              <Link href="/shop/products?featured=true" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map(product => <ShopProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section>
        <SectionHeader
          title="New arrivals"
          description="The latest in-stock products added by sellers and approved by our team."
          action={
            recentProducts.length > 0 ? (
              <Link href="/shop/products" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : undefined
          }
        />        {recentProducts.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-orange-200 mx-auto mb-4" />
            <p className="font-medium text-gray-700">No products available yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Verified seller products will appear here once admins approve listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProducts.slice(0, 8).map(product => <ShopProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>
    </div>
  )
}
