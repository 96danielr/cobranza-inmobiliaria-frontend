import { create } from 'zustand'

export type TourStepKey = 
  | 'company_info' 
  | 'company_project'
  | 'company_logos' 
  | 'company_banks' 
  | 'users' 
  | 'lots' 
  | 'payments'

interface GuidedTourState {
  isActive: boolean
  currentStepIndex: number
  hasDismissed: boolean
  startTour: (stepIndex?: number) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (index: number) => void
  endTour: (userId?: string) => void
}

export interface TourStepItem {
  key: TourStepKey
  route: string
  title: string
  shortLabel: string
  badge: string
  description: string
  actionHint: string
  targetButtonLabel: string
  targetSelector: string
  calloutText: string
}

export const TOUR_STEPS: Array<TourStepItem> = [
  {
    key: 'company_info',
    route: '/admin/settings?tab=company',
    title: '1. Información Corporativa',
    shortLabel: 'Corporativa',
    badge: 'Paso 1 de 7',
    description: 'Diligencia la razón social, NIT, dirección y datos de contacto corporativo de tu empresa matriz.',
    actionHint: 'Diligencia los campos y presiona "Guardar Datos Corporativos".',
    targetButtonLabel: 'Guardar Datos Corporativos',
    targetSelector: '#tour-tenant-card',
    calloutText: '👇 ¡Diligencia los datos corporativos de tu empresa aquí!'
  },
  {
    key: 'company_project',
    route: '/admin/settings?tab=company',
    title: '2. Información del Proyecto Activo',
    shortLabel: 'Proyecto',
    badge: 'Paso 2 de 7',
    description: 'Configura el nombre y dirección del proyecto inmobiliario activo que estás gestionando.',
    actionHint: 'Diligencia los campos y presiona "Guardar Cambios".',
    targetButtonLabel: 'Guardar Cambios',
    targetSelector: '#tour-project-card',
    calloutText: '👇 ¡Configura los datos de tu proyecto activo aquí!'
  },
  {
    key: 'company_logos',
    route: '/admin/settings?tab=company',
    title: '3. Logos de Identidad de Marca',
    shortLabel: 'Logos',
    badge: 'Paso 3 de 7',
    description: 'Sube los dos logos: el de la empresa (lado izquierdo) y el del proyecto (lado derecho). Estos encabezarán los Planes de Pagos (PDF) y recibos de caja oficiales.',
    actionHint: 'Presiona "Cargar Logo" para seleccionar tus imágenes en formato PNG o JPG.',
    targetButtonLabel: 'Cargar Logo',
    targetSelector: '#tour-logos-card',
    calloutText: '👇 ¡Sube aquí los logos para tus contratos PDF y recibos!'
  },
  {
    key: 'company_banks',
    route: '/admin/settings?tab=company',
    title: '4. Cuentas Bancarias y Códigos QR',
    shortLabel: 'Bancos / QR',
    badge: 'Paso 4 de 7',
    description: 'Agrega las cuentas de ahorros/corrientes donde los clientes te consignarán. Puedes subir los códigos QR de Bancolombia, Nequi, etc. para que paguen al escanear.',
    actionHint: 'Presiona "+ Agregar Cuenta" para registrar una cuenta bancaria con su QR.',
    targetButtonLabel: 'Agregar Cuenta',
    targetSelector: '#tour-banks-card',
    calloutText: '👇 ¡Aquí agregas tus cuentas bancarias y códigos QR de recaudo!'
  },
  {
    key: 'users',
    route: '/admin/settings?tab=users',
    title: '5. Crear Colaboradores y Roles',
    shortLabel: 'Equipo',
    badge: 'Paso 5 de 7',
    description: 'Aquí invitas a tus asesores comerciales, auxiliares de cartera y contadores. Cada uno tendrá accesos y permisos específicos para sus tareas.',
    actionHint: 'Presiona este botón para registrar a tu primer miembro del equipo.',
    targetButtonLabel: '+ Nuevo Colaborador',
    targetSelector: '#tour-new-user-btn',
    calloutText: '👇 ¡Haz clic aquí para crear un nuevo usuario o asesor!'
  },
  {
    key: 'lots',
    route: '/admin/lots',
    title: '6. Carga de Lotes (Masiva o Manual)',
    shortLabel: 'Lotes',
    badge: 'Paso 6 de 7',
    description: 'En esta sección gestionas tu inventario. Tienes dos formas: usar "Importar Lotes" con archivo Excel o presionar "+ Nuevo Lote" para crearlos uno por uno.',
    actionHint: 'Usa "Importar Lotes" para carga en masa con Excel o "Nuevo Lote" para crear uno a uno.',
    targetButtonLabel: 'Importar Lotes / Nuevo Lote',
    targetSelector: '#tour-lots-actions',
    calloutText: '👇 ¡Aquí cargas tus lotes por Excel o de forma individual!'
  },
  {
    key: 'payments',
    route: '/admin/payments',
    title: '7. Pagos Manuales y Link de Cobro',
    shortLabel: 'Pagos',
    badge: 'Paso 7 de 7',
    description: 'Aquí registras las consignaciones directas con "Registrar Pago" o compartes el enlace público QR con tus clientes.',
    actionHint: 'Usa "Registrar Pago" para abonar a las cuotas o "Copiar Link" para el cliente.',
    targetButtonLabel: 'Registrar Pago / Link Cliente',
    targetSelector: '#tour-payments-actions',
    calloutText: '👇 ¡Aquí registras pagos manuales o copias el link para clientes!'
  }
]

export const useGuidedTourStore = create<GuidedTourState>((set, get) => ({
  isActive: false,
  currentStepIndex: 0,
  hasDismissed: false,

  startTour: (stepIndex = 0) => {
    set({ isActive: true, currentStepIndex: stepIndex, hasDismissed: false })
  },

  nextStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 })
    } else {
      set({ isActive: false })
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 })
    }
  },

  goToStep: (index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      set({ currentStepIndex: index })
    }
  },

  endTour: (userId?: string) => {
    if (userId) {
      try {
        localStorage.setItem(`live_tour_completed_${userId}`, 'true')
      } catch (e) {}
    }
    set({ isActive: false, hasDismissed: true })
  }
}))
