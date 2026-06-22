import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-4">
        <Logo size="sm" />
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-500 mt-2">Last updated: June 2026</p>
        <div className="mt-8 space-y-4 text-gray-600 text-sm leading-relaxed">
          <p>Ali Addis collects your name, email, phone, and delivery address to process orders and verify seller accounts.</p>
          <p>We do not sell your personal data. Order and delivery information is shared with relevant sellers to fulfill purchases.</p>
          <p>Contact support@aliadiss.com to request account deletion or data export.</p>
        </div>
        <Link href="/register" className="btn-primary inline-flex mt-8">Back to registration</Link>
      </main>
    </div>
  )
}
