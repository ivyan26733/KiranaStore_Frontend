'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVendorStore } from '@/lib/vendorStore'
import { getVendorRequirements, getVendorBids } from '@/lib/vendorApi'

interface Requirement {
  id: string; title?: string; status: string; created_at: string
  items: { name: string; quantity: number; unit: string }[]
  shop: { name: string; city: string }
  bids: { id: string; status: string; total_amount: number }[]
  _count: { bids: number }
}

interface Bid {
  id: string; status: string; total_amount: number; created_at: string
  requirement: { id: string; status: string; shop: { name: string } }
}

const BID_STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
  WITHDRAWN: 'bg-slate-100 text-slate-500 border-slate-200',
}
const BID_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending', ACCEPTED: '✓ Won', REJECTED: 'Not Selected', WITHDRAWN: 'Withdrawn',
}

export default function VendorDashboard() {
  const { vendor } = useVendorStore()
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [recentBids, setRecentBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getVendorRequirements({ limit: 5 }),
      getVendorBids(),
    ]).then(([reqRes, bidRes]) => {
      setRequirements(reqRes.data.requirements)
      setRecentBids(bidRes.data.bids.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = {
    total_bids: recentBids.length,
    won: recentBids.filter(b => b.status === 'ACCEPTED').length,
    pending: recentBids.filter(b => b.status === 'PENDING').length,
    open_requirements: requirements.length,
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-slate-800">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {vendor?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening in your zone today</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Open Requirements', value: stats.open_requirements, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Bids Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Bids Won', value: stats.won, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Bids', value: stats.total_bids, color: 'text-slate-600', bg: 'bg-slate-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Open requirements */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">New Requirements</h2>
            <Link href="/vendor/requirements" className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
          </div>
          {requirements.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-medium">No open requirements in your zone</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {requirements.map(r => {
                const myBid = r.bids[0]
                return (
                  <Link key={r.id} href={`/vendor/requirements/${r.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors block">
                    <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${myBid ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {r.title || r.items.slice(0, 2).map(i => i.name).join(', ')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.shop.name} · {r.shop.city}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r._count.bids} bid{r._count.bids !== 1 ? 's' : ''} received</p>
                    </div>
                    {myBid ? (
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${BID_STATUS_STYLE[myBid.status]}`}>
                        Bid: ₹{Number(myBid.total_amount).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Bid Now
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent bids */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Recent Bids</h2>
            <Link href="/vendor/bids" className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
          </div>
          {recentBids.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-3xl mb-2">💼</p>
              <p className="text-sm font-medium">No bids submitted yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentBids.map(b => (
                <Link key={b.id} href={`/vendor/requirements/${b.requirement.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors block">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.requirement.shop.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">₹{Number(b.total_amount).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${BID_STATUS_STYLE[b.status]}`}>
                    {BID_STATUS_LABEL[b.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
