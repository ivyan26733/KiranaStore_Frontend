import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Shopkeeper {
  id: string
  name: string
  phone: string
  language: string
}

export interface Shop {
  id: string
  name: string
  address?: string | null
  city?: string | null
  qr_code?: string | null
}

export interface Product {
  id: string
  name: string
  name_local?: string | null
  barcode?: string | null
  category?: string | null
  unit: string
  mrp: number | string
  selling_price: number | string
  current_stock: number
  low_stock_alert: number
  image_url?: string | null
  is_active: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

// ─── Auth / Shop Store ────────────────────────────────────────────────────────

interface AuthState {
  shopkeeper: Shopkeeper | null
  shop: Shop | null
  isRegistered: boolean
  setAuth: (shopkeeper: Shopkeeper, shop: Shop) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      shopkeeper: null,
      shop: null,
      isRegistered: false,

      setAuth: (shopkeeper: Shopkeeper, shop: Shop) =>
        set({ shopkeeper, shop, isRegistered: true }),

      clearAuth: () =>
        set({ shopkeeper: null, shop: null, isRegistered: false }),
    }),
    { name: 'dukaanos-auth' }
  )
)

// ─── Cart Store (for billing page) ───────────────────────────────────────────

interface CartState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  addItem: (product: Product) => {
    const items = get().items
    const existing = items.find((i) => i.product.id === product.id)

    if (existing) {
      set({
        items: items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      })
    } else {
      set({ items: [...items, { product, quantity: 1 }] })
    }
  },

  removeItem: (productId: string) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      set({ items: get().items.filter((i) => i.product.id !== productId) })
    } else {
      set({
        items: get().items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        ),
      })
    }
  },

  clearCart: () => set({ items: [] }),

  get total() {
    return get().items.reduce(
      (sum, i) => sum + Number(i.product.selling_price) * i.quantity,
      0
    )
  },

  get count() {
    return get().items.reduce((sum, i) => sum + i.quantity, 0)
  },
}))
