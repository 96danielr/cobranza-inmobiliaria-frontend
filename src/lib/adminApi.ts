import { apiAdmin } from './api'
import { useAdminAuthStore } from '@/stores/adminAuthStore'

// Helper to get the selected companyId from the store
const getCompanyId = (): string => {
  return useAdminAuthStore.getState().selectedCompanyId || ''
}

// Admin API methods
export const adminApi = {
  // Clients (company-scoped)
  getClients: (page: number = 1, limit: number = 10, search?: string, sortBy?: string, order?: string, behavior?: string, moraOnly?: boolean, alDiaOnly?: boolean) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
      ...(behavior && behavior !== 'ALL' && { behavior }),
      ...(moraOnly && { moraOnly: 'true' }),
      ...(alDiaOnly && { alDiaOnly: 'true' }),
    })
    return apiAdmin.get(`/clients?${params.toString()}`)
  },

  getClient: (id: string) =>
    apiAdmin.get(`/clients/${id}?companyId=${getCompanyId()}`),

  createClient: (data: any) =>
    apiAdmin.post(`/clients?companyId=${getCompanyId()}`, data),

  deleteClient: (id: string) =>
    apiAdmin.delete(`/clients/${id}?companyId=${getCompanyId()}`),

  // Dashboard (company-scoped)
  getDashboardSummary: () =>
    apiAdmin.get(`/dashboard/summary?companyId=${getCompanyId()}`),

  getRankingMorosos: () =>
    apiAdmin.get('/dashboard/ranking-morosos'),

  getRecaudoMensual: () =>
    apiAdmin.get('/dashboard/recaudo-mensual'),

  getComportamiento: () =>
    apiAdmin.get('/dashboard/comportamiento'),

  // Portfolio (use dashboard summary for now)
  getPortfolio: () =>
    apiAdmin.get(`/dashboard/summary?companyId=${getCompanyId()}`),

  // Payments (company-scoped)
  getPayments: (page: number = 1, limit: number = 10, search?: string, status?: string, sortBy?: string, order?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(status && status !== 'ALL' && { status }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    })
    return apiAdmin.get(`/payments/all?${params.toString()}`)
  },

  getPendingPayments: (page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
    })
    return apiAdmin.get(`/payments/pending?${params.toString()}`)
  },

  approvePayment: (id: string) =>
    apiAdmin.put(`/payments/${id}/approve?companyId=${getCompanyId()}`),

  rejectPayment: (id: string, observacion: string) =>
    apiAdmin.put(`/payments/${id}/reject?companyId=${getCompanyId()}`, { observacion }),

  registerManualPayment: (formData: FormData) =>
    apiAdmin.post(`/payments/manual?companyId=${getCompanyId()}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Contracts (company-scoped)
  getContracts: (page: number = 1, limit: number = 10, search?: string, sortBy?: string, order?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    })
    return apiAdmin.get(`/contracts?${params.toString()}`)
  },

  // Lots (company-scoped)
  getLots: (page: number = 1, limit: number = 10, search?: string, sortBy?: string, order?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    })
    return apiAdmin.get(`/lots?${params.toString()}`)
  },

  createLot: (data: any) =>
    apiAdmin.post('/lots', { ...data, companyId: getCompanyId() }),

  updateLot: (id: string, data: any) =>
    apiAdmin.put(`/lots/${id}`, data),

  deleteLot: (id: string) =>
    apiAdmin.delete(`/lots/${id}`),

  uploadLotImages: (id: string, formData: FormData) =>
    apiAdmin.post(`/lots/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  sellLot: (id: string, data: any) =>
    apiAdmin.post(`/lots/${id}/sell?companyId=${getCompanyId()}`, data),

  getLotsPublic: (companyId: string, search?: string) => {
    const params = new URLSearchParams({
      ...(search && { search }),
    })
    return apiAdmin.get(`/lots/catalog/${companyId}?${params.toString()}`)
  },

  // Excel Import (company-scoped)
  uploadExcel: (formData: FormData) => {
    const companyId = getCompanyId()
    formData.append('companyId', companyId)
    return apiAdmin.post(`/import/excel?companyId=${companyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 240000, // 2 minutes for heavy imports
    })
  },

  // Excel Export (company-scoped)
  exportExcel: () =>
    apiAdmin.get(`/import/export?companyId=${getCompanyId()}`, {
      responseType: 'blob',
    }),
    
  // Excel Template
  downloadTemplate: () =>
    apiAdmin.get('/import/template', {
      responseType: 'blob',
    }),

  // User Management (tenant_admin only)
  getAdminUsers: (page: number = 1, limit: number = 10, search?: string, sortBy?: string, order?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
    })
    return apiAdmin.get(`/admin-users/all?${params.toString()}`)
  },

  createAdminUser: (data: any) =>
    apiAdmin.post('/admin-users/create', { ...data, companyId: getCompanyId() }),

  updateAdminUser: (id: string, data: any) =>
    apiAdmin.put(`/admin-users/update/${id}`, { ...data, companyId: getCompanyId() }),

  changeAdminPassword: (id: string, password: string) =>
    apiAdmin.put(`/admin-users/change-password/${id}`, { password, companyId: getCompanyId() }),

  deleteAdminUser: (id: string) =>
    apiAdmin.delete(`/admin-users/delete/${id}?companyId=${getCompanyId()}`),

  // Companies (tenant-scoped)
  getCompanies: () =>
    apiAdmin.get('/companies'),

  createCompany: (data: any) =>
    apiAdmin.post('/companies', data),

  updateCompany: (id: string, data: any) =>
    apiAdmin.put(`/companies/${id}`, data),

  deleteCompany: (id: string) =>
    apiAdmin.delete(`/companies/${id}`),

  getCompanyPublic: (id: string) =>
    apiAdmin.get(`/companies/public/${id}`),

  getCompany: (id: string) =>
    apiAdmin.get(`/companies/${id}?companyId=${id}`), // Scoped anyway by tenant

  // Tenants (superadmin only)
  getAllTenants: () =>
    apiAdmin.get('/tenants/all'),

  createTenantWithAdmin: (data: any) =>
    apiAdmin.post('/tenants/create-with-admin', data),

  updateTenant: (id: string, data: any) =>
    apiAdmin.put(`/tenants/${id}`, data),
}