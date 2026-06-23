'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

interface PayNowButtonProps {
  orderId: string
  label?: string
  className?: string
}

export function PayNowButton({ orderId, label = 'Complete payment', className = 'btn-primary' }: PayNowButtonProps) {
  const [loading, setLoading] = useState(false)

  const pay = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Could not start payment')
        return
      }
      window.location.href = data.redirectUrl
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={pay} disabled={loading} className={className}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {loading ? 'Redirecting…' : label}
    </button>
  )
}
