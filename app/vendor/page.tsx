'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVendorStore } from '@/lib/vendorStore'

export default function VendorRoot() {
  const router = useRouter()
  const { isRegistered } = useVendorStore()
  useEffect(() => {
    router.replace(isRegistered ? '/vendor/dashboard' : '/vendor/login')
  }, [isRegistered, router])
  return null
}
