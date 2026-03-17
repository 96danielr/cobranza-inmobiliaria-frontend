import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Admin {
  id: string
  email: string
  fullName: string
  role: 'ADMIN' | 'COBROS'
  tenantId: string
}

interface AdminAuthState {
  token: string | null
  admin: Admin | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // We'll import this dynamically to avoid circular dependency
          const { apiAdmin } = await import('@/lib/api')
          
          const response = await apiAdmin.post('/auth/admin/login', {
            email,
            password
          })

          if (response.data.success) {
            const { accessToken: token, user: admin } = response.data.data
            
            set({
              token,
              admin,
              isAuthenticated: true,
              isLoading: false
            })

            return { success: true }
          } else {
            set({ isLoading: false })
            return { 
              success: false, 
              message: response.data.message || 'Error de autenticación' 
            }
          }
        } catch (error: any) {
          set({ isLoading: false })
          
          const errorMessage = error.response?.data?.message || 
            error.response?.data?.error || 
            'Error de conexión. Intente nuevamente.'
          
          return { success: false, message: errorMessage }
        }
      },

      logout: () => {
        set({
          token: null,
          admin: null,
          isAuthenticated: false,
          isLoading: false
        })
        
        // Redirect to admin login
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login'
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'admin-auth-storage',
      // Only persist certain fields
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)