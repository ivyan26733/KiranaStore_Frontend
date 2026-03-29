'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Requirement {
  id: string; title?: string; status: string; created_at: string
  delivery_by?: string; credit_terms?: string
  items: { name: string; quantity: number; unit: string }[]
  _count: { bids: number }
}

interface Notification {
  id: string; title: string; body: string; is_read: boolean; created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  OPEN:      { label: 'Open',      dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ACCEPTED:  { label: 'Accepted',  dot: 'bg-indigo-400',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  EXPIRED:   { label: 'Expired',   dot: 'bg-gray-300',    badge: 'bg-gray-100 text-gray-500 border-gray-200' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-gray-300',    badge: 'bg-gray-100 text-gray-500 border-gray-200' },
}

export default function ProcurementList() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [filter, setFilter] = useState<string>('OPEN')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/procurement/requirements', { params: { status: filter } }),
      api.get('/procurement/notifications'),
    ]).then(([reqRes, notifRes]) => {
      setRequirements(reqRes.data.requirements)
      setTotal(reqRes.data.total)
      setNotifications(notifRes.data.notifications)
      setUnread(notifRes.data.unread_count)
    }).catch(() => toast.error('Data load नहीं हुआ'))
      .finally(() => setLoading(false))
  }, [filter])

  async function openNotifications() {
    setNotifOpen(true)
    if (unread > 0) {
      try {
        await api.put('/procurement/notifications/read')
        setUnread(0)
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      } catch { /* silent */ }
    }
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Procurement</h1>
          <p className="text-xs text-gray-400 mt-0.5">Vendors से सामान खरीदें</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification bell — always visible */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={openNotifications}
              className="relative w-9 h-9 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-800">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600 text-xs">
                      Close
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-8">कोई notification नहीं</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.is_read ? 'bg-orange-50/60' : ''}`}>
                          <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <Link href="/procurement/new">
            <div className="h-9 px-4 bg-orange-500 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-200">
              + नई Requirement
            </div>
          </Link>
        </div>
      </div>

      {/* Vendor Deals banner */}
      <Link href="/procurement/deals">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-4 py-3.5 mb-5 flex items-center justify-between shadow-md shadow-indigo-200">
          <div>
            <p className="text-white font-extrabold text-sm">🏪 Vendor Deals देखें</p>
            <p className="text-indigo-200 text-xs mt-0.5">Vendors का ready stock — direct price पर खरीदें</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === key ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-100'
            }`}>
            {cfg.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : requirements.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📋</span>
          <p className="font-semibold text-gray-600 mt-3">
            {filter === 'OPEN' ? 'कोई open requirement नहीं' : `कोई ${STATUS_CONFIG[filter]?.label.toLowerCase()} requirement नहीं`}
          </p>
          {filter === 'OPEN' && (
            <Link href="/procurement/new"
              className="inline-block mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold">
              पहली Requirement Post करें →
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requirements.map(r => {
            const cfg = STATUS_CONFIG[r.status]
            return (
              <Link key={r.id} href={`/procurement/${r.id}`}>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="px-4 py-3.5 flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${cfg?.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-gray-800 text-sm leading-snug truncate">
                          {r.title || r.items.slice(0, 2).map(i => i.name).join(', ')}
                          {!r.title && r.items.length > 2 ? ` +${r.items.length - 2} more` : ''}
                        </p>
                        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg?.badge}`}>
                          {cfg?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 mt-1.5">
                        <span>📦 {r.items.length} item{r.items.length !== 1 ? 's' : ''}</span>
                        <span className="font-semibold text-orange-500">{r._count.bids} bid{r._count.bids !== 1 ? 's' : ''}</span>
                        {r.delivery_by && <span>📅 {new Date(r.delivery_by).toLocaleDateString('en-IN')}</span>}
                        {r.credit_terms && <span>💳 {r.credit_terms}</span>}
                        <span className="ml-auto">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {total > 20 && (
        <p className="text-center text-xs text-gray-400 mt-6">{total} total requirements</p>
      )}
    </div>
  )
}
