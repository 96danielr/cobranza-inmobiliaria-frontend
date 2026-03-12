// Dashboard Types
export interface DashboardSummary {
  cartera: {
    valorTotalCartera: number
    totalRecaudado: number
    totalPendiente: number
    porcentajeRecaudo: number
  }
  mora: {
    totalContratosActivos: number
    contratosAlDia: number
    contratosMora1a15: number
    contratosMora16a30: number
    contratosMora31a60: number
    contratosMora60plus: number
    porcentajeMora: number
    dineroEnMora: number
  }
  recaudoMensual: {
    mesActual: number
    mesAnterior: number
    variacion: number
  }
  operacion: {
    comprobantesPendientes: number
    clientesEscalados: number
    whatsappEnviadosMes: number
    llamadasAIMes: number
  }
}

export interface RecaudoMensual {
  mes: string
  recaudado: number
  meta: number
}

export interface ComportamientoClientes {
  dispuestos: number
  indecisos: number
  evasivos: number
}

export interface MorososRanking {
  clientId: string
  clientName: string
  cedula: string
  phone: string
  lote: string
  valorCuota: number
  cuotasPendientes: number
  diasMora: number
  montoVencido: number
  behaviorTag: 'DISPUESTO' | 'INDECISO' | 'EVASIVO'
  ultimoContacto?: string
  ultimoContactoTipo?: 'WHATSAPP' | 'AI_CALL' | 'MANUAL'
}

// Payment Types
export interface PendingPayment {
  id: string
  contractId: string
  cuotaNumber: number
  amount: number
  banco: string
  fechaPago: string
  comprobanteUrl: string
  createdAt: string
  client: {
    fullName: string
    cedula: string
    phone: string
  }
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

export interface PaymentHistoryAdmin {
  payments: PaymentAdmin[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface PaymentAdmin {
  id: string
  cuotaNumber: number
  amount: number
  banco: string
  fechaPago: string
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  observacion?: string
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  client: {
    fullName: string
    cedula: string
  }
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

// Client Types
export interface ClientAdmin {
  id: string
  fullName: string
  cedula: string
  phone: string
  behaviorTag: 'DISPUESTO' | 'INDECISO' | 'EVASIVO'
  contracts: ContractSummary[]
  totalContracts: number
  averageRecaudo: number
}

export interface ContractSummary {
  id: string
  lote: {
    manzana: string
    nomenclatura: string
    proyecto: string
  }
  valorTotal: number
  totalPagado: number
  cuotasPagadas: number
  totalCuotas: number
  diasMora: number
  status: string
}

export interface ClientDetail extends ClientAdmin {
  contracts: ContractDetail[]
  payments: PaymentAdmin[]
  gestiones: GestionLog[]
}

interface ContractDetail extends ContractSummary {
  valorCuota: number
  diaPago: number
  fechaContrato: string
  proximoVencimiento?: string
}

// Gestiones Types
export interface GestionLog {
  id: string
  clientId: string
  contractId: string
  type: 'WHATSAPP' | 'AI_CALL' | 'MANUAL'
  status: 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED' | 'FAILED'
  scheduledDate?: string
  sentAt?: string
  result?: any
  notes?: string
  createdAt: string
  client: {
    fullName: string
    cedula: string
    phone: string
  }
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

export interface EscalatedClient {
  clientId: string
  clientName: string
  cedula: string
  phone: string
  lote: string
  montoAdeudado: number
  diasMora: number
  motivo: string
  ultimoIntento: string
}

export interface GestionStats {
  whatsappEnviados: number
  llamadasAI: number
  compromisos: number
  escalados: number
}

// Import Types
export interface ImportResult {
  success: boolean
  clientesCreados: number
  lotesCreados: number
  contratosCreados: number
  pagosRegistrados: number
  errores: ImportError[]
}

export interface ImportError {
  fila: number
  campo: string
  valor: string
  error: string
}

// Admin Management Types
export interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'ADMIN' | 'COBROS'
  createdAt: string
  isActive: boolean
}

export interface TenantConfig {
  id: string
  name: string
  nit: string
  address: string
  phone: string
  email: string
  bankInfo: {
    banco: string
    tipoCuenta: string
    numeroCuenta: string
  }
  integrations: {
    whatsappEnabled: boolean
    daptaEnabled: boolean
  }
}

// API Response Types
export interface AdminApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}