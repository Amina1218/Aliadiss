import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, MapPin, ShieldCheck, Store } from 'lucide-react'
import { ShopProductCard } from '@/components/shop/ShopProductCard'
import { publishedProductWhere } from '@/lib/products'

interface PageProps {
  params: { id: string }
}

async function getStore(id: string) {
  return prisma.store.findFirst({
    where: { id, status: 'APPROVED' },
    include: {
      owner: { select: { name: true } },
      products: {
        where: publishedProductWhere,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export default async function StoreDetailPage({ params }: PageProps) {
  const store = await getStore(params.id)
  if (!store) notFound()

  return (
    <div className="animate-fade-in space-y-6">
      <Link href="/shop/stores" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600">
        <ArrowLeft className="w-4 h-4" />
        Back to stores
      </Link>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Store className="w-8 h-8 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-gray-900">{store.name}</h1>
              <Badge variant="verified">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Verified
              </Badge>
            </div>
            <p className="text-gray-500 mt-2">{store.description}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {store.city}
                {store.address ? ` · ${store.address}` : ''}
              </span>
              <span>Owner: {store.owner.name}</span>
              <span>{store.products.length} product{store.products.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {store.products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-medium text-gray-700">No products listed yet</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new listings from this store</p>
        </div>
      ) : (
        <div>
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Products from {store.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {store.products.map((product) => (
              <ShopProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
