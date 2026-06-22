import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { getCartCount, getCartFromCookie } from '@/lib/cart'
import { CustomerNav } from '@/components/layout/CustomerNav'
import { CartProvider } from '@/components/shop/CartProvider'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'SUPER_ADMIN') redirect('/admin/dashboard')

  const initialCount = getCartCount(getCartFromCookie())

  return (
    <CartProvider initialCount={initialCount}>
      <div className="min-h-screen bg-gray-50">
        <CustomerNav user={{ name: session.name, email: session.email, role: session.role }} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </CartProvider>
  )
}
