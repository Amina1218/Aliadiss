import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Package, ShieldCheck, Store } from 'lucide-react'
import { publishedProductWhere } from '@/lib/products'

async function getStores() {
  return prisma.store.findMany({
    where: { status: 'APPROVED' },
    include: {
      owner: { select: { name: true } },
      _count: {
        select: {
          products: { where: publishedProductWhere },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export default async function StoresPage() {
  const stores = await getStores()

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-gray-900">Verified stores</h1>
        <p className="text-sm text-gray-500 mt-1 max-w-lg">
          Browse shops run by admin-approved sellers. Each store lists only in-stock products that passed our review.
        </p>
      </div>

      {stores.length === 0 ? (
        <div className="card p-16 text-center">
          <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No stores yet</p>
          <p className="text-sm text-gray-400 mt-1">Approved sellers will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/shop/stores/${store.id}`}
              className="card p-5 hover:shadow-card-hover hover:border-orange-100 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {store.name}
                    </h2>
                    <Badge variant="verified">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {store.description ?? 'Verified tech seller on Ali Addis'}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {store.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {store._count.products} product{store._count.products !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Owner: {store.owner.name}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
