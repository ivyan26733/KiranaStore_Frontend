'use client'

import { motion } from 'framer-motion'

export default function ProductCard({ product, onAdd, showStock = false }) {
  const isLowStock = product.current_stock <= product.low_stock_alert
  const isOutOfStock = product.current_stock === 0

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(249,115,22,0.15)' }}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-2xl p-4 border border-orange-50 shadow-card"
    >
      {/* Product image or placeholder */}
      <div className="w-full h-24 rounded-xl bg-orange-50 flex items-center justify-center mb-3 text-4xl overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
          : '🛒'
        }
      </div>

      <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">{product.name}</h3>
      {product.category && (
        <span className="text-[10px] text-orange-400 font-medium bg-orange-50 px-2 py-0.5 rounded-full mt-1 inline-block">
          {product.category}
        </span>
      )}

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-lg font-bold text-gray-900">₹{Number(product.selling_price).toFixed(0)}</p>
          {showStock && (
            <p className={`text-[11px] font-medium mt-0.5 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-500' : 'text-green-500'}`}>
              {isOutOfStock ? 'Out of stock' : `${product.current_stock} left`}
            </p>
          )}
        </div>
        {onAdd && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onAdd(product)}
            disabled={isOutOfStock}
            className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
