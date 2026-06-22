'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Store, Package, ShoppingBag, Users,
  LogOut, ChevronRight, TrendingUp, Shield, Truck
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AdminSidebarProps {
  user: { name: string; email: string }
  pendingStores?: number
  pendingProducts?: number
}

export function AdminSidebar({ user, pendingStores = 0, pendingProducts = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/stores', icon: Store, label: 'Stores', badge: pendingStores },
    { href: '/admin/products', icon: Package, label: 'Products', badge: pendingProducts },
    { href: '/admin/delivery', icon: Truck, label: 'Delivery' },
    { href: '/admin/orders', icon: TrendingUp, label: 'Revenue' },
    { href: '/admin/users', icon: Users, label: 'Users' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-orange-100 min-h-screen flex flex-col fixed left-0 top-0 z-40 shadow-sm">
      <div className="p-5 border-b border-orange-50">
        <Logo size="sm" />
        <div className="text-[10px] text-orange-500 font-medium tracking-widest uppercase mt-2">Admin Panel</div>
      </div>

      <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-2">
        <Shield className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-medium text-orange-700">Super Admin</span>
      </div>

      <nav className="flex-1 p-3 mt-2 space-y-0.5">
        {links.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                active
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', active ? 'bg-white/25 text-white' : 'bg-orange-500 text-white')}>
                  {badge}
                </span>
              ) : (
                <ChevronRight className={cn('w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-400', active && 'opacity-100 text-white/80')} />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-orange-50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
  )
}
