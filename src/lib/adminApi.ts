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

  updateClient: (id: string, data: any) =>
    apiAdmin.put(`/clients/${id}?companyId=${getCompanyId()}`, data),

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

  exportSiigoPayments: (startDate?: string, endDate?: string, config: { comprobanteTipo?: string, cuentaCartera?: string, centroCostos?: string, defaultCuentaBanco?: string } = {}) => {
    const params = new URLSearchParams({
      companyId: getCompanyId(),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(config.comprobanteTipo && { comprobanteTipo: config.comprobanteTipo }),
      ...(config.cuentaCartera && { cuentaCartera: config.cuentaCartera }),
      ...(config.centroCostos && { centroCostos: config.centroCostos }),
      ...(config.defaultCuentaBanco && { defaultCuentaBanco: config.defaultCuentaBanco }),
    })
    return apiAdmin.get(`/payments/siigo-export?${params.toString()}`, {
      responseType: 'blob'
    })
  },

  getPendingPayments: (page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
    })
    return apiAdmin.get(`/payments/pending?${params.toString()}`)
  },

  approvePayment: (id: string, observacion?: string) =>
    apiAdmin.put(`/payments/${id}/approve?companyId=${getCompanyId()}`, { observacion }),

  rejectPayment: (id: string, observacion: string) =>
    apiAdmin.put(`/payments/${id}/reject?companyId=${getCompanyId()}`, { observacion }),

  editPayment: (id: string, data: { amount: number; bank?: string; paymentMethod?: string; paymentDate?: string; observations?: string; reason?: string }) =>
    apiAdmin.put(`/payments/${id}/edit?companyId=${getCompanyId()}`, data),

  resendReceipt: (id: string) =>
    apiAdmin.post(`/payments/${id}/resend-receipt?companyId=${getCompanyId()}`),

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
  getLots: (
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    order?: string,
    status?: string,
    manzana?: string,
    stage?: string,
    sellerId?: string,
    minArea?: string,
    maxArea?: string,
    showDeleted?: boolean | string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(order && { order }),
      ...(status && { status }),
      ...(manzana && { manzana }),
      ...(stage && { stage }),
      ...(sellerId && { sellerId }),
      ...(minArea && { minArea }),
      ...(maxArea && { maxArea }),
      ...(showDeleted !== undefined && { showDeleted: showDeleted.toString() }),
    })
    return apiAdmin.get(`/lots?${params.toString()}`)
  },

  createLot: (data: any) =>
    apiAdmin.post('/lots', { ...data, companyId: getCompanyId() }),

  updateLot: (id: string, data: any) =>
    apiAdmin.put(`/lots/${id}`, data),

  deleteLot: (id: string, reason?: string) =>
    apiAdmin.delete(`/lots/${id}`, { data: { reason } }),

  restoreLot: (id: string) =>
    apiAdmin.post(`/lots/${id}/restore`),

  uploadLotImages: (id: string, formData: FormData) =>
    apiAdmin.post(`/lots/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  sellLot: (id: string, data: any) =>
    apiAdmin.post(`/lots/${id}/sell?companyId=${getCompanyId()}`, data),

  getLotSaleDetail: (id: string) =>
    apiAdmin.get(`/lots/${id}/sale-detail?companyId=${getCompanyId()}`),

  assignLotSeller: (id: string, sellerId: string) =>
    apiAdmin.post(`/lots/${id}/assign-seller?companyId=${getCompanyId()}`, { sellerId }),

  getLot: (id: string) =>
    apiAdmin.get(`/lots/${id}`),

  reserveLot: (id: string, data: any) =>
    apiAdmin.post(`/lots/${id}/reserve?companyId=${getCompanyId()}`, data),

  releaseLot: (id: string, data: any) =>
    apiAdmin.post(`/lots/${id}/release?companyId=${getCompanyId()}`, data),

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

  // Lot-only Excel Import (company-scoped)
  uploadLotsExcel: (formData: FormData) => {
    const companyId = getCompanyId()
    formData.append('companyId', companyId)
    return apiAdmin.post(`/import/excel-lots?companyId=${companyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 240000,
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

  // Lot-only Excel Template
  downloadLotsTemplate: () =>
    apiAdmin.get('/import/template-lots', {
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
    
  updateProfile: (data: any) =>
    apiAdmin.put('/admin-users/profile', data),

  changeMyPassword: (password: string) =>
    apiAdmin.put('/admin-users/change-my-password', { password }),
    
  uploadProfileImage: (formData: FormData) =>
    apiAdmin.put('/admin-users/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getSellers: () =>
    apiAdmin.get(`/admin-users/sellers?companyId=${getCompanyId()}`),

  getSystemLogs: (page: number = 1, limit: number = 50, search?: string, action?: string, module?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(action && { action }),
      ...(module && { module }),
    })
    return apiAdmin.get(`/admin-users/logs?${params.toString()}`)
  },

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

  // Tenants
  getAllTenants: () =>
    apiAdmin.get('/tenants/all'),

  createTenantWithAdmin: (data: any) =>
    apiAdmin.post('/tenants/create-with-admin', data),

  updateTenant: (id: string, data: any) =>
    apiAdmin.put(`/tenants/${id}`, data),

  getMyTenant: () =>
    apiAdmin.get('/tenants/me'),

  updateMyTenant: (data: any) =>
    apiAdmin.put('/tenants/me', data),

  // Banks (global list, superadmin only for writes)
  getBanks: (page: number = 1, limit: number = 100, search?: string, sortBy?: string, sortOrder?: string, adminView: boolean = true) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      adminView: adminView ? 'true' : 'false',
      ...(search && { search }),
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder }),
    })
    return apiAdmin.get(`/banks?${params.toString()}`)
  },

  createBank: (data: any) =>
    apiAdmin.post(`/banks?companyId=${getCompanyId()}`, data),

  updateBank: (id: string, data: any) =>
    apiAdmin.put(`/banks/${id}?companyId=${getCompanyId()}`, data),

  deleteBank: (id: string) =>
    apiAdmin.delete(`/banks/${id}?companyId=${getCompanyId()}`),

  toggleAllBanks: (action: 'enable' | 'disable') =>
    apiAdmin.put(`/banks/toggle-all?companyId=${getCompanyId()}`, { action }),

  bulkCreateBanks: (banks: any[]) =>
    apiAdmin.post(`/banks/bulk?companyId=${getCompanyId()}`, { banks }),

  uploadBanksExcel: (formData: FormData) =>
    apiAdmin.post(`/banks/import?companyId=${getCompanyId()}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Limits & Quotas
  getLimits: (params?: any) => {
    const searchParams = new URLSearchParams(params)
    return apiAdmin.get(`/limits?${searchParams.toString()}`)
  },

  setLimit: (data: any) =>
    apiAdmin.post('/limits', data),

  getUsageStats: (params?: any) => {
    const searchParams = new URLSearchParams(params)
    return apiAdmin.get(`/limits/usage?${searchParams.toString()}`)
  },
  
  // WhatsApp
  getWhatsAppConfig: () =>
    apiAdmin.get('/whatsapp/config'),
  connectWhatsApp: (data: { code: string; wabaId?: string; phoneNumberId?: string }) =>
    apiAdmin.post('/whatsapp/connect', data),
  disconnectWhatsApp: () =>
    apiAdmin.post('/whatsapp/disconnect', {}),
  getWhatsAppConversations: () =>
    apiAdmin.get('/whatsapp/conversations'),
  getWhatsAppTemplates: () =>
    apiAdmin.get('/whatsapp/templates'),
  createWhatsAppTemplate: (data: any) =>
    apiAdmin.post('/whatsapp/templates', data),
  deleteWhatsAppTemplate: (name: string) =>
    apiAdmin.delete(`/whatsapp/templates/${name}`),
    
  getWhatsAppHistory: (clientId: string) =>
    apiAdmin.get(`/whatsapp/history/${clientId}`),
    
  sendWhatsAppMessage: (data: { clientId?: string, phone?: string, text?: string, templateName?: string, components?: any[] }) =>
    apiAdmin.post('/whatsapp/send', data),

  // Reports
  getSalesReport: (period?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({
      companyId: getCompanyId(),
      ...(period && { period }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    })
    return apiAdmin.get(`/reports/sales?${params.toString()}`)
  },

  getCashFlowProjection: (months: number = 6) =>
    apiAdmin.get(`/reports/projection?companyId=${getCompanyId()}&months=${months}`),

  getAdvancedReports: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({
      companyId: getCompanyId(),
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    })
    return apiAdmin.get(`/reports/advanced?${params.toString()}`)
  },

  getAdvisorReport: (from?: string, to?: string) => {
    const params = new URLSearchParams({
      companyId: getCompanyId(),
      ...(from && { from }),
      ...(to && { to })
    })
    return apiAdmin.get(`/reports/advisors?${params.toString()}`)
  },

  getLotsReport: () =>
    apiAdmin.get(`/reports/lots?companyId=${getCompanyId()}`),

  // Audit
  getAuditLogs: (params: any) =>
    apiAdmin.get('/audit', { params: { ...params, companyId: getCompanyId() } }),
  getAuditMetadata: () =>
    apiAdmin.get(`/audit/metadata?companyId=${getCompanyId()}`),

  // Bonuses (CRUD)
  getBonuses: () =>
    apiAdmin.get(`/bonuses?companyId=${getCompanyId()}`),

  createBonus: (data: any) =>
    apiAdmin.post(`/bonuses?companyId=${getCompanyId()}`, data),

  updateBonus: (id: string, data: any) =>
    apiAdmin.put(`/bonuses/${id}?companyId=${getCompanyId()}`, data),

  deleteBonus: (id: string) =>
    apiAdmin.delete(`/bonuses/${id}?companyId=${getCompanyId()}`),

  // Commission Plans (CRUD)
  getCommissionPlans: (activeOnly: boolean = false) =>
    apiAdmin.get(`/commission-plans?companyId=${getCompanyId()}${activeOnly ? '&activeOnly=true' : ''}`),

  createCommissionPlan: (data: any) =>
    apiAdmin.post(`/commission-plans?companyId=${getCompanyId()}`, data),

  updateCommissionPlan: (id: string, data: any) =>
    apiAdmin.put(`/commission-plans/${id}?companyId=${getCompanyId()}`, data),

  deleteCommissionPlan: (id: string) =>
    apiAdmin.delete(`/commission-plans/${id}?companyId=${getCompanyId()}`),

  getCommissions: (status?: string, contractId?: string) => {
    const params = new URLSearchParams({
      companyId: getCompanyId(),
      ...(status && { status }),
      ...(contractId && { contractId })
    })
    return apiAdmin.get(`/commissions?${params.toString()}`)
  },

  radicarComision: (id: string, installmentIndex: number, documents?: { invoiceUrl?: string; socialSecurityUrl?: string; rutUrl?: string; bankCertUrl?: string }) =>
    apiAdmin.post(`/commissions/${id}/radicar?companyId=${getCompanyId()}`, { installmentIndex, ...(documents || {}) }),

  uploadCommissionSupport: (file: File, type: 'invoice' | 'social_security' | 'rut' | 'bank_cert') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return apiAdmin.post(`/commissions/upload-support?companyId=${getCompanyId()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  aprobarComision: (id: string, installmentIndex: number, observacion?: string) =>
    apiAdmin.post(`/commissions/${id}/aprobar?companyId=${getCompanyId()}`, { installmentIndex, observacion }),

  rechazarComision: (id: string, installmentIndex: number, rejectedReason: string) =>
    apiAdmin.post(`/commissions/${id}/rechazar?companyId=${getCompanyId()}`, { installmentIndex, rejectedReason }),

  pagarComision: (id: string, installmentIndex: number) =>
    apiAdmin.post(`/commissions/${id}/pagar?companyId=${getCompanyId()}`, { installmentIndex }),

  resendPaymentPlan: (contractId: string) =>
    apiAdmin.post(`/clients/resend-plan/${contractId}?companyId=${getCompanyId()}`),
  
  resendWelcomeDetails: (clientId: string) =>
    apiAdmin.post(`/clients/resend-welcome/${clientId}?companyId=${getCompanyId()}`),

  // Payment Schedule Restructuring
  simulatePaymentSchedule: (data: { contractId: string; changes: any[]; strategy: string }) =>
    apiAdmin.post(`/payment-schedule/simulate?companyId=${getCompanyId()}`, data),

  applyPaymentSchedule: (data: { contractId: string; updatedQuotas: any[]; reason?: string }) =>
    apiAdmin.post(`/payment-schedule/apply?companyId=${getCompanyId()}`, data),

  generateContractSchedule: (data: {
    contractId: string;
    totalValue: number;
    installmentsCount: number;
    installmentValue: number;
    startDate?: string;
    paymentDay?: number;
    balloonInterval?: number;
    balloonValue?: number;
    initialQuotasCount?: number;
    initialQuotaValue?: number;
    preserveExistingPayments?: boolean;
    reason?: string;
  }) =>
    apiAdmin.post(`/payment-schedule/generate?companyId=${getCompanyId()}`, data),

  // AI Call Logs
  getCallLogs: (clientId: string, page: number = 1, limit: number = 10) =>
    apiAdmin.get(`/ai/call-logs/client/${clientId}?page=${page}&limit=${limit}`),

  // Knowledge Base (FAQ)
  getKnowledge: (page: number = 1, limit: number = 20, search?: string, categoria?: string, activo?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(search && { search }),
      ...(categoria && categoria !== 'ALL' && { categoria }),
      ...(activo && activo !== 'ALL' && { activo }),
    })
    return apiAdmin.get(`/knowledge?${params.toString()}`)
  },

  createKnowledge: (data: any) =>
    apiAdmin.post(`/knowledge?companyId=${getCompanyId()}`, data),

  updateKnowledge: (id: string, data: any) =>
    apiAdmin.put(`/knowledge/${id}?companyId=${getCompanyId()}`, data),

  deleteKnowledge: (id: string) =>
    apiAdmin.delete(`/knowledge/${id}?companyId=${getCompanyId()}`),

  // Escalations (asesor call queue)
  getEscalations: (page: number = 1, limit: number = 20, estado?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      companyId: getCompanyId(),
      ...(estado && estado !== 'ALL' && { estado }),
    })
    return apiAdmin.get(`/escalations?${params.toString()}`)
  },

  updateEscalationStatus: (id: string, estado: string) =>
    apiAdmin.patch(`/escalations/${id}/estado?companyId=${getCompanyId()}`, { estado }),
}