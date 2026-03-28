'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AppHeader from '@/components/AppHeader'
import { useAuthStore } from '@/lib/store'
import { getMe } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { shopkeeper, shop, setAuth, clearAuth } = useAuthStore()
  const [loading, setLoading] = useState(!shopkeeper)

  useEffect(() => {
    if (!shopkeeper) {
      getMe()
        .then(r => setAuth(r.data.shopkeeper, r.data.shop))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLogout() {
    clearAuth()
    toast.success('Logged out')
    router.replace('/login')
  }

  const info = [
    { label: 'Shop Name',  value: shop?.name },
    { label: 'City',       value: shop?.city || '—' },
    { label: 'Owner',      value: shopkeeper?.name },
    { label: 'Phone',      value: shopkeeper?.phone },
    { label: 'Language',   value: shopkeeper?.language?.toUpperCase() },
    { label: 'QR Code',    value: shop?.qr_code },
  ]

  return (
    <div className="max-w-[480px] mx-auto">
      <AppHeader title="Shop Profile" titleHi="दुकान की जानकारी" />

      <div className="px-4 pb-24 pt-5">
        {/* Avatar block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-7"
        >
          <div className="w-20 h-20 rounded-3xl bg-orange-500 flex items-center justify-center text-4xl shadow-xl shadow-orange-200 mb-3">
            🏪
          </div>
          <p className="text-xl font-extrabold text-gray-900">{shopkeeper?.name || '—'}</p>
          <p className="text-sm text-gray-400 mt-0.5">{shop?.name}</p>
        </motion.div>

        {/* Info card */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-4">
          {info.map((row, i) => (
            <div key={row.label} className={`flex justify-between items-center px-4 py-3.5 ${i < info.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <span className="text-sm text-gray-400">{row.label}</span>
              <span className="text-sm font-semibold text-gray-800 max-w-[200px] truncate text-right">{row.value || '—'}</span>
            </div>
          ))}
        </div>

        {/* App badge */}
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3.5 mb-5">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md shadow-orange-200">🏪</div>
          <div>
            <p className="font-bold text-orange-600 text-sm">DukaaanOS</p>
            <p className="text-[11px] text-gray-400">Smart Kirana Management · MVP v1.0</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition"
        >
          Logout करें
        </motion.button>
      </div>
    </div>
  )
}
