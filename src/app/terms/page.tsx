import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <Logo size="sm" />
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 prose prose-gray">
        <h1 className="font-display text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-gray-500 mt-2">Last updated: June 2026</p>
        <div className="mt-8 space-y-4 text-gray-600 text-sm leading-relaxed">
          <p>By using Ali Addis, you agree to buy and sell tech products through our verified marketplace. All sellers are registered and approved by administrators.</p>
          <p>Products listed must be accurately described with real photos. Admin-verified listings appear in the customer shop.</p>
          <p>Orders are subject to delivery terms selected at checkout. Disputes should be reported to support@aliadiss.com.</p>
        </div>
        <Link href="/register" className="btn-primary inline-flex mt-8">Back to registration</Link>
      </main>
    </div>
  )
}
