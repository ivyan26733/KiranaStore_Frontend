'use client'

import { motion } from 'framer-motion'

export default function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const base = 'w-full py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50'
  const variants = {
    primary:   'bg-orange-500 text-white shadow-lg shadow-orange-200 hover:bg-orange-600 active:bg-orange-700',
    secondary: 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100',
    danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    ghost:     'text-orange-500 hover:bg-orange-50',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  )
}
