'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShieldCheck, FileText, Microscope } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Login failed')
        return
      }
      toast.success('Welcome back!')
      router.push(data.redirectUrl)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: ShieldCheck, title: 'Verified sellers', desc: 'Admin checks legal credentials before stores go live' },
    { icon: FileText, title: 'Warranty transparency', desc: 'Official, Seller, or None — always clearly shown' },
    { icon: Microscope, title: 'Full tech specs', desc: 'RAM, battery, processor — search like an engineer' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30 flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col p-12 relative overflow-hidden bg-white border-r border-orange-100">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-50 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Logo size="md" />
          <div className="mt-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-medium mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              Ethiopia&apos;s most trusted tech marketplace
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-gray-900 leading-tight">
              Buy tech with<br />
              <span className="text-orange-500">confidence.</span>
            </h1>
            <p className="mt-5 text-gray-600 text-lg leading-relaxed max-w-sm">
              Every store is admin-verified. Every product shows a warranty tag. Real specs, honest prices.
            </p>
          </div>

          <div className="mt-14 space-y-4">
            {features.map(f => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100/80">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <div className="card p-8 shadow-sm border-orange-100/80">
            <h2 className="font-display text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to browse verified tech and track your orders</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full h-11 text-base mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-500">Don&apos;t have an account? </span>
              <Link href="/register" className="text-sm font-semibold text-orange-500 hover:text-orange-600">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
