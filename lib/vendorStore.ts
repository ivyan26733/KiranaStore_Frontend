import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VendorProfile {
  id: string
  name: string
  phone: string
  city: string
  address?: string | null
  gstin?: string | null
  fssai?: string | null
  categories: string[]
  is_verified: boolean
  is_active: boolean
}

interface VendorState {
  vendor: VendorProfile | null
  isRegistered: boolean
  unreadCount: number
  setVendor: (vendor: VendorProfile) => void
  clearVendor: () => void
  setUnreadCount: (n: number) => void
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set) => ({
      vendor: null,
      isRegistered: false,
      unreadCount: 0,
      setVendor: (vendor) => set({ vendor, isRegistered: true }),
      clearVendor: () => set({ vendor: null, isRegistered: false, unreadCount: 0 }),
      setUnreadCount: (n) => set({ unreadCount: n }),
    }),
    { name: 'vendor-store' }
  )
)
