export default function Input({ label, labelHi, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-semibold text-gray-700">
          {labelHi && <span className="text-orange-500">{labelHi} </span>}
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-orange-100'} bg-white text-gray-800 placeholder:text-gray-300 text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
