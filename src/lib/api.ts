import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Client API instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Admin API instance
export const apiAdmin = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Client API interceptors
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState()
      logout()
    }
    return Promise.reject(error)
  }
)

// Admin API interceptors
apiAdmin.interceptors.request.use(
  (config) => {
    // Dynamic import to avoid circular dependency
    if (typeof window !== 'undefined') {
      const adminAuthData = localStorage.getItem('admin-auth-storage')
      console.log('Admin auth data from localStorage:', adminAuthData)
      if (adminAuthData) {
        try {
          const parsed = JSON.parse(adminAuthData)
          console.log('Parsed admin auth data:', parsed)
          // Try different possible structures
          const token = parsed.state?.token || parsed.token
          console.log('Extracted token:', token ? token.substring(0, 20) + '...' : 'None')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('Authorization header set for URL:', config.url)
          } else {
            console.warn('No token found in admin auth data')
          }
        } catch (e) {
          console.error('Error parsing admin auth data:', e)
        }
      } else {
        console.warn('No admin auth data in localStorage')
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiAdmin.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dynamic import to avoid circular dependency
      import('@/stores/adminAuthStore').then(({ useAdminAuthStore }) => {
        const { logout } = useAdminAuthStore.getState()
        logout()
      })
    }
    return Promise.reject(error)
  }
)

// API methods
export const apiClient = {
  // Auth
  login: (cedula: string, pin: string) => 
    api.post('/auth/client/login', { cedula, pin }),
    
  changePin: (currentPin: string, newPin: string) => 
    api.post('/auth/client/change-pin', { currentPin, newPin }),

  // Portal endpoints
  getHome: () => 
    api.get('/portal/home'),
    
  getContract: (id: string) => 
    api.get(`/portal/contract/${id}`),
    
  getPayments: (page: number = 1, limit: number = 10) => 
    api.get(`/portal/payments?page=${page}&limit=${limit}`),
    
  reportPayment: (formData: FormData) => 
    api.post('/portal/report-payment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }),
    
  downloadReceipt: (paymentId: string) => 
    api.get(`/portal/receipt/${paymentId}`, {
      responseType: 'blob'
    }),
}

// Public API (No auth required)
export const apiPublic = {
  getClientInfo: (companySlug: string, idNumber: string) => 
    api.get(`/public/${companySlug}/client/${idNumber}`),
    
  reportPayment: (formData: FormData) => 
    api.post('/public/report-payment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }),
}