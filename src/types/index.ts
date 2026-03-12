export interface Client {
  id: string
  fullName: string
  cedula: string
  phone: string
}

export interface AuthToken {
  token: string
  client: Client
}

export interface Contract {
  id: string
  lote: {
    manzana: string
    nomenclatura: string
    areaTotalM2: number
    proyecto: string
  }
  valorTotal: number
  valorCuota: number
  diaPago: number
  totalCuotas: number
  cuotasPagadas: number
  cuotasPendientes: number
  totalPagado: number
  totalPendiente: number
  porcentajePagado: number
  proximoVencimiento: string | null
  diasMora: number
  status: string
}

export interface Notification {
  type: 'VENCIMIENTO' | 'MORA' | 'PAGO_PENDIENTE' | 'PAGO_RECHAZADO'
  message: string
  date: string
}

export interface PortalHomeData {
  client: Client
  contracts: Contract[]
  notifications: Notification[]
}

export interface Cuota {
  numero: number
  fechaVencimiento: string
  monto: number
  status: 'PAGADA' | 'PENDIENTE' | 'VENCIDA'
  fechaPago?: string
  observaciones?: string
}

export interface ContractDetail {
  id: string
  lote: {
    manzana: string
    nomenclatura: string
    areaTotalM2: number
    valorTotalLote: number
    proyecto: string
    ubicacion: string
  }
  valorTotal: number
  valorCuota: number
  diaPago: number
  totalCuotas: number
  fechaContrato: string
  fechaInicioCuotas: string
  cuotasPagadas: number
  totalPagado: number
  porcentajePagado: number
  status: string
  planPagos: Cuota[]
}

export interface Payment {
  id: string
  cuotaNumber: number
  amount: number
  banco: string
  fechaPago: string
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  observacion?: string
  createdAt: string
  contract: {
    lot: {
      manzana: string
      nomenclatura: string
      project: {
        name: string
      }
    }
  }
}

export interface PaymentHistory {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginRequest {
  cedula: string
  pin: string
}

export interface ChangePinRequest {
  currentPin: string
  newPin: string
}

export interface ReportPaymentRequest {
  contractId: string
  cuotaNumber: number
  amount: number
  banco: string
  fechaPago: string
}