import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  role: 'superadmin' | 'tenant_admin' | 'company_admin' | 'agent'
  tenantId: string
  tenantName: string
}

interface AdminAuthState {
  token: string | null
  admin: AdminUser | null
  isAuthenticated: boolean
  isLoading: boolean
  // Multi-tenant selection
  pendingAccountId: string | null
  pendingMemberships: TenantMembership[]
  requiresTenantSelection: boolean
  // Selected company
  selectedCompanyId: string | null
  companies: CompanyAccess[]
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; requiresTenantSelection?: boolean }>
  selectTenant: (accountId: string, tenantId: string) => Promise<{ success: boolean; message?: string }>
  setSelectedCompany: (companyId: string) => void
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
      pendingAccountId: null,
      pendingMemberships: [],
      requiresTenantSelection: false,
      selectedCompanyId: null,
      companies: [],

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

            // Get companies from JWT (decoded client-side is unnecessary; use /auth/me)
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

      setSelectedCompany: (companyId: string) => {
        set({ selectedCompanyId: companyId })
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
          companies: [],
        })
        
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login'
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        token: state.token,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
        selectedCompanyId: state.selectedCompanyId,
        companies: state.companies,
      }),
    }
  )
)