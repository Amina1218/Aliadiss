import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { ShieldCheck, Mail, MapPin } from 'lucide-react'

export function CustomerFooter() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo size="sm" />
            <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-xs">
              Ethiopia&apos;s trusted tech marketplace. Every seller is verified by our admin team before they can list products.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Shop</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/shop/products" className="hover:text-orange-500 transition-colors">All products</Link></li>
              <li><Link href="/shop/categories" className="hover:text-orange-500 transition-colors">Categories</Link></li>
              <li><Link href="/shop/stores" className="hover:text-orange-500 transition-colors">Verified stores</Link></li>
              <li><Link href="/shop/deals" className="hover:text-orange-500 transition-colors">Deals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Account</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/shop/orders" className="hover:text-orange-500 transition-colors">My orders</Link></li>
              <li><Link href="/shop/cart" className="hover:text-orange-500 transition-colors">Shopping cart</Link></li>
              <li><Link href="/register" className="hover:text-orange-500 transition-colors">Create account</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Trust & support</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                Admin-verified sellers only
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                Delivery across Addis Ababa
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                support@aliadiss.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Ali Addis. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-orange-500 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-orange-500 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
