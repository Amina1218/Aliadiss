'use client'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Store, CheckCircle, Clock, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type StoreData = {
  id: string
  name: string
  description: string | null
  legalName: string
  legalCredentials: string
  city: string
  address: string | null
  status: string
  rejectionReason: string | null
}

export default function SellerStorePage() {
  const [store, setStore] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    legalName: '',
    legalCredentials: '',
    city: '',
    address: '',
  })

  useEffect(() => {
    fetch('/api/stores')
      .then(r => r.json())
      .then(data => {
        setStore(data)
        if (data) {
          setForm({
            name: data.name || '',
            description: data.description || '',
            legalName: data.legalName || '',
            legalCredentials: data.legalCredentials || '',
            city: data.city || '',
            address: data.address || '',
          })
        }
        setLoading(false)
      })
  }, [])

  const saveStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setStore(data)
        toast.success('Store updated. Pending admin re-approval.')
      } else {
        toast.error(data.error || 'Failed to update store')
      }
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'APPROVED') return <Badge variant="verified"><CheckCircle className="w-3 h-3" /> Approved — can post products</Badge>
    if (status === 'REJECTED') return <Badge variant="rejected"><XCircle className="w-3 h-3" /> Rejected</Badge>
    return <Badge variant="pending"><Clock className="w-3 h-3" /> Pending approval</Badge>
  }

  if (loading) return <div className="text-gray-400">Loading...</div>

  if (!store) {
    return (
      <div className="card p-8 text-center">
        <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-700">No store assigned</p>
        <p className="text-sm text-gray-400 mt-1">Your seller account was not set up with a store. Contact the admin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">Store Profile</p>
        <h1 className="font-display text-2xl font-bold text-gray-900">{store.name}</h1>
        <div className="mt-2">{statusBadge(store.status)}</div>
      </div>

      {store.rejectionReason && (
        <div className="card p-4 border-red-100 bg-red-50/50">
          <p className="text-sm font-semibold text-red-700">Admin note: {store.rejectionReason}</p>
        </div>
      )}

      <form onSubmit={saveStore} className="card p-6 space-y-4">
        <p className="text-sm text-gray-500">Updates will require admin re-approval before you can post products again.</p>
        {[
          { key: 'name', label: 'Store name', required: true },
          { key: 'legalName', label: 'Legal business name', required: true },
          { key: 'city', label: 'City', required: true },
          { key: 'address', label: 'Address', required: false },
        ].map(({ key, label, required }) => (
          <div key={key}>
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <input
              required={required}
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Legal credentials</label>
          <textarea
            required
            value={form.legalCredentials}
            onChange={e => setForm(f => ({ ...f, legalCredentials: e.target.value }))}
            rows={3}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : 'Update store'}
        </button>
      </form>
    </div>
  )
}
