'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import {
  Users, Shield, Store, ShoppingBag, UserPlus, Trash2,
  CheckCircle, XCircle, RefreshCw, Lock, Unlock,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

type UserData = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  store: { id: string; name: string; status: string } | null
  _count: { orders: number }
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  storeName: '',
  legalName: '',
  legalCredentials: '',
  city: 'Addis Ababa',
  address: '',
  approveStore: false,
}

export function UserManagement({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const refresh = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
  }

  const roleIcon = (role: string) => {
    if (role === 'SUPER_ADMIN') return <Shield className="w-3.5 h-3.5" />
    if (role === 'STORE_OWNER') return <Store className="w-3.5 h-3.5" />
    return <ShoppingBag className="w-3.5 h-3.5" />
  }

  const roleVariant = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'orange' as const
    if (role === 'STORE_OWNER') return 'blue' as const
    return 'gray' as const
  }

  const roleLabel = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'Super Admin'
    if (role === 'STORE_OWNER') return 'Seller'
    return 'Customer'
  }

  const registerSeller = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Seller registered successfully')
        setForm(emptyForm)
        setShowForm(false)
        refresh()
      } else {
        toast.error(data.error || 'Failed to register seller')
      }
    } finally {
      setSaving(false)
    }
  }

  const runAction = async (userId: string, action: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Updated successfully')
        refresh()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const removeUser = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return
    setActionLoading(userId)
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('User removed')
        refresh()
      } else {
        toast.error(data.error || 'Failed to remove user')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">User Management</p>
          <h1 className="font-display text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="btn-secondary gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={() => setShowForm(v => !v)} className="btn-primary gap-2">
            <UserPlus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Register Seller'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={registerSeller} className="card p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Register new seller</h2>
          <p className="text-sm text-gray-500">Create a seller account with their store. Approve the store to let them post products.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Seller name', placeholder: 'Full name' },
              { key: 'email', label: 'Email', placeholder: 'seller@example.com', type: 'email' },
              { key: 'password', label: 'Password', placeholder: 'Min 6 characters', type: 'password' },
              { key: 'storeName', label: 'Store name', placeholder: 'e.g. TechHub Addis' },
              { key: 'legalName', label: 'Legal business name', placeholder: 'Registered name' },
              { key: 'city', label: 'City', placeholder: 'Addis Ababa' },
              { key: 'address', label: 'Address (optional)', placeholder: 'Bole, Addis Ababa', required: false },
            ].map(({ key, label, placeholder, type, required = true }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <input
                  required={required}
                  type={type || 'text'}
                  value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Legal credentials</label>
              <textarea
                required
                value={form.legalCredentials}
                onChange={e => setForm(f => ({ ...f, legalCredentials: e.target.value }))}
                rows={3}
                placeholder="Business license, TIN, etc."
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              />
            </div>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.approveStore}
                onChange={e => setForm(f => ({ ...f, approveStore: e.target.checked }))}
                className="rounded border-gray-300 text-orange-500 focus:ring-orange-200"
              />
              Approve store immediately (grant product posting permission)
            </label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Registering...' : 'Register seller'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Customers', count: users.filter(u => u.role === 'CUSTOMER').length },
          { label: 'Sellers', count: users.filter(u => u.role === 'STORE_OWNER').length },
          { label: 'Admins', count: users.filter(u => u.role === 'SUPER_ADMIN').length },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="font-display text-2xl font-bold text-gray-900">{s.count}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-50 flex items-center gap-3">
          <Users className="w-4 h-4 text-orange-500" />
          <h2 className="font-display text-sm font-bold text-gray-900">User Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Store</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={roleVariant(user.role)}>
                      {roleIcon(user.role)}
                      {roleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {user.store ? (
                      <div>
                        <p className="text-sm text-gray-900">{user.store.name}</p>
                        <Badge variant={user.store.status === 'APPROVED' ? 'verified' : user.store.status === 'REJECTED' ? 'rejected' : 'pending'} className="mt-1">
                          {user.store.status}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {user.role !== 'SUPER_ADMIN' && (
                      <div className="flex flex-wrap gap-1.5">
                        {user.role === 'STORE_OWNER' && user.store && (
                          <>
                            {user.store.status !== 'APPROVED' && (
                              <button
                                disabled={actionLoading === user.id}
                                onClick={() => runAction(user.id, 'grantPosting', `Grant posting permission to ${user.name}?`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                <Unlock className="w-3 h-3" /> Allow posting
                              </button>
                            )}
                            {user.store.status === 'APPROVED' && (
                              <button
                                disabled={actionLoading === user.id}
                                onClick={() => runAction(user.id, 'revokePosting', `Revoke posting permission from ${user.name}?`)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100"
                              >
                                <Lock className="w-3 h-3" /> Revoke posting
                              </button>
                            )}
                            <button
                              disabled={actionLoading === user.id}
                              onClick={() => runAction(user.id, 'demote', `Remove seller role from ${user.name}?`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                              <XCircle className="w-3 h-3" /> Remove seller
                            </button>
                          </>
                        )}
                        <button
                          disabled={actionLoading === user.id}
                          onClick={() => removeUser(user.id, user.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Protected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
