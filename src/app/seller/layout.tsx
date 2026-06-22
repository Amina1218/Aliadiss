import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SellerSidebar } from '@/components/layout/SellerSidebar'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'SUPER_ADMIN') redirect('/admin/dashboard')
  if (session.role !== 'STORE_OWNER') redirect('/shop')

  const store = await prisma.store.findUnique({
    where: { ownerId: session.sub },
    select: { status: true },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-gray-50 flex">
      <SellerSidebar
        user={{ name: session.name, email: session.email }}
        storeStatus={store?.status}
      />
      <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="p-6 lg:p-8 max-w-[1200px]">
          {children}
        </div>
      </main>
    </div>
  )
}
