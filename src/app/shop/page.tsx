import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { ShieldCheck, Star, Package, ArrowRight, Zap, TrendingUp } from 'lucide-react'
import { CATEGORY_EMOJI } from '@/lib/utils'
import { ShopProductCard } from '@/components/shop/ShopProductCard'

async function getShopData() {
  const [featured, categories, recentProducts, storeCount, productCount] = await Promise.all([
    prisma.product.findMany({
      where: { status: 'VERIFIED', store: { status: 'APPROVED' }, featured: true },
      include: { store: { select: { id: true, name: true, city: true } } },
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { status: 'VERIFIED', store: { status: 'APPROVED' } },
      _count: { category: true },
    }),
    prisma.product.findMany({
      where: { status: 'VERIFIED', store: { status: 'APPROVED' } },
      include: { store: { select: { id: true, name: true, city: true } } },
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.store.count({ where: { status: 'APPROVED' } }),
    prisma.product.count({ where: { status: 'VERIFIED', store: { status: 'APPROVED' } } }),
  ])
  return { featured, categories, recentProducts, storeCount, productCount }
}

export default async function ShopPage() {
  const session = await getSession()
  const { featured, categories, recentProducts, storeCount, productCount } = await getShopData()

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero banner */}
      <section className="relative bg-gray-950 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 to-gray-900" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl" />

        <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              All sellers are admin-verified
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
              Welcome back, <span className="text-orange-500">{session?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-gray-400 mt-3 text-base max-w-md">
              Shop verified tech from trusted Ethiopian sellers. Every product includes honest warranty information.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/shop/products" className="btn-primary">
                Browse all products <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/shop/stores" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-all text-sm border border-white/10">
                View stores
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-3 min-w-[160px]">
            {[
              { icon: ShieldCheck, value: '100%', label: 'Verified sellers' },
              { icon: Package, value: `${productCount}+`, label: 'Products live' },
              { icon: Star, value: String(storeCount), label: 'Active stores' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/8">
                <s.icon className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-sm font-bold text-white leading-none">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Categories</h2>
          <Link href="/shop/categories" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <h2 className="font-display text-lg font-bold text-gray-900">Featured products</h2>
            </div>
            <Link href="/shop/products?featured=true" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map(product => <ShopProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h2 className="font-display text-lg font-bold text-gray-900">New arrivals</h2>
          </div>
          <Link href="/shop/products" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentProducts.slice(0, 8).map(product => <ShopProductCard key={product.id} product={product} />)}
        </div>
      </section>
    </div>
  )
}
