import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/utils'
import { publishedProductWhere } from '@/lib/products'

async function getCategories() {
  const counts = await prisma.product.groupBy({
    by: ['category'],
    where: publishedProductWhere,
    _count: { category: true },
  })

  return (['PHONE', 'LAPTOP', 'ACCESSORY', 'OTHER'] as const).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    emoji: CATEGORY_EMOJI[category],
    count: counts.find((c) => c.category === category)?._count.category ?? 0,
  }))
}

export default async function CategoriesPage() {
  const categories = await getCategories()
  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-gray-900">Browse by category</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {totalProducts} verified product{totalProducts !== 1 ? 's' : ''} across {categories.filter((c) => c.count > 0).length} categories
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.category}
            href={`/shop/products?category=${cat.category}`}
            className="card p-6 hover:shadow-card-hover hover:border-orange-100 transition-all group"
          >
            <span className="text-4xl">{cat.emoji}</span>
            <h2 className="font-display text-lg font-bold text-gray-900 mt-4 group-hover:text-orange-600 transition-colors">
              {cat.label}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{cat.count} product{cat.count !== 1 ? 's' : ''}</p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500 mt-4">
              Shop now <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
