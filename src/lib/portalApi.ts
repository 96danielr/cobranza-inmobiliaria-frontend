import { apiAdmin } from './api'

export const portalApi = {
  getSummary: () => apiAdmin.get('/portal/summary'),
  getLots: () => apiAdmin.get('/portal/lots'),
  getPayments: () => apiAdmin.get('/portal/payments'),
}
