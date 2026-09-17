import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PropertyType } from '../lib/propertyTypes'

export interface CompanyAccess {
  id: string
  role: string
}

export interface TenantMembership {
  userId: string
  tenantId: string
  tenantName: string
  role: string
  plan: string
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'superadmin' | 'tenant_admin' | 'company_admin' | 'agent' | 'vendedor' | 'cliente' | 'administrador' | 'gerente' | 'jefe_cartera' | 'auxiliar_cartera' | 'contador' | 'auxiliar_contable' | 'ejecutivo_comercial'
  tenantId: string
  tenantName: string
  plan: 'basic' | 'premium' | 'enterprise'
  activeModules: string[]
  clientId?: string
  cedula?: string
  profileImage?: string
  subscriptionStart?: string
  subscriptionEnd?: string
}

interface AdminAuthState {
  token: string | null
  admin: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean
  // Multi-tenant selection
  pendingAccountId: string | null
  pendingMemberships: TenantMembership[]
  requiresTenantSelection: boolean
  // Selected company
  selectedCompanyId: string | null
  selectedCompanyName: string | null
  selectedCompanyPropertyType: PropertyType
  companies: CompanyAccess[]
  // Actions
  setHasHydrated: (state: boolean) => void
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresTenantSelection?: boolean; requiresOtp?: boolean; otpData?: any }>
  verifyOtp: (otpData: any, otpCode: string) => Promise<{ success: boolean; message?: string }>
  selectTenant: (accountId: string, tenantId: string) => Promise<{ success: boolean; message?: string }>
  setSelectedCompany: (companyId: string, companyName: string, propertyType?: PropertyType) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateAdmin: (data: Partial<AdminUser>) => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      pendingAccountId: null,
      pendingMemberships: [],
      requiresTenantSelection: false,
      selectedCompanyId: null,
      selectedCompanyName: null,
      selectedCompanyPropertyType: 'lotes',
      companies: [],

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          const { apiAdmin } = await import('@/lib/api')
          
          const response = await apiAdmin.post('/auth/admin/login', {
            email,
            password,
          })

          if (response.data.success) {
            const { data } = response.data

            if (data.requiresOtp) {
              set({ isLoading: false })
              return { success: true, requiresOtp: true, otpData: data }
            }

            if (data.requiresTenantSelection) {
              // Multiple tenants — need selection
              set({
                isLoading: false,
                pendingAccountId: data.accountId,
                pendingMemberships: data.memberships,
                requiresTenantSelection: true,
              })
              return { success: true, requiresTenantSelection: true }
            }

            // Single tenant — direct login
            const { accessToken: token, user } = data

            set({
              token,
              admin: user,
              isAuthenticated: true,
              isLoading: false,
              requiresTenantSelection: false,
              pendingAccountId: null,
              pendingMemberships: [],
            })

            return { success: true }
          } else {
            set({ isLoading: false })
            return { 
              success: false, 
              message: response.data.message || 'Error de autenticación',
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

      verifyOtp: async (otpData: any, otpCode: string) => {
        set({ isLoading: true })

        try {
          const { apiAdmin } = await import('@/lib/api')

          const response = await apiAdmin.post('/auth/verify-client-otp', {
            accountId: otpData.accountId,
            userId: otpData.userId,
            tenantId: otpData.tenantId,
            clientId: otpData.clientId,
            otpToken: otpData.otpToken,
            otpCode,
          })

          if (response.data.success) {
            const { accessToken: token, user } = response.data.data

            set({
              token,
              admin: user,
              isAuthenticated: true,
              isLoading: false,
            })

            return { success: true }
          } else {
            set({ isLoading: false })
            return {
              success: false,
              message: response.data.message || 'Código OTP incorrecto',
            }
          }
        } catch (error: any) {
          set({ isLoading: false })
          const errorMessage = error.response?.data?.message || 'Error al verificar OTP'
          return { success: false, message: errorMessage }
        }
      },

      selectTenant: async (accountId: string, tenantId: string) => {
        set({ isLoading: true })

        try {
          const { apiAdmin } = await import('@/lib/api')

          const response = await apiAdmin.post('/auth/select-tenant', {
            accountId,
            tenantId,
          })

          if (response.data.success) {
            const { accessToken: token, user } = response.data.data

            set({
              token,
              admin: user,
              isAuthenticated: true,
              isLoading: false,
              requiresTenantSelection: false,
              pendingAccountId: null,
              pendingMemberships: [],
            })

            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, message: response.data.message }
          }
        } catch (error: any) {
          set({ isLoading: false })
          return { 
            success: false, 
            message: error.response?.data?.message || 'Error selecting tenant',
          }
        }
      },

      setSelectedCompany: (companyId: string, companyName: string, propertyType: PropertyType = 'lotes') => {
        set({ 
          selectedCompanyId: companyId, 
          selectedCompanyName: companyName,
          selectedCompanyPropertyType: propertyType || 'lotes'
        })
      },

      logout: () => {
        set({
          token: null,
          admin: null,
          isAuthenticated: false,
          isLoading: false,
          pendingAccountId: null,
          pendingMemberships: [],
          requiresTenantSelection: false,
          selectedCompanyId: null,
          selectedCompanyName: null,
          selectedCompanyPropertyType: 'lotes',
          companies: [],
        })
        
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login'
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
      updateAdmin: (data: Partial<AdminUser>) => {
        const currentAdmin = get().admin
        if (currentAdmin) {
          set({ admin: { ...currentAdmin, ...data } })
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
        selectedCompanyId: state.selectedCompanyId,
        selectedCompanyName: state.selectedCompanyName,
        selectedCompanyPropertyType: state.selectedCompanyPropertyType,
        companies: state.companies,
      }),
      onRehydrateStorage: () => (state) => {

        state?.setHasHydrated(true)
      },
    }
  )
)