import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Client } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  token: string | null
  client: Client | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (cedula: string, pin: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      client: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (cedula: string, pin: string) => {
        set({ isLoading: true })
        
        try {
          const response = await api.post('/auth/client/login', {
            cedula: cedula.replace(/\D/g, ''),
            pin
          })

          if (response.data.success) {
            const { token, user } = response.data
            
            set({
              token,
              client: user,
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
          client: null,
          isAuthenticated: false,
          isLoading: false
        })
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'auth-storage',
      // Only persist certain fields
      partialize: (state) => ({
        token: state.token,
        client: state.client,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)