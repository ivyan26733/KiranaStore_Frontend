import axios from 'axios'

// Separate axios instance for vendor portal
const vendorApi = axios.create({ baseURL: '/api/vendor' })

vendorApi.interceptors.request.use((config) => {
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    config.headers['x-dev-uid'] = 'vendor-dev-001'
    return config
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendor_fb_token') : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerVendor = (data: {
  name: string; phone: string; city: string
  address?: string; gstin?: string; fssai?: string; categories?: string[]
}) => vendorApi.post('/auth/register', data)

export const getVendorMe = () => vendorApi.get('/auth/me')

// ── Requirements ──────────────────────────────────────────────────────────────
export const getVendorRequirements = (params?: { page?: number; limit?: number }) =>
  vendorApi.get('/requirements', { params })

export const getVendorRequirementById = (id: string) =>
  vendorApi.get(`/requirements/${id}`)

// ── Bids ──────────────────────────────────────────────────────────────────────
export const submitBid = (requirementId: string, data: {
  items: { name: string; quantity: number; unit: string; unit_price: number; total_price: number; notes?: string }[]
  total_amount: number
  delivery_by?: string
  credit_terms?: string
  notes?: string
  valid_until?: string
}) => vendorApi.post(`/requirements/${requirementId}/bid`, data)

export const withdrawBid = (bidId: string) => vendorApi.delete(`/bids/${bidId}`)

export const getVendorBids = (params?: { status?: string }) =>
  vendorApi.get('/bids', { params })

// ── Deals ─────────────────────────────────────────────────────────────────────
export const createDeal = (data: {
  title: string; city?: string; valid_until?: string; notes?: string
  items: { name: string; category?: string; quantity: number; unit: string; price_per_unit: number; min_order_qty?: number }[]
}) => vendorApi.post('/deals', data)

export const getMyDeals = () => vendorApi.get('/deals')

export const updateDealStatus = (id: string, status: string) =>
  vendorApi.patch(`/deals/${id}`, { status })

// ── Notifications ─────────────────────────────────────────────────────────────
export const getVendorNotifications = () => vendorApi.get('/notifications')
export const markVendorNotificationsRead = () => vendorApi.put('/notifications/read')

export default vendorApi
