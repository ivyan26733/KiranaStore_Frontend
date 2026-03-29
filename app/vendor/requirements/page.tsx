'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getVendorRequirements } from '@/lib/vendorApi'

interface Requirement {
  id: string; title?: string; status: string; created_at: string
  delivery_by?: string; credit_terms?: string; notes?: string
  items: { id: string; name: string; quantity: number; unit: string }[]
  shop: { name: string; city: string }
  bids: { id: string; status: string; total_amount: number }[]
  _count: { bids: number }
}

export default function VendorRequirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    getVendorRequirements({ page, limit: 20 })
      .then(res => { setRequirements(res.data.requirements); setTotal(res.data.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Open Requirements</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} active requirement{total !== 1 ? 's' : ''} in your zone</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : requirements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <p className="text-5xl mb-3">📋</p>
          <p className="font-semibold text-slate-600">No open requirements right now</p>
          <p className="text-slate-400 text-sm mt-1">Check back soon — we'll notify you when new ones arrive</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requirements.map(r => {
            const myBid = r.bids[0]
            const isNew = !myBid

            return (
              <Link key={r.id} href={`/vendor/requirements/${r.id}`}>
                <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isNew ? 'border-indigo-200' : 'border-slate-100'}`}>
                  {/* Top bar */}
                  <div className={`px-5 py-3 flex items-center justify-between border-b ${isNew ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                        {r.title || r.items.slice(0, 2).map(i => i.name).join(', ')}
                        {!r.title && r.items.length > 2 ? ` +${r.items.length - 2}` : ''}
                      </span>
                      {isNew && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{r._count.bids} bids</span>
                      {myBid ? (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                          myBid.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          myBid.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          Your bid: ₹{Number(myBid.total_amount).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Bid Now →
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-3">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {r.items.map(item => (
                        <span key={item.id} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                          {Number(item.quantity)} {item.unit} {item.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>🏪 {r.shop.name}, {r.shop.city}</span>
                      {r.delivery_by && <span>📅 By {new Date(r.delivery_by).toLocaleDateString('en-IN')}</span>}
                      {r.credit_terms && <span>💳 {r.credit_terms}</span>}
                      <span className="ml-auto">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50">
            ← Previous
          </button>
          <span className="px-4 py-2 text-sm text-slate-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
