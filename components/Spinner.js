export default function Spinner({ size = 'md' }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizeMap[size]} border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin`} />
    </div>
  )
}
