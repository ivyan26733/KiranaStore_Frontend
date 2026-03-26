import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Auth / Shop Store ────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set) => ({
      shopkeeper: null,
      shop: null,
      isRegistered: false,

      setAuth: (shopkeeper, shop) =>
        set({ shopkeeper, shop, isRegistered: true }),

      clearAuth: () =>
        set({ shopkeeper: null, shop: null, isRegistered: false }),
    }),
    { name: 'dukaanos-auth' }
  )
)

// ─── Cart Store (for billing page) ───────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: [], // [{ product, quantity }]

  addItem: (product) => {
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

  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.product.id !== productId) }),

  updateQuantity: (productId, quantity) => {
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
