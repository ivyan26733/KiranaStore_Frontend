'use client'

import { useEffect } from 'react'
import { useZxing } from 'react-zxing'
import { motion } from 'framer-motion'

interface BarcodeScannerProps {
  onDetect: (code: string) => void
  onClose: () => void
}

/**
 * Full-screen camera barcode scanner overlay.
 * Calls onDetect(code) when a barcode is read, onClose to dismiss.
 */
export default function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const { ref } = useZxing({
    onDecodeResult(result) {
      onDetect(result.getText())
    },
    constraints: {
      video: {
        facingMode: 'environment', // rear camera
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    },
  })

  // Lock body scroll while scanner is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Camera feed */}
      <video
        ref={ref}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay with cutout */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top dark band */}
        <div className="flex-1 bg-black/60" />

        {/* Scan window row */}
        <div className="flex items-center">
          <div className="flex-1 bg-black/60 h-52" />

          {/* The scan window */}
          <div className="relative w-64 h-52">
            {/* Corner marks */}
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
              <div key={i} className={`absolute w-7 h-7 ${pos} border-orange-400 ${
                i === 0 ? 'border-t-2 border-l-2 rounded-tl-lg' :
                i === 1 ? 'border-t-2 border-r-2 rounded-tr-lg' :
                i === 2 ? 'border-b-2 border-l-2 rounded-bl-lg' :
                          'border-b-2 border-r-2 rounded-br-lg'
              }`} />
            ))}

            {/* Animated scan line */}
            <motion.div
              className="absolute left-2 right-2 h-0.5 bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]"
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="flex-1 bg-black/60 h-52" />
        </div>

        {/* Bottom dark band */}
        <div className="flex-1 bg-black/60" />
      </div>

      {/* UI chrome */}
      <div className="absolute top-0 left-0 right-0 safe-top">
        <div className="flex items-center justify-between px-5 py-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 bg-black/40 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
          <span className="text-white font-semibold text-sm bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur">
            Barcode Scan करें
          </span>
          <div className="w-10" />
        </div>
      </div>

      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-2">
        <p className="text-white/70 text-sm">बारकोड को frame में रखें</p>
        <p className="text-orange-400 text-xs font-medium">Auto-detect होगा</p>
      </div>
    </motion.div>
  )
}
