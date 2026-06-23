'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader2, Smartphone, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react'
import { formatBirr } from '@/lib/utils'

interface PaymentPageProps {
  params: { id: string }
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const provider = searchParams.get('provider')
  const txn = searchParams.get('txn')

  const [order, setOrder] = useState<{ id: string; totalBirr: number; payment?: { status: string; method: string; phone: string } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.order) setOrder(data.order)
        else toast.error('Order not found')
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const confirmPayment = async () => {
    setPaying(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: params.id, transactionId: txn }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Payment failed')
        return
      }
      toast.success('Payment successful!')
      router.push(data.redirectUrl || `/shop/orders/${params.id}`)
    } catch {
      toast.error('Payment failed')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-3">Loading payment…</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="card p-12 text-center">
        <p className="font-medium text-gray-700">Order not found</p>
        <Link href="/shop/orders" className="btn-primary inline-flex mt-4">My orders</Link>
      </div>
    )
  }

  if (order.payment?.status === 'COMPLETED') {
    return (
      <div className="max-w-md mx-auto card p-8 text-center animate-fade-in">
        <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-gray-900">Payment complete</h1>
        <p className="text-sm text-gray-500 mt-2">Your order has been confirmed.</p>
        <Link href={`/shop/orders/${order.id}`} className="btn-primary inline-flex mt-6 w-full justify-center">
          View order
        </Link>
      </div>
    )
  }

  const isTelebirr = provider === 'telebirr' || order.payment?.method === 'TELEBIRR'
  const ProviderIcon = isTelebirr ? Smartphone : CreditCard
  const providerName = isTelebirr ? 'Telebirr' : 'CBE Birr'
  const providerColor = isTelebirr ? 'text-emerald-600 bg-emerald-50' : 'text-blue-600 bg-blue-50'

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-2xl ${providerColor} flex items-center justify-center mx-auto mb-4`}>
            <ProviderIcon className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Pay with {providerName}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Complete your payment to confirm order #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>

        <div className="bg-orange-50 rounded-xl p-4 mb-6 text-center border border-orange-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Amount to pay</p>
          <p className="font-display text-3xl font-bold text-orange-600 mt-1">{formatBirr(order.totalBirr)}</p>
          {order.payment?.phone && (
            <p className="text-sm text-gray-600 mt-2">Phone: {order.payment.phone}</p>
          )}
        </div>

        <div className="space-y-3 mb-6 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <span>In production, you will be redirected to the official {providerName} app to approve payment.</span>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs">
            <strong>Sandbox mode:</strong> Click the button below to simulate a successful {providerName} payment for testing.
          </div>
        </div>

        <button onClick={confirmPayment} disabled={paying} className="btn-primary w-full h-12 text-base">
          {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {paying ? 'Confirming…' : `Confirm ${providerName} payment`}
        </button>

        <Link href={`/shop/orders/${order.id}`} className="btn-secondary w-full mt-3 text-center">
          Cancel and view order
        </Link>
      </div>
    </div>
  )
}
