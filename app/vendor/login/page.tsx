'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getVendorMe } from '@/lib/vendorApi'
import { useVendorStore } from '@/lib/vendorStore'
import toast from 'react-hot-toast'

export default function VendorLogin() {
  const router = useRouter()
  const { setVendor, isRegistered } = useVendorStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isRegistered) router.replace('/vendor/dashboard')
  }, [isRegistered, router])

  async function handleDevLogin() {
    setLoading(true)
    try {
      const res = await getVendorMe()
      setVendor(res.data.vendor)
      router.replace('/vendor/dashboard')
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'VENDOR_NOT_REGISTERED') {
        router.replace('/vendor/onboarding')
      } else {
        toast.error('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="text-white font-extrabold text-2xl">D</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">DukaaanOS</h1>
          <p className="text-indigo-300 text-sm mt-1 font-medium">Vendor Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-7">Sign in to manage your bids and requirements</p>

          {/* Dev mode login */}
          {process.env.NEXT_PUBLIC_DEV_MODE === 'true' ? (
            <div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                <p className="text-amber-700 text-xs font-semibold">⚡ Dev Mode Active</p>
                <p className="text-amber-600 text-xs mt-0.5">Firebase auth bypassed — direct login enabled</p>
              </div>
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</> : 'Continue as Vendor →'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-500 text-sm text-center mb-5">
                Use your registered mobile number with OTP to sign in
              </p>
              {/* Firebase OTP UI goes here — same pattern as shopkeeper login */}
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</> : 'Login with Phone →'}
              </button>
            </div>
          )}

          <p className="text-center text-slate-400 text-xs mt-6">
            New vendor?{' '}
            <button onClick={() => router.push('/vendor/onboarding')} className="text-indigo-600 font-semibold hover:underline">
              Register here
            </button>
          </p>
        </div>

        <p className="text-center text-indigo-400/60 text-xs mt-6">
          Shopkeeper?{' '}
          <a href="/login" className="text-indigo-300 hover:underline">Shopkeeper portal →</a>
        </p>
      </div>
    </div>
  )
}
