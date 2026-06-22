'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, Store, LogOut, ShoppingBag, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface SellerSidebarProps {
  user: { name: string; email: string }
  storeStatus?: string
}

const links = [
  { href: '/seller/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/seller/products', icon: Package, label: 'My Products' },
  { href: '/seller/orders', icon: Truck, label: 'Deliveries' },
  { href: '/seller/store', icon: Store, label: 'Store Profile' },
]

export function SellerSidebar({ user, storeStatus }: SellerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {links.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              mobile ? 'flex-col gap-1 py-2 px-2 text-[10px]' : '',
              active
                ? 'bg-orange-500 text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-orange-50'
            )}
          >
            <Icon className={cn('flex-shrink-0', mobile ? 'w-5 h-5' : 'w-4 h-4')} />
            {!mobile && label}
            {mobile && <span className="truncate max-w-[4rem]">{label.split(' ')[0]}</span>}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 min-h-screen flex-col fixed left-0 top-0 z-40">
        <div className="p-5 border-b border-gray-100">
          <div className="font-display font-bold text-lg text-gray-900 leading-none">
            Ali<span className="text-orange-500">Addis</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-1">Seller Portal</div>
        </div>

        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-2">
          <Store className="w-4 h-4 text-orange-500" />
          <div>
            <span className="text-xs font-medium text-orange-700">Seller Account</span>
            {storeStatus && (
              <p className="text-[10px] text-orange-500 mt-0.5 capitalize">{storeStatus.toLowerCase()} store</p>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 mt-2 space-y-0.5">
          <NavLinks />
          <Link
            href="/shop"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-orange-50 transition-all mt-4"
          >
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            Browse Shop
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-2 py-2 flex justify-around safe-area-pb">
        <NavLinks mobile />
      </nav>
    </>
  )
}
