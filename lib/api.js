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
export const registerShop = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')

// ─── Products ────────────────────────────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params })
export const getProductByBarcode = (ean) => api.get(`/products/barcode/${ean}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const adjustStock = (id, data) => api.post(`/products/${id}/stock`, data)

// ─── Billing ─────────────────────────────────────────────────────────────────
export const createBill = (data) => api.post('/bills', data)
export const getBills = (params) => api.get('/bills', { params })
export const getBill = (id) => api.get(`/bills/${id}`)
export const getDailySummary = () => api.get('/bills/summary/daily')

export default api
