import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Package, Store, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { formatBirr, formatDate, CATEGORY_EMOJI } from '@/lib/utils'

async function getSellerData(userId: string) {
  return prisma.store.findUnique({
    where: { ownerId: userId },
    include: {
      products: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { products: true, sales: true } },
    },
  })
}

export default async function SellerDashboardPage() {
  const session = await getSession()
  if (!session) return null

  const store = await getSellerData(session.sub)

  const statusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge variant="verified"><CheckCircle className="w-3 h-3" /> Approved</Badge>
    if (status === 'REJECTED') return <Badge variant="rejected"><XCircle className="w-3 h-3" /> Rejected</Badge>
    return <Badge variant="pending"><Clock className="w-3 h-3" /> Pending</Badge>
  }

  const productStatusBadge = (status: string) => {
    if (status === 'VERIFIED') return <Badge variant="verified">Live</Badge>
    if (status === 'REJECTED') return <Badge variant="rejected">Rejected</Badge>
    return <Badge variant="pending">Pending review</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Seller Dashboard</p>
        <h1 className="font-display text-2xl font-bold text-gray-900">Welcome, {session.name.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your store and product listings</p>
      </div>

      {!store ? (
        <div className="card p-8 text-center">
          <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No store assigned</p>
          <p className="text-sm text-gray-400 mt-1">Contact the admin to set up your seller account.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Store className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Store status</p>
                  <div className="mt-1">{statusBadge(store.status)}</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total products</p>
                  <p className="font-display text-xl font-bold text-gray-900">{store._count.products}</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total sales</p>
                  <p className="font-display text-xl font-bold text-gray-900">{store._count.sales}</p>
                </div>
              </div>
            </div>
          </div>

          {store.status !== 'APPROVED' && (
            <div className="card p-5 border-amber-100 bg-amber-50/50">
              <p className="text-sm font-semibold text-amber-800">
                {store.status === 'PENDING'
                  ? 'Your store is awaiting admin approval. You cannot post products until approved.'
                  : 'Your store posting permission was revoked. Contact admin for help.'}
              </p>
              {store.rejectionReason && (
                <p className="text-sm text-amber-700 mt-1">Reason: {store.rejectionReason}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-gray-900">Recent products</h2>
            <Link href="/seller/products" className="text-sm text-orange-500 font-medium hover:text-orange-600 flex items-center gap-1">
              {store.status === 'APPROVED' ? 'Post new product' : 'View products'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {store.products.length === 0 ? (
            <div className="card p-8 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-700">No products yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {store.status === 'APPROVED'
                  ? 'Post your first product to appear in the customer shop.'
                  : 'Once your store is approved, you can start posting products.'}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-gray-50">
                {store.products.map(product => (
                  <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-gray-50/50">
                    <span className="text-2xl">{CATEGORY_EMOJI[product.category] ?? '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(product.createdAt)}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatBirr(product.priceBirr)}</p>
                    {productStatusBadge(product.status)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
