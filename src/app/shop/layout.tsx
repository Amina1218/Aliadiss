import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCartCount, getCartFromCookie } from '@/lib/cart'
import { CustomerNav } from '@/components/layout/CustomerNav'
import { CustomerFooter } from '@/components/layout/CustomerFooter'
import { CartProvider } from '@/components/shop/CartProvider'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'SUPER_ADMIN') redirect('/admin/dashboard')

  const initialCount = getCartCount(getCartFromCookie())

  return (
    <CartProvider initialCount={initialCount}>
      <div className="min-h-screen bg-gradient-to-b from-orange-50/20 via-white to-gray-50 flex flex-col">
        <CustomerNav user={{ name: session.name, email: session.email, role: session.role }} />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
          {children}
        </main>
        <CustomerFooter />
      </div>
    </CartProvider>
  )
}
