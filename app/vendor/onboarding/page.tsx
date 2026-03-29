'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerVendor } from '@/lib/vendorApi'
import { useVendorStore } from '@/lib/vendorStore'
import toast from 'react-hot-toast'

const CATEGORIES = ['Dairy', 'Atta/Grains', 'Oil/Ghee', 'Masale', 'Snacks', 'Drinks', 'Household', 'Personal Care', 'Tobacco', 'Frozen', 'Other']

export default function VendorOnboarding() {
  const router = useRouter()
  const { setVendor } = useVendorStore()

  const [form, setForm] = useState({
    name: '', phone: '', city: '', address: '', gstin: '', fssai: '',
    categories: [] as string[],
  })
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const toggleCat = (cat: string) =>
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))

  async function handleSubmit() {
    if (!form.name || !form.phone || !form.city) { toast.error('All required fields must be filled.'); return }
    if (!form.categories.length) { toast.error('Select at least one supply category.'); return }
    setLoading(true)
    try {
      const res = await registerVendor(form)
      setVendor(res.data.vendor)
      toast.success('Registration successful!')
      router.replace('/vendor/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
            <span className="text-white font-extrabold text-xl">D</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Vendor Registration</h1>
          <p className="text-indigo-300 text-sm mt-1">Join the DukaaanOS supply network</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-indigo-400' : 'bg-white/20'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-5">Business Details</h2>
              <div className="flex flex-col gap-4">
                <Field label="Business Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Sharma Distributors" />
                <Field label="Mobile Number *" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="9876543210" type="tel" />
                <Field label="City *" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Delhi" />
                <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} placeholder="123, Okhla Industrial Area..." />
              </div>
              <button
                onClick={() => {
                  if (!form.name || !form.phone || !form.city) { toast.error('Please fill all required fields.'); return }
                  setStep(2)
                }}
                className="mt-6 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Documents & Categories</h2>
              <p className="text-slate-400 text-xs mb-5">Optional but recommended for verification badge</p>
              <div className="flex flex-col gap-4 mb-5">
                <Field label="GST Number" value={form.gstin} onChange={v => setForm(f => ({ ...f, gstin: v }))} placeholder="27AAAAA0000A1Z5" />
                <Field label="FSSAI License" value={form.fssai} onChange={v => setForm(f => ({ ...f, fssai: v }))} placeholder="10021011000001" />
              </div>

              <p className="text-sm font-semibold text-slate-700 mb-3">Supply Categories *</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCat(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      form.categories.includes(cat)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering…</> : 'Register →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
      />
    </div>
  )
}
