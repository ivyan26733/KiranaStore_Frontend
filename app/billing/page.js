'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import AppHeader from '@/components/AppHeader'
import EmptyState from '@/components/EmptyState'
import { getProducts, createBill } from '@/lib/api'
import { useCartStore } from '@/lib/store'
import Link from 'next/link'

const PAY_MODES = [
  { value: 'CASH',    emoji: '💵', label: 'Cash',   hi: 'नकद'  },
  { value: 'UPI',     emoji: '📱', label: 'UPI',    hi: 'UPI'  },
  { value: 'UDHAARI', emoji: '📒', label: 'Credit', hi: 'उधार' },
]

export default function BillingPage() {
  const router = useRouter()
  const { items, addItem, removeItem, updateQuantity, clearCart } = useCartStore()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [payMode, setPayMode] = useState('CASH')
  const [discount, setDiscount] = useState('')
  const [view, setView] = useState('products') // 'products' | 'cart'
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getProducts()
      .then(r => setProducts(r.data.products || []))
      .catch(() => toast.error('Products load नहीं हुए'))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return products.slice(0, 30)
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q)
    )
  }, [products, search])

  const subtotal = items.reduce((s, i) => s + Number(i.product.selling_price) * i.quantity, 0)
  const discountAmt = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmt)
  const cartCount = items.reduce((s, i) => s + i.quantity, 0)

  function addToCart(p) {
    if (p.current_stock === 0) { toast.error(`${p.name} — stock नहीं है`); return }
    addItem(p)
  }

  async function handleSubmit() {
    if (!items.length) { toast.error('Cart खाली है'); return }
    setSubmitting(true)
    try {
      await createBill({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_mode: payMode,
        discount: discountAmt || undefined,
      })
      clearCart()
      toast.success('🎉 Bill बन गया!')
      router.push('/billing/history')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bill नहीं बना, retry करें')
    } finally {
      setSubmitting(false)
    }
  }

  const cartItem = (pid) => items.find(i => i.product.id === pid)

  return (
    <div className="max-w-[480px] mx-auto flex flex-col min-h-screen">
      <AppHeader
        title="नया बिल · New Bill"
        titleHi={`${products.length} products available`}
        right={
          cartCount > 0 && (
            <button onClick={() => setView(v => v === 'cart' ? 'products' : 'cart')}
              className="relative flex items-center gap-1.5 h-9 px-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200">
              🛒 Cart
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-orange-500 text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 border border-orange-100">
                {cartCount}
              </span>
            </button>
          )
        }
      />

      {/* Tab toggle */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {[{v:'products',l:'📦 Products'},{v:'cart',l:`🛒 Cart${cartCount ? ` (${cartCount})` : ''}`}].map(t => (
            <button key={t.v} onClick={() => setView(t.v)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${view === t.v ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Products ── */}
        {view === 'products' && (
          <motion.div key="products" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}} transition={{duration:0.18}}
            className="flex-1 px-4 pb-28">
            <div className="relative mb-3">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" placeholder="Product search करें…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition" />
            </div>

            {filtered.length === 0
              ? <EmptyState emoji="🔍" title="No results" subtitle="Try a different search" />
              : (
                <div className="flex flex-col gap-2">
                  {filtered.map(p => {
                    const ci = cartItem(p.id)
                    const outOfStock = p.current_stock === 0
                    return (
                      <div key={p.id}
                        className={`bg-white border rounded-2xl px-4 py-3 flex items-center gap-3 transition ${ci ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-orange-500 font-bold text-sm">₹{Number(p.selling_price).toFixed(0)}</span>
                            <span className={`text-[10px] font-semibold ${outOfStock ? 'text-red-400' : p.current_stock <= p.low_stock_alert ? 'text-amber-500' : 'text-green-500'}`}>
                              {outOfStock ? 'Out of stock' : `${p.current_stock} left`}
                            </span>
                          </div>
                        </div>
                        {ci ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <motion.button whileTap={{scale:0.85}}
                              onClick={() => updateQuantity(p.id, ci.quantity - 1)}
                              className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg">−</motion.button>
                            <span className="w-5 text-center font-bold text-sm text-gray-800">{ci.quantity}</span>
                            <motion.button whileTap={{scale:0.85}}
                              onClick={() => updateQuantity(p.id, ci.quantity + 1)}
                              className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-lg shadow-sm">+</motion.button>
                          </div>
                        ) : (
                          <motion.button whileTap={{scale:0.85}}
                            onClick={() => addToCart(p)} disabled={outOfStock}
                            className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200 disabled:opacity-30 shrink-0">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                            </svg>
                          </motion.button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            }

            {/* Sticky go-to-cart CTA */}
            {cartCount > 0 && (
              <motion.button
                initial={{y:80}} animate={{y:0}}
                onClick={() => setView('cart')}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[448px] py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-2xl flex items-center justify-between px-5 z-30"
              >
                <span className="text-sm bg-orange-500 rounded-lg px-2 py-0.5">{cartCount} items</span>
                <span>Cart देखें →</span>
                <span className="font-extrabold">₹{subtotal.toFixed(0)}</span>
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ── Cart ── */}
        {view === 'cart' && (
          <motion.div key="cart" initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:10}} transition={{duration:0.18}}
            className="flex-1 px-4 pb-8">
            {items.length === 0 ? (
              <EmptyState emoji="🛒" title="Cart खाली है" subtitle="Products tab से items add करें"
                action={<button onClick={() => setView('products')} className="px-5 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-200">Products देखें →</button>}
              />
            ) : (
              <>
                {/* Cart items */}
                <div className="flex flex-col gap-2 mb-4">
                  {items.map((item, i) => (
                    <motion.div key={item.product.id} layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                      className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          ₹{Number(item.product.selling_price).toFixed(0)} × {item.quantity} = <span className="font-bold text-orange-500">₹{(Number(item.product.selling_price) * item.quantity).toFixed(0)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <motion.button whileTap={{scale:0.85}} onClick={() => updateQuantity(item.product.id, item.quantity-1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center">−</motion.button>
                        <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                        <motion.button whileTap={{scale:0.85}} onClick={() => updateQuantity(item.product.id, item.quantity+1)}
                          className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold text-lg flex items-center justify-center">+</motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Bill summary */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-2.5">
                    <span>Subtotal</span><span className="font-semibold text-gray-800">₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-sm text-gray-500">Discount</span>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input type="number" inputMode="decimal" value={discount} onChange={e => setDiscount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-xl text-sm text-right font-semibold text-gray-800 focus:ring-2 focus:ring-orange-200" />
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 mb-2.5" />
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-extrabold text-orange-500">₹{total.toFixed(0)}</span>
                  </div>
                </div>

                {/* Payment mode */}
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Mode</p>
                <div className="flex gap-2 mb-5">
                  {PAY_MODES.map(m => (
                    <motion.button key={m.value} whileTap={{scale:0.93}} onClick={() => setPayMode(m.value)}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-3.5 rounded-2xl border-2 transition-all ${payMode === m.value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}>
                      <span className="text-xl">{m.emoji}</span>
                      <span className={`text-[11px] font-bold ${payMode === m.value ? 'text-orange-600' : 'text-gray-500'}`}>{m.hi}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Submit */}
                <motion.button whileTap={{scale:0.97}} onClick={handleSubmit} disabled={submitting}
                  className="w-full py-4 bg-orange-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting
                    ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing…</>
                    : <>🧾 Bill बनाएं · ₹{total.toFixed(0)}</>
                  }
                </motion.button>
              </>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
