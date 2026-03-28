import axios from 'axios'

// Always use a relative path — Next.js rewrites /api/* → Express backend.
// This works on laptop (localhost:3000) and mobile (192.168.x.x:3000) identically.
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach auth header before every request
api.interceptors.request.use((config) => {
  const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  if (isDev) {
    config.headers['x-dev-uid'] = process.env.NEXT_PUBLIC_DEV_UID || 'dev-user-1'
  } else {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fb_token') : null
    if (token) config.headers['Authorization'] = `Bearer ${token}`
  }

  return config
})

// ─── Auth ────────────────────────────────────────────────────────────────────
export const registerShop = (data: Record<string, unknown>) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')

// ─── Products ────────────────────────────────────────────────────────────────
export const getProducts = (params?: Record<string, unknown>) => api.get('/products', { params })
export const getProductByBarcode = (ean: string) => api.get(`/products/barcode/${ean}`)
export const barcodeLookup = (ean: string) => api.get(`/products/barcode-lookup/${ean}`)
export const createProduct = (data: Record<string, unknown>) => api.post('/products', data)
export const updateProduct = (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data)
export const deleteProduct = (id: string) => api.delete(`/products/${id}`)
export const adjustStock = (id: string, data: { delta: number; reason: string }) =>
  api.post(`/products/${id}/stock`, data)

// ─── Billing ─────────────────────────────────────────────────────────────────
export const createBill = (data: Record<string, unknown>) => api.post('/bills', data)
export const getBills = (params?: Record<string, unknown>) => api.get('/bills', { params })
export const getBill = (id: string) => api.get(`/bills/${id}`)
export const getDailySummary = () => api.get('/bills/summary/daily')

export default api
