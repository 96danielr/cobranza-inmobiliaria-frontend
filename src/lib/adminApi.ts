import { apiAdmin } from './api'

// Admin API methods
export const adminApi = {
  // Clients
  getClients: (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return apiAdmin.get(`/clients?${params.toString()}`)
  },

  getClient: (id: string) =>
    apiAdmin.get(`/clients/${id}`),

  // Dashboard
  getDashboardSummary: () =>
    apiAdmin.get('/dashboard/summary'),

  getRankingMorosos: () =>
    apiAdmin.get('/dashboard/ranking-morosos'),

  getRecaudoMensual: () =>
    apiAdmin.get('/dashboard/recaudo-mensual'),

  getComportamiento: () =>
    apiAdmin.get('/dashboard/comportamiento'),

  // Portfolio (use dashboard summary for now)
  getPortfolio: () =>
    apiAdmin.get('/dashboard/summary'),

  // Payments
  getPayments: (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return apiAdmin.get(`/payments/all?${params.toString()}`)
  },

  getPendingPayments: (page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })
    return apiAdmin.get(`/payments/pending?${params.toString()}`)
  },

  approvePayment: (id: string) =>
    apiAdmin.put(`/payments/${id}/approve`),

  rejectPayment: (id: string, observacion: string) =>
    apiAdmin.put(`/payments/${id}/reject`, { observacion }),

  // Contracts
  getContracts: (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return apiAdmin.get(`/contracts?${params.toString()}`)
  },

  // Lots
  getLots: (page: number = 1, limit: number = 10, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })
    return apiAdmin.get(`/lots?${params.toString()}`)
  },

  createLot: (data: any) =>
    apiAdmin.post('/lots', data),

  updateLot: (id: string, data: any) =>
    apiAdmin.put(`/lots/${id}`, data),

  deleteLot: (id: string) =>
    apiAdmin.delete(`/lots/${id}`),

  // Excel Import
  uploadExcel: (formData: FormData) =>
    apiAdmin.post('/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    }),

  // Excel Export
  exportExcel: () =>
    apiAdmin.get('/import/export', {
      responseType: 'blob',
    }),
}