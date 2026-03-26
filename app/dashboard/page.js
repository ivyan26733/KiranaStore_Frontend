'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getDailySummary, getProducts } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

function AnimatedAmount({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = parseFloat(value) || 0
    if (!target) return
    let frame
    let current = 0
    const step = target / 30
    const tick = () => {
      current = Math.min(current + step, target)
      setDisplay(Math.floor(current))
      if (current < target) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <span>₹{display.toLocaleString('en-IN')}</span>
}

const ACTIONS = [
  { href: '/billing',         icon: '🧾', label: 'नया बिल',      sub: 'New Bill',     accent: 'orange' },
  { href: '/products/new',    icon: '➕', label: 'Product जोड़ें', sub: 'Add Product',  accent: 'green'  },
  { href: '/products',        icon: '📦', label: 'Stock',         sub: 'Inventory',    accent: 'blue'   },
  { href: '/billing/history', icon: '📊', label: 'रिपोर्ट',       sub: 'Sales Report', accent: 'purple' },
]

const ACCENT = {
  orange: { bg: 'bg-orange-50', border: 'border-orange-100', icon: 'bg-orange-100' },
  green:  { bg: 'bg-green-50',  border: 'border-green-100',  icon: 'bg-green-100'  },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'bg-blue-100'   },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'bg-purple-100' },
}

export default function DashboardPage() {
  const { shopkeeper, shop } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDailySummary(), getProducts()])
      .then(([s, p]) => {
        setSummary(s.data.summary)
        setLowStock((p.data.products || []).filter(
          (x) => x.current_stock <= x.low_stock_alert && x.current_stock > 0
        ).slice(0, 3))
      })
      .catch(() => toast.error('Data load नहीं हुआ'))
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'शुभ प्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या'
  const greetEmoji = hour < 12 ? '🌅' : hour < 17 ? '🙏' : '🌆'

  return (
    <div className="max-w-[480px] mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#fffbf5]/90 backdrop-blur-md border-b border-orange-100/50">
        <div className="px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-orange-500 tracking-wide uppercase">
              {greeting} {greetEmoji}
            </p>
            <h1 className="text-[17px] font-bold text-gray-900 leading-tight">
              {shop?.name || 'Your Store'}
            </h1>
          </div>
          <Link href="/profile">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-200"
            >
              🏪
            </motion.div>
          </Link>
        </div>
      </div>

      <div className="px-4 pb-24">

        {/* ── Revenue card ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-5 overflow-hidden shadow-xl shadow-orange-200/60"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-8 w-32 h-32 bg-black/5 rounded-full pointer-events-none" />

          <div className="relative">
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest mb-1">
              आज की कमाई · Today's Revenue
            </p>
            <div className="text-[38px] font-extrabold text-white leading-none tracking-tight mb-4">
              {loading
                ? <div className="w-36 h-10 bg-orange-400/40 rounded-xl animate-pulse" />
                : <AnimatedAmount value={Number(summary?.total_revenue || 0)} />
              }
            </div>
            <div className="grid grid-cols-4 gap-0 pt-3 border-t border-white/20">
              {[
                { label: 'Bills',  v: summary?.total_bills || 0,                    prefix: '' },
                { label: 'Cash',   v: Number(summary?.cash_total || 0),             prefix: '₹' },
                { label: 'UPI',    v: Number(summary?.upi_total || 0),              prefix: '₹' },
                { label: 'उधार',   v: Number(summary?.udhaari_total || 0),          prefix: '₹' },
              ].map((s, i) => (
                <div key={s.label} className={`text-center ${i > 0 ? 'border-l border-white/20' : ''}`}>
                  <p className="text-orange-200 text-[10px] font-medium mb-0.5">{s.label}</p>
                  <p className="text-white font-bold text-sm">
                    {loading ? '—' : `${s.prefix}${Number(s.v).toLocaleString('en-IN')}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Quick actions ────────────────────────────────────────────── */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {ACTIONS.map((a, i) => {
              const c = ACCENT[a.accent]
              return (
                <motion.div
                  key={a.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.06 }}
                >
                  <Link href={a.href}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`${c.bg} border ${c.border} rounded-2xl p-3.5 flex items-center gap-3`}
                    >
                      <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                        {a.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm leading-tight">{a.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{a.sub}</p>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Low stock ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!loading && lowStock.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-5"
            >
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Low Stock Alert</p>
                <Link href="/products" className="text-xs text-orange-500 font-semibold">See all →</Link>
              </div>
              <div className="flex flex-col gap-2">
                {lowStock.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-amber-600 mt-0.5">सिर्फ {p.current_stock} बचे हैं</p>
                    </div>
                    <span className="text-lg">⚠️</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
