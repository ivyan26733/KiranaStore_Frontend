'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getVendorBids } from '@/lib/vendorApi'

interface Bid {
  id: string; status: string; total_amount: number; created_at: string
  delivery_by?: string; credit_terms?: string
  items: { name: string; quantity: number; unit: string; unit_price: number; total_price: number }[]
  requirement: { id: string; status: string; shop: { name: string; city: string } }
}

const STATUS_STYLE: Record<string, { badge: string; label: string }> = {
  PENDING:   { badge: 'bg-amber-50 text-amber-700 border-amber-200',    label: 'Under Review' },
  ACCEPTED:  { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✓ Won' },
  REJECTED:  { badge: 'bg-red-50 text-red-600 border-red-200',           label: 'Not Selected' },
  WITHDRAWN: { badge: 'bg-slate-100 text-slate-500 border-slate-200',    label: 'Withdrawn' },
}

const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']

export default function VendorBids() {
  const [bids, setBids] = useState<Bid[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getVendorBids(filter !== 'ALL' ? { status: filter } : {})
      .then(res => setBids(res.data.bids))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">My Bids</h1>
        <p className="text-slate-400 text-sm mt-0.5">Track all bids you've submitted</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200'
            }`}>
            {f === 'ALL' ? 'All Bids' : STATUS_STYLE[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : bids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <p className="text-5xl mb-3">💼</p>
          <p className="font-semibold text-slate-600">No bids found</p>
          <Link href="/vendor/requirements" className="inline-block mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
            Browse Requirements →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bids.map(bid => {
            const { badge, label } = STATUS_STYLE[bid.status] || STATUS_STYLE.WITHDRAWN
            return (
              <div key={bid.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                bid.status === 'ACCEPTED' ? 'border-emerald-200' :
                bid.status === 'REJECTED' ? 'border-red-100' : 'border-slate-100'
              }`}>
                {/* Header */}
                <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
                  bid.status === 'ACCEPTED' ? 'border-emerald-100 bg-emerald-50/30' :
                  bid.status === 'REJECTED' ? 'border-red-50 bg-red-50/30' : 'border-slate-100'
                }`}>
                  <div>
                    <p className="font-bold text-slate-800">{bid.requirement.shop.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{bid.requirement.shop.city}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-extrabold text-slate-800">₹{Number(bid.total_amount).toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge}`}>{label}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-5 py-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {bid.items.map((item, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                        {Number(item.quantity)} {item.unit} {item.name} @ ₹{Number(item.unit_price).toFixed(0)}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-slate-400">
                      {bid.delivery_by && <span>📅 {new Date(bid.delivery_by).toLocaleDateString('en-IN')}</span>}
                      {bid.credit_terms && <span>💳 {bid.credit_terms}</span>}
                      <span>Submitted {new Date(bid.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                    {bid.status === 'PENDING' && (
                      <Link href={`/vendor/requirements/${bid.requirement.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:underline">
                        View & Revise →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
