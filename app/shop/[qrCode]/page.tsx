'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopInfo {
  id: string
  name: string
  city: string | null
  phone: string
}

interface PublicProduct {
  id: string
  name: string
  category: string | null
  unit: string
  selling_price: number | string
  mrp: number | string
  current_stock: number
  image_url: string | null
}

interface CartItem {
  product: PublicProduct
  quantity: number
}

type Step = 'browse' | 'cart' | 'checkout' | 'confirm'

const CATEGORIES = ['सब', 'Dairy', 'Atta/Grains', 'Oil/Ghee', 'Masale', 'Snacks', 'Drinks', 'Household', 'Personal Care', 'Other']

const CATEGORY_EMOJI: Record<string, string> = {
  'Dairy': '🥛', 'Atta/Grains': '🌾', 'Oil/Ghee': '🫙', 'Masale': '🌶️',
  'Snacks': '🍿', 'Drinks': '🥤', 'Household': '🧹', 'Personal Care': '🪥', 'Other': '📦',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerStorefront({ params }: { params: Promise<{ qrCode: string }> }) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [shop, setShop] = useState<ShopInfo | null>(null)
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [cart, setCart] = useState<CartItem[]>([])
  const [step, setStep] = useState<Step>('browse')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('सब')
  const [payMode, setPayMode] = useState<'CASH' | 'UPI'>('CASH')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    bill_number: number
    total: number
    upi_link: string | null
    upi_id: string | null
  } | null>(null)

  // Resolve params (Next.js 15+ async params)
  useEffect(() => {
    params.then(p => setQrCode(p.qrCode))
  }, [params])

  // Fetch shop + products — normalize Prisma Decimal → plain JS number at the boundary
  useEffect(() => {
    if (!qrCode) return
    fetch(`/api/public/shop/${qrCode}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); return }
        const data = await r.json()
        setShop(data.shop)
        // Prisma serializes Decimal as string. Coerce to number here so all
        // downstream arithmetic is unambiguous and the objects are plain copies.
        setProducts(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.products as any[]).map(p => ({
            ...p,
            selling_price: Number(p.selling_price),
            mrp: Number(p.mrp),
          }))
        )
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [qrCode])

  // ─── Cart helpers ────────────────────────────────────────────────────────────

  const cartTotal = cart.reduce((s, i) => s + Number(i.product.selling_price) * i.quantity, 0)
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  function addToCart(product: PublicProduct) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      // Spread a fresh copy so the cart item never shares a reference with
      // the products[] array. Prevents cross-contamination on re-renders.
      return [...prev, { product: { ...product }, quantity: 1 }]
    })
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== productId))
    } else {
      setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
    }
  }

  // ─── Filtered products ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q)
      const matchCat = category === 'सब' || p.category === category
      return matchSearch && matchCat
    })
  }, [products, search, category])

  // ─── Submit order ────────────────────────────────────────────────────────────

  async function handleOrder() {
    if (!cart.length) { toast.error('Cart खाली है'); return }
    if (!qrCode) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/shop/${qrCode}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          payment_mode: payMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Order नहीं हुआ'); return }
      // Clear cart and form BEFORE switching to confirm so the browse step
      // never renders with stale cart prices if AnimatePresence triggers it.
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setOrderResult({
        bill_number: data.bill.bill_number,
        total: Number(data.bill.total),
        upi_link: data.upi_link,
        upi_id: data.upi_id,
      })
      setStep('confirm')
    } catch {
      toast.error('कुछ गलत हुआ, फिर try करें')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Loading / Not Found ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl">🛒</span>
          <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-orange-400 font-semibold text-sm">Loading shop…</p>
        </div>
      </div>
    )
  }

  if (notFound || !shop) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-6">
        <div className="text-center">
          <span className="text-6xl">🔍</span>
          <h1 className="text-2xl font-extrabold text-gray-800 mt-4">Shop नहीं मिली</h1>
          <p className="text-gray-400 text-sm mt-2">यह QR code गलत या expired हो सकता है।</p>
        </div>
      </div>
    )
  }

  // ─── Order Confirmed ─────────────────────────────────────────────────────────

  if (step === 'confirm' && orderResult) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160 }}
          className="w-full max-w-sm"
        >
          {/* Shop header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-xl shadow-orange-200">🏪</div>
            <p className="font-bold text-gray-700 text-sm">{shop.name}</p>
          </div>

          {payMode === 'CASH' ? (
            <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-6 text-center">
              <div className="text-6xl mb-3">✅</div>
              <h2 className="text-2xl font-extrabold text-gray-800">Order हो गया!</h2>
              <p className="text-gray-500 text-sm mt-1">दुकानदार को यह नंबर दिखाएं</p>
              <div className="mt-5 bg-orange-50 border border-orange-200 rounded-2xl py-4 px-6">
                <p className="text-xs text-orange-400 font-bold uppercase tracking-widest">Order Number</p>
                <p className="text-5xl font-extrabold text-orange-600 mt-1">#{orderResult.bill_number}</p>
              </div>
              <div className="mt-4 flex justify-between items-center px-2">
                <span className="text-gray-500 text-sm">कुल राशि</span>
                <span className="text-xl font-extrabold text-gray-900">₹{orderResult.total.toLocaleString('en-IN')}</span>
              </div>
              <p className="mt-4 text-xs text-gray-400 bg-gray-50 rounded-xl py-2 px-3">
                💵 Counter पर Cash देकर अपना सामान लें
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-6 text-center">
              <div className="text-5xl mb-3">📱</div>
              <h2 className="text-xl font-extrabold text-gray-800">UPI से Payment करें</h2>
              <p className="text-gray-500 text-sm mt-1">Order #{orderResult.bill_number}</p>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl py-3 px-4">
                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Total Amount</p>
                <p className="text-4xl font-extrabold text-blue-600 mt-1">₹{orderResult.total.toLocaleString('en-IN')}</p>
              </div>

              {orderResult.upi_id && (
                <div className="mt-3 bg-gray-50 rounded-xl py-2 px-3">
                  <p className="text-xs text-gray-400">UPI ID</p>
                  <p className="font-bold text-gray-700 text-sm mt-0.5 font-mono">{orderResult.upi_id}</p>
                </div>
              )}

              {orderResult.upi_link && (
                <motion.a
                  href={orderResult.upi_link}
                  whileTap={{ scale: 0.96 }}
                  className="mt-4 w-full py-4 bg-blue-600 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-2 block"
                >
                  📲 UPI App से Pay करें
                </motion.a>
              )}

              <p className="mt-3 text-xs text-gray-400">
                Payment करने के बाद दुकानदार को दिखाएं
              </p>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setOrderResult(null); setStep('browse') }}
            className="w-full mt-4 py-3 border-2 border-orange-200 text-orange-500 font-bold text-sm rounded-2xl"
          >
            नई Shopping करें
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // ─── Main storefront layout ───────────────────────────────────────────────────

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-[#fffbf5]">

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#fffbf5]/95 backdrop-blur-md border-b border-orange-100/60">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-xl shadow-md shadow-orange-200">🏪</div>
            <div>
              <p className="font-extrabold text-gray-900 text-[15px] leading-tight">{shop.name}</p>
              {shop.city && <p className="text-[11px] text-gray-400">📍 {shop.city}</p>}
            </div>
          </div>

          {cartCount > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setStep('cart')}
              className="relative flex items-center gap-1.5 h-9 px-3.5 bg-orange-500 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-200"
            >
              🛒 Cart
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-white text-orange-500 text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 border border-orange-100">
                {cartCount}
              </span>
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ─────────────── BROWSE ─────────────── */}
        {step === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
            className="px-4 pt-3 pb-28"
          >
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="सामान खोजें…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
              />
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(c => (
                <motion.button
                  key={c}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    category === c
                      ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                      : 'bg-white text-gray-500 border border-gray-100'
                  }`}
                >
                  {CATEGORY_EMOJI[c] || ''} {c}
                </motion.button>
              ))}
            </div>

            {/* Product count */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              {filtered.length} products available
            </p>

            {/* Products grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl">🔍</span>
                <p className="text-gray-500 font-semibold mt-3">कोई product नहीं मिला</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((p, i) => {
                  const ci = cart.find(x => x.product.id === p.id)
                  const price = Number(p.selling_price)
                  const mrp = Number(p.mrp)
                  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={`bg-white border rounded-2xl p-3 flex flex-col ${ci ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100'}`}
                    >
                      {/* Product image placeholder */}
                      <div className="w-full aspect-square bg-orange-50 rounded-xl mb-2.5 flex items-center justify-center text-3xl">
                        {CATEGORY_EMOJI[p.category || ''] || '📦'}
                      </div>

                      <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 mb-1">{p.name}</p>

                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-orange-500 font-extrabold text-sm">₹{price.toFixed(0)}</span>
                        {discount > 0 && (
                          <>
                            <span className="text-gray-300 text-[10px] line-through">₹{mrp.toFixed(0)}</span>
                            <span className="text-[9px] font-bold text-green-500 bg-green-50 px-1 rounded">{discount}% off</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mb-2">{p.unit}</p>

                      {ci ? (
                        <div className="flex items-center gap-2 mt-auto">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => updateQty(p.id, ci.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-lg"
                          >−</motion.button>
                          <span className="flex-1 text-center font-bold text-sm text-gray-800">{ci.quantity}</span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => updateQty(p.id, ci.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-lg shadow-sm"
                          >+</motion.button>
                        </div>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => addToCart(p)}
                          className="mt-auto w-full py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-200 flex items-center justify-center gap-1"
                        >
                          + Add
                        </motion.button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Sticky cart CTA */}
            {cartCount > 0 && (
              <motion.button
                initial={{ y: 80 }}
                animate={{ y: 0 }}
                onClick={() => setStep('cart')}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[448px] py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-2xl flex items-center justify-between px-5 z-30"
              >
                <span className="text-sm bg-orange-500 rounded-lg px-2 py-0.5">{cartCount} items</span>
                <span>Cart देखें →</span>
                <span className="font-extrabold">₹{cartTotal.toFixed(0)}</span>
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ─────────────── CART ─────────────── */}
        {step === 'cart' && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="px-4 pt-3 pb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep('browse')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="font-extrabold text-gray-800 text-lg">आपका Cart</h2>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl">🛒</span>
                <p className="text-gray-500 font-semibold mt-3">Cart खाली है</p>
                <button onClick={() => setStep('browse')} className="mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm">
                  Products देखें →
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-4">
                  {cart.map((item, i) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                        {CATEGORY_EMOJI[item.product.category || ''] || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          ₹{Number(item.product.selling_price).toFixed(0)} × {item.quantity} = {' '}
                          <span className="font-bold text-orange-500">
                            ₹{(Number(item.product.selling_price) * item.quantity).toFixed(0)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateQty(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center">−</motion.button>
                        <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateQty(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold text-lg flex items-center justify-center">+</motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Total */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">कुल राशि</span>
                    <span className="text-2xl font-extrabold text-orange-500">₹{cartTotal.toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{cartCount} items • {shop.name}</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setStep('checkout')}
                  className="w-full py-4 bg-orange-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-orange-200"
                >
                  Order करें → ₹{cartTotal.toFixed(0)}
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {/* ─────────────── CHECKOUT ─────────────── */}
        {step === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="px-4 pt-3 pb-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep('cart')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="font-extrabold text-gray-800 text-lg">Checkout</h2>
            </div>

            {/* Order summary */}
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-5">
              <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Order Summary</p>
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.product.name} <span className="text-gray-400">×{item.quantity}</span></span>
                  <span className="font-semibold text-gray-800">₹{(Number(item.product.selling_price) * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              <div className="h-px bg-orange-100 my-2" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-extrabold text-orange-600">₹{cartTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* Customer info (optional) */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">आपकी जानकारी (optional)</p>
            <div className="flex flex-col gap-2.5 mb-5">
              <input
                type="text"
                placeholder="आपका नाम (जरूरी नहीं)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 transition"
              />
              <input
                type="tel"
                placeholder="मोबाइल नंबर (जरूरी नहीं)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                maxLength={10}
                className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm placeholder:text-gray-300 focus:ring-2 focus:ring-orange-200 transition"
              />
            </div>

            {/* Payment mode */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment का तरीका</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { value: 'CASH' as const, emoji: '💵', label: 'Counter पर Cash', sub: 'सामान लेते वक्त दें' },
                { value: 'UPI' as const, emoji: '📱', label: 'UPI से अभी', sub: 'PhonePe / GPay / Paytm' },
              ].map(m => (
                <motion.button
                  key={m.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPayMode(m.value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                    payMode === m.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className={`text-xs font-bold ${payMode === m.value ? 'text-orange-600' : 'text-gray-600'}`}>{m.label}</span>
                  <span className={`text-[10px] text-center px-1 ${payMode === m.value ? 'text-orange-400' : 'text-gray-400'}`}>{m.sub}</span>
                </motion.button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleOrder}
              disabled={submitting}
              className="w-full py-4 bg-orange-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Order दे रहे हैं…</>
                : <>🧾 Order Confirm करें · ₹{cartTotal.toFixed(0)}</>
              }
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
