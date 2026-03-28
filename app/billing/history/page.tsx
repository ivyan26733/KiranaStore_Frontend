'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppHeader from '@/components/AppHeader'
import EmptyState from '@/components/EmptyState'
import Spinner from '@/components/Spinner'
import { getBills } from '@/lib/api'

interface BillItem {
  id: string
  product_name: string
  quantity: number
  total_price: number | string
}

interface Bill {
  id: string
  bill_number: number
  total: number | string
  discount: number | string
  payment_mode: string
  created_at: string
  items?: BillItem[]
}

const MODE: Record<string, { label: string; color: string }> = {
  CASH:    { label: 'Cash',   color: 'bg-green-100 text-green-700'  },
  UPI:     { label: 'UPI',    color: 'bg-blue-100  text-blue-700'   },
  UDHAARI: { label: 'उधार',  color: 'bg-amber-100 text-amber-700'  },
}

function BillCard({ bill, index }: { bill: Bill; index: number }) {
  const [open, setOpen] = useState(false)
  const m = MODE[bill.payment_mode] || MODE.CASH
  const d = new Date(bill.created_at)
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const isToday = d.toDateString() === new Date().toDateString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
    >
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg shrink-0">🧾</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">Bill #{bill.bill_number}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isToday ? 'Today' : date} · {time}
            {bill.items?.length ? ` · ${bill.items.length} items` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-base font-extrabold text-gray-900">₹{Number(bill.total).toLocaleString('en-IN')}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-300 ml-1 shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="border-t border-gray-50 overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1.5">
              {bill.items?.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.product_name} <span className="text-gray-300">×{item.quantity}</span></span>
                  <span className="font-semibold text-gray-800">₹{Number(item.total_price).toFixed(0)}</span>
                </div>
              ))}
              {Number(bill.discount) > 0 && (
                <div className="flex justify-between text-sm pt-1.5 border-t border-gray-50 mt-1">
                  <span className="text-green-600 font-medium">Discount</span>
                  <span className="text-green-600 font-semibold">−₹{Number(bill.discount).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-gray-100 mt-1">
                <span className="text-gray-700">Total</span>
                <span className="text-orange-500">₹{Number(bill.total).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function BillingHistoryPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => { load(1) }, [])

  async function load(p: number) {
    p === 1 ? setLoading(true) : setLoadingMore(true)
    try {
      const res = await getBills({ page: p, limit: 20 })
      if (p === 1) {
        setBills(res.data.bills)
      } else {
        setBills(prev => [...prev, ...res.data.bills])
      }
      setTotal(res.data.total)
      setPage(p)
    } catch { toast.error('Bills load नहीं हुए') }
    finally { setLoading(false); setLoadingMore(false) }
  }

  const todayRevenue = bills
    .filter((b: Bill) => new Date(b.created_at).toDateString() === new Date().toDateString())
    .reduce((s: number, b: Bill) => s + Number(b.total), 0)

  return (
    <div className="max-w-[480px] mx-auto">
      <AppHeader
        title="Bills · बिल History"
        titleHi={`${total} total transactions`}
        right={
          <Link href="/billing">
            <motion.button whileTap={{ scale: 0.9 }}
              className="h-9 px-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200">
              + New
            </motion.button>
          </Link>
        }
      />

      <div className="px-4 pb-24 pt-3">
        {/* Today's summary strip */}
        {!loading && bills.length > 0 && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 mb-4">
            <div>
              <p className="text-[11px] text-orange-400 font-bold uppercase tracking-wide">आज की कमाई</p>
              <p className="text-xl font-extrabold text-orange-600">₹{todayRevenue.toLocaleString('en-IN')}</p>
            </div>
            <span className="text-3xl">📊</span>
          </div>
        )}

        {loading
          ? <Spinner />
          : bills.length === 0
          ? <EmptyState emoji="🧾" title="अभी कोई bill नहीं" subtitle="पहला bill बनाएं!"
              action={<Link href="/billing"><button className="px-5 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200">नया Bill →</button></Link>}
            />
          : (
            <>
              <div className="flex flex-col gap-2.5">
                {bills.map((b: Bill, i: number) => <BillCard key={b.id} bill={b} index={i} />)}
              </div>

              {bills.length < total && (
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => load(page + 1)} disabled={loadingMore}
                  className="w-full mt-4 py-3 border-2 border-gray-200 text-gray-500 font-semibold text-sm rounded-2xl flex items-center justify-center gap-2">
                  {loadingMore
                    ? <><div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"/>Loading…</>
                    : 'Load More Bills'
                  }
                </motion.button>
              )}
            </>
          )
        }
      </div>
    </div>
  )
}
