'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Check,
  X,
  Eye,
  Download,
  Filter,
  Search,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  User,
  CreditCard,
  Upload,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Mail,
  Edit,
  QrCode
} from 'lucide-react'
import { SharePaymentModal } from '@/components/admin/SharePaymentModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Combobox } from '@/components/ui/Combobox'
import { SortHeader } from '@/components/ui/SortHeader'
import { StatsCardSkeleton, TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PaymentCard, PaymentCardSkeleton } from '@/components/ui/PaymentCard'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { useClientStore } from '@/stores/clientStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

interface PendingPayment {
  id: string
  contractId: string
  cuotaNumber: number
  receiptNumber?: number
  amount: string | number
  paymentType?: 'TOTAL' | 'MINIMO' | 'OTRO' | 'PARCIAL'
  quotaValue?: number | null
  banco: string
  fechaPago: string
  comprobante?: string | null
  createdAt: string
  status: 'PENDIENTE' | 'PAGADO' | 'MORA' | 'RECHAZADO'
  observacion?: string
  observations?: string
  rejectedReason?: string
  contract: {
    client: {
      fullName: string
      cedula: string
      phone: string
    }
    lot: {
      manzana: string
      lotNumber?: string
      nomenclatura: string
      project: {
        name: string
      }
    }
  }
  receiptUrl?: string
}


import { ActionTooltip } from '@/components/ui/ActionTooltip'

export default function PaymentsPage() {
  const { isAuthenticated, admin } = useAdminAuthStore()
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'PAGADO' | 'MORA'>('ALL')
  const [isProcessing, setIsProcessing] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [rotationAngle, setRotationAngle] = useState(0)

  // Manual Payment State
  const { clients, fetchClientsIfNeeded } = useClientStore()
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientDetails, setClientDetails] = useState<any>(null)
  const [selectedContractId, setSelectedContractId] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [manualPaymentOption, setManualPaymentOption] = useState<'minimo' | 'total' | 'otro'>('minimo')

  // Edit Payment State
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false)
  const [editPaymentId, setEditPaymentId] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editBank, setEditBank] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('')
  const [editPaymentDate, setEditPaymentDate] = useState('')
  const [editObservations, setEditObservations] = useState('')
  const [editReason, setEditReason] = useState('')
  const [isEditingPayment, setIsEditingPayment] = useState(false)

  const pendingQuotas = useMemo(() => {
    if (!clientDetails || !selectedContractId) return []
    const contract = clientDetails.contracts?.find((c: any) => c._id === selectedContractId)
    if (!contract || !contract.quotas) return []
    return contract.quotas
      .filter((q: any) => q.status !== 'pagado')
      .sort((a: any, b: any) => {
        if (a.type === 'inicial' && b.type !== 'inicial') return -1;
        if (a.type !== 'inicial' && b.type === 'inicial') return 1;
        return a.number - b.number;
      })
  }, [clientDetails, selectedContractId])

  const minPaymentAmount = useMemo(() => {
    return pendingQuotas.length > 0 ? (pendingQuotas[0].value - (pendingQuotas[0].amountPaid || 0)) : 0
  }, [pendingQuotas])

  const totalPaymentAmount = useMemo(() => {
    return pendingQuotas.reduce((sum: number, q: any) => sum + (q.value - (q.amountPaid || 0)), 0)
  }, [pendingQuotas])

  // Manual Payment Form State
  const [manualAmount, setManualAmount] = useState('')
  const [manualBank, setManualBank] = useState('')
  const [manualObservations, setManualObservations] = useState('')
  const [manualCapture, setManualCapture] = useState<File | null>(null)
  const [manualPaymentMethod, setManualPaymentMethod] = useState<string>('Transferencia bancaria')
  const [manualPaymentDate, setManualPaymentDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [companySlug, setCompanySlug] = useState('')
  const [isSharePaymentModalOpen, setIsSharePaymentModalOpen] = useState(false)
  const [companyDetails, setCompanyDetails] = useState<any>(null)
  const [banks, setBanks] = useState<any[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)

  // Siigo Export State
  const [isSiigoModalOpen, setIsSiigoModalOpen] = useState(false)
  const [siigoStartDate, setSiigoStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [siigoEndDate, setSiigoEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [siigoComprobante, setSiigoComprobante] = useState('14')
  const [siigoCuentaCartera, setSiigoCuentaCartera] = useState('13050502')
  const [siigoCentroCostos, setSiigoCentroCostos] = useState('001')
  const [siigoDefaultBanco, setSiigoDefaultBanco] = useState('11200501')
  const [siigoIsExporting, setSiigoIsExporting] = useState(false)
  const [siigoBankAccounts, setSiigoBankAccounts] = useState<any[]>([])

  const { selectedCompanyId } = useAdminAuthStore()

  useEffect(() => {
    const fetchCompany = async () => {
      if (selectedCompanyId) {
        try {
          const res = await adminApi.getCompany(selectedCompanyId)
          if (res.data.success) {
            setCompanySlug(res.data.data.company.slug)
            setCompanyDetails(res.data.data.company)
            setSiigoBankAccounts(res.data.data.company.bankAccounts || [])
          }
        } catch (err) {

        }
      }
    }
    fetchCompany()
  }, [selectedCompanyId])

  useEffect(() => {
    if (isManualModalOpen) {
      fetchClientsIfNeeded()
      fetchBanks()
    }
  }, [isManualModalOpen, fetchClientsIfNeeded])

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true)
      const response = await adminApi.getBanks(1, 1000, undefined, undefined, undefined, false) // Only get active/visible banks!
      if (response.data.success) {
        setBanks(response.data.data.banks)
      }
    } catch (error) {

    } finally {
      setLoadingBanks(false)
    }
  }

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedClientId) {
        setClientDetails(null)
        setSelectedContractId('')
        return
      }
      setModalLoading(true)
      try {
        const response = await adminApi.getClient(selectedClientId)
        if (response.data.success) {
          setClientDetails(response.data.data)
          // Default to first contract if available
          if (response.data.data.contracts?.length > 0) {
            setSelectedContractId(response.data.data.contracts[0]._id)
          }
        }
      } catch (error) {
        toast.error('Error al cargar detalles del cliente')
      } finally {
        setModalLoading(false)
      }
    }
    fetchDetails()
  }, [selectedClientId])

  // Fetch payments with server-side pagination — same pattern as Clients page
  const fetchPayments = useCallback(async (page: number, limit: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    try {
      const response = await adminApi.getPayments(page, limit, search, statusFilter, sortBy, sortOrder)
      if (!response.data.success) {
        throw new Error('Error loading payments')
      }

      return {
        data: response.data.data.payments || [],
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit,
        pages: response.data.data.pagination.pages
      }
    } catch (error) {

      throw error
    }
  }, [statusFilter])

  const pagination = useServerPagination({
    fetchData: fetchPayments,
    initialLimit: 12,
    dependencies: [statusFilter]
  })

  const refresh = () => pagination.refresh()

  const toggleFilter = (status: 'PENDIENTE' | 'PAGADO' | 'MORA') => {
    if (statusFilter === status) {
      setStatusFilter('ALL')
    } else {
      setStatusFilter(status)
    }
  }


  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numValue)
  }

  const handleViewPayment = (payment: PendingPayment) => {
    setSelectedPayment(payment)
    setObservacion(payment.status === 'RECHAZADO' ? (payment.rejectedReason || '') : '')
    setRotationAngle(0)
    setIsModalOpen(true)
  }

  const handleApprovePayment = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      await adminApi.approvePayment(paymentId, observacion)

      // Refresh the current page
      refresh()

      toast.success('Cuota marcada como pagada')
      setIsModalOpen(false)
      setIsManualModalOpen(false)
      setSelectedPayment(null)
      setSelectedClientId('')
      setObservacion('')
    } catch (error) {

      toast.error('Error al aprobar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  const getPaymentUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return companySlug ? `${origin}/p/${companySlug}/payments` : ''
  }

  const openShareModal = async () => {
    let currentSlug = companySlug
    if (!currentSlug && selectedCompanyId) {
      try {
        setModalLoading(true)
        const res = await adminApi.getCompany(selectedCompanyId)
        if (res.data.success) {
          currentSlug = res.data.data.company.slug
          setCompanySlug(currentSlug)
        }
      } catch (e) {
      } finally {
        setModalLoading(false)
      }
    }
    if (!currentSlug) {
      toast.error('No se pudo generar el enlace. Verifique el nombre de la inmobiliaria.')
      return
    }
    setIsSharePaymentModalOpen(true)
  }

  const copyPaymentLink = async () => {
    let currentSlug = companySlug

    // Attempt re-fetch if state is empty
    if (!currentSlug && selectedCompanyId) {
      try {
        setModalLoading(true)
        const res = await adminApi.getCompany(selectedCompanyId)
        if (res.data.success) {
          currentSlug = res.data.data.company.slug
          setCompanySlug(currentSlug)
        }
      } catch (e) {

      } finally {
        setModalLoading(false)
      }
    }

    if (!currentSlug) {
      toast.error('No se pudo generar el link. Verifique el nombre de la inmobiliaria.')
      return
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${origin}/p/${currentSlug}/payments`

    try {
      await navigator.clipboard.writeText(link)
      toast.success('Link del cliente copiado: ' + link, { duration: 4000 })
    } catch (err) {
      // Fallback for non-secure contexts if needed

      toast.error('Haga clic derecho y copie: ' + link)
    }
  }

  const handleCopyReceiptLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Enlace del recibo copiado')
  }

  const handleRegisterManualPayment = async () => {
    if (pendingQuotas.length === 0) {
      toast.error('No hay cuotas pendientes para pagar')
      return
    }

    let finalAmount = 0
    if (manualPaymentOption === 'minimo') {
      finalAmount = minPaymentAmount
    } else if (manualPaymentOption === 'total') {
      finalAmount = totalPaymentAmount
    } else {
      if (!manualAmount || parseFloat(manualAmount) <= 0) {
        toast.error('Debe ingresar un monto válido a pagar')
        return
      }
      finalAmount = parseFloat(manualAmount)
    }

    if (manualPaymentMethod === 'transferencia' && !manualBank) {
      toast.error('Debe seleccionar un banco para la transferencia')
      return
    }

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('quotaId', pendingQuotas[0]._id)
      formData.append('amount', finalAmount.toString())
      formData.append('bank', manualPaymentMethod === 'Efectivo' ? 'EFECTIVO' : manualBank)
      formData.append('paymentMethod', manualPaymentMethod)
      formData.append('observations', manualObservations)
      if (manualCapture) {
        formData.append('capture', manualCapture)
      }
      formData.append('paymentDate', manualPaymentDate)

      await adminApi.registerManualPayment(formData)

      toast.success('Pago registrado y aprobado exitosamente')
      setIsManualModalOpen(false)
      // Reset form
      setManualAmount('')
      setManualBank('')
      setManualObservations('')
      setManualCapture(null)
      setSelectedClientId('')
      setClientDetails(null)
      setManualPaymentMethod('Transferencia bancaria')
      setManualPaymentOption('minimo')
      setManualPaymentDate(dayjs().format('YYYY-MM-DD'))

      refresh()
    } catch (error) {
      toast.error('Error al registrar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenEditModal = (payment: PendingPayment) => {
    setEditPaymentId(payment.id)
    setEditAmount(String(payment.amount))
    setEditBank(payment.banco || '')
    setEditPaymentMethod(payment.paymentType || 'Transferencia bancaria')
    setEditPaymentDate(payment.fechaPago ? dayjs(payment.fechaPago).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'))
    setEditObservations(payment.observations || '')
    setEditReason('')
    setIsEditPaymentModalOpen(true)
  }

  const handleSaveEditPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editAmount || Number(editAmount) <= 0) {
      toast.error('Ingrese un monto válido mayor a 0')
      return
    }
    if (!editReason.trim()) {
      toast.error('Por favor ingrese el motivo de la corrección')
      return
    }

    try {
      setIsEditingPayment(true)
      const res = await adminApi.editPayment(editPaymentId, {
        amount: Number(editAmount),
        bank: editBank,
        paymentMethod: editPaymentMethod,
        paymentDate: editPaymentDate,
        observations: editObservations,
        reason: editReason
      })

      if (res.data.success) {
        toast.success('¡Pago corregido y cuotas recalculadas exitosamente!')
        setIsEditPaymentModalOpen(false)
        setIsModalOpen(false)
        pagination.refresh()
      } else {
        toast.error(res.data.message || 'Error al editar el pago')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || err.message || 'Error al procesar la corrección')
    } finally {
      setIsEditingPayment(false)
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    if (!observacion.trim()) {
      toast.error('Debe ingresar una observación para rechazar el pago')
      return
    }

    setIsProcessing(true)
    try {
      await adminApi.rejectPayment(paymentId, observacion)

      // Refresh the current page
      refresh()

      toast.success('Cuota revertida a pendiente')
      setIsModalOpen(false)
      setSelectedPayment(null)
      setObservacion('')
    } catch (error) {

      toast.error('Error al rechazar el pago')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const handleResendReceipt = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      await adminApi.resendReceipt(paymentId)
      toast.success('Recibo reenviado correctamente')
    } catch (error) {
      toast.error('Error al reenviar el recibo')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
      case 'PAGADO':
        return 'text-accent-green bg-accent-green/20 border-accent-green/30'
      case 'MORA':
      case 'RECHAZADO':
        return 'text-accent-red bg-accent-red/20 border-accent-red/30'
      default:
        return 'text-text-muted bg-glass-primary/20 border-glass-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return <Clock className="w-4 h-4" />
      case 'PAGADO':
        return <CheckCircle className="w-4 h-4" />
      case 'MORA':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const { pendingCount, paidCount, overdueCount } = useMemo(() => {
    return {
      pendingCount: pagination.data.filter((p: PendingPayment) => p.status === 'PENDIENTE').length,
      paidCount: pagination.data.filter((p: PendingPayment) => p.status === 'PAGADO').length,
      overdueCount: pagination.data.filter((p: PendingPayment) => p.status === 'MORA').length
    }
  }, [pagination.data])


  return (
    <div className="flex flex-col min-h-full space-y-4 md:space-y-6 px-1 py-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Aprobación de Pagos</h1>
          <p className="text-text-secondary mt-2">
            Revisa y aprueba los comprobantes de pago reportados por los clientes
            {!pagination.loading && `(${pagination.total.toLocaleString('es-CO')} cuotas total)`}
          </p>
        </div>
        <div id="tour-payments-actions" className="flex flex-col sm:flex-row gap-3 rounded-2xl p-1 transition-all">
          <Button
            variant="outline"
            className="glass-button border-glass-border text-text-secondary min-h-[44px]"
            onClick={copyPaymentLink}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Compartir Link
          </Button>
          <Button
            variant="outline"
            className="glass-button border-accent-purple/30 text-accent-purple hover:bg-accent-purple/10 min-h-[44px]"
            onClick={openShareModal}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Compartir QR
          </Button>
          <Button
            variant="outline"
            className="glass-button border-glass-border text-text-secondary min-h-[44px]"
            onClick={() => setIsSiigoModalOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Siigo
          </Button>
          <Button
            className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
            onClick={() => setIsManualModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </div>

      {/* Stats Cards - RE-ENABLED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up animate-fade-in-up-delay">
        {pagination.loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
             <Card 
              variant="elevated" 
              className={cn(
                "stats-card stats-yellow cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow",
                statusFilter === 'PENDIENTE' && "ring-2 ring-accent-yellow border-accent-yellow/50 bg-accent-yellow/10"
              )}
              onClick={() => toggleFilter('PENDIENTE')}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-yellow/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <Clock className="w-6 h-6 text-accent-yellow" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Pendientes</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              variant="elevated" 
              className={cn(
                "stats-card stats-green cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow",
                statusFilter === 'PAGADO' && "ring-2 ring-accent-green border-accent-green/50 bg-accent-green/10"
              )}
              onClick={() => toggleFilter('PAGADO')}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-green/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <CheckCircle className="w-6 h-6 text-accent-green" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Pagados</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{paidCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              variant="elevated" 
              className={cn(
                "stats-card stats-red cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow",
                statusFilter === 'MORA' && "ring-2 ring-accent-red border-accent-red/50 bg-accent-red/10"
              )}
              onClick={() => toggleFilter('MORA')}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-red/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <AlertCircle className="w-6 h-6 text-accent-red" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">En Mora</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{overdueCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card variant="interactive" className="animate-fade-in-up animate-fade-in-up-delay">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente, cédula o proyecto..."
                value={pagination.search}
                onChange={(e) => pagination.handleSearch(e.target.value)}
                icon={Search}
                className="glass-input"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="PAGADO">Pagados</option>
                <option value="MORA">En Mora</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments List - Partial recovery for testing */}
      <Card variant="elevated" className="flex-1 flex flex-col min-h-0 animate-fade-in-up animate-fade-in-up-delay">
        {/* Fixed Header (Mobile only) */}
        <div className="flex-shrink-0 border-b border-glass-border lg:hidden">
          <div className="p-4">
            <h3 className="font-medium text-text-primary">Aprobación de Pagos</h3>
            <p className="text-sm text-text-secondary">{pagination.total} cuotas encontradas</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-[400px] lg:min-h-[500px] lg:max-h-[600px] xl:max-h-[calc(100vh-350px)] w-full relative">
          <table className="hidden lg:table w-full border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-20">
                <SortHeader
                  label="Cliente"
                  field="contract.client.fullName"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <SortHeader
                  label="Proyecto/Lote"
                  field="contract.lot.nomenclatura"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <SortHeader
                  label="# Cuota"
                  field="cuotaNumber"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <SortHeader
                  label="Monto"
                  field="amount"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <SortHeader
                  label="Banco"
                  field="banco"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <SortHeader
                  label="Fecha"
                  field="fechaPago"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <SortHeader
                  label="Estado"
                  field="status"
                  currentSortBy={pagination.sortBy}
                  currentSortOrder={pagination.sortOrder}
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20"
                />
                <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border z-20">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                <tr><td colSpan={8} className="text-center py-4 text-text-muted">Cargando cuotas...</td></tr>
              ) : pagination.data.map((payment: PendingPayment) => (
                <tr key={payment.id} className="border-b border-glass-border hover:bg-glass-primary/10 transition-colors">
                  <td className="py-4 px-6">
                    <p className="text-text-primary font-medium">{payment.contract?.client?.fullName || 'N/A'}</p>
                    <p className="text-xs text-text-muted">{payment.contract?.client?.cedula}</p>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <p className="text-text-primary font-medium">{payment.contract?.lot?.project?.name || '---'}</p>
                    <p className="text-xs text-text-muted">E: {payment.contract?.lot?.project?.name || '-'} - Mz: {payment.contract?.lot?.manzana || '-'} - L: {payment.contract?.lot?.lotNumber || '-'}{payment.contract?.lot?.nomenclatura ? ` (${payment.contract?.lot?.nomenclatura})` : ''}</p>
                  </td>
                  <td className="py-4 px-6 text-text-primary font-medium">
                    <div>Cuota #{payment.cuotaNumber}</div>
                    {payment.receiptNumber && (
                      <div className="text-xs text-accent-green font-normal">Recibo #{payment.receiptNumber}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-text-primary font-medium">
                    {formatCurrency(payment.amount)}
                    {payment.paymentType && (
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        payment.paymentType === 'TOTAL'
                          ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                          : payment.paymentType === 'MINIMO'
                            ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
                            : 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
                      }`} title={
                        payment.quotaValue
                          ? `Valor de la cuota al reportar: ${formatCurrency(payment.quotaValue)}`
                          : undefined
                      }>
                        {payment.paymentType === 'TOTAL' ? 'Total' : payment.paymentType === 'MINIMO' ? 'Mínimo' : 'Parcial/Abono'}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-text-secondary text-sm">{payment.banco}</td>
                  <td className="py-4 px-6 text-text-secondary text-sm">{dayjs(payment.fechaPago).format('DD/MM/YYYY')}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <ActionTooltip content="Detalles">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleViewPayment(payment)}
                          className="glass-button"
                          title="Ver Detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </ActionTooltip>
                      {payment.receiptUrl && (
                        <div className="flex gap-1">
                          <ActionTooltip content="Ver recibo">
                            <Button
                              variant="glass"
                              size="sm"
                              className="glass-button text-accent-green hover:bg-accent-green/20"
                              onClick={() => window.open(payment.receiptUrl, '_blank')}
                              title="Ver Recibo"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip content="Copiar link">
                            <Button
                              variant="glass"
                              size="sm"
                              className="glass-button text-accent-blue hover:bg-accent-blue/20"
                              onClick={() => payment.receiptUrl && handleCopyReceiptLink(payment.receiptUrl)}
                              title="Copiar Link de Recibo"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip content="Reenviar recibo">
                            <Button
                              variant="glass"
                              size="sm"
                              className="glass-button text-accent-purple hover:bg-accent-purple/20"
                              onClick={() => handleResendReceipt(payment.id)}
                              title="Reenviar por Correo/SMS"
                              disabled={isProcessing}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </ActionTooltip>
                        </div>
                      )}
                      {payment.status === 'PENDIENTE' && (
                        <>
                          <ActionTooltip content="Aprobar pago">
                            <Button
                              variant="glass"
                              size="sm"
                              className="glass-button text-accent-green hover:bg-accent-green/20"
                              onClick={() => handleApprovePayment(payment.id)}
                              disabled={isProcessing}
                              title="Aprobar Pago"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </ActionTooltip>
                          <ActionTooltip content="Rechazar pago">
                            <Button
                              variant="glass"
                              size="sm"
                              className="glass-button text-accent-red hover:bg-accent-red/20"
                              onClick={() => handleViewPayment(payment)}
                              title="Rechazar Pago"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </ActionTooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pagination.loading && pagination.data.length === 0 && (
            <p className="text-center py-10 text-text-muted">No se encontraron resultados</p>
          )}

          <div className="lg:hidden p-4 space-y-4">
            <p className="text-sm text-text-secondary mb-2">{pagination.total} cuotas encontradas</p>
            {pagination.loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <PaymentCardSkeleton key={`skeleton-${index}`} />
              ))
            ) : (
              pagination.data.map((payment: PendingPayment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onView={handleViewPayment}
                  onApprove={handleApprovePayment}
                  onReject={() => handleViewPayment(payment)}
                  isProcessing={isProcessing}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {!pagination.loading && pagination.pages > 1 && (
          <div className="flex-shrink-0 border-t border-glass-border">
            <div className="px-4 py-3">
              <PaginationControls
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
                onPageChange={pagination.goToPage}
                onLimitChange={pagination.changeLimit}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPayment(null)
          setObservacion('')
        }}
        title="Detalle del Pago"
        size="lg"
      >
        {modalLoading ? (
          <ModalContentSkeleton sections={3} />
        ) : selectedPayment && (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Información del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Nombre Completo</p>
                  <p className="font-medium text-text-primary">{selectedPayment.contract.client.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cédula</p>
                  <p className="font-medium text-text-primary">{selectedPayment.contract.client.cedula}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Teléfono</p>
                  <p className="font-medium text-text-primary">{selectedPayment.contract.client.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Lote</p>
                  <p className="font-medium text-text-primary">
                    E: {selectedPayment.contract.lot.project.name || '-'} - M: {selectedPayment.contract.lot.manzana || '-'} - L: {selectedPayment.contract.lot.lotNumber || '-'}{selectedPayment.contract.lot.nomenclatura ? ` (${selectedPayment.contract.lot.nomenclatura})` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Información del Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Cuota / Recibo</p>
                  <p className="font-medium text-text-primary">
                    Cuota #{selectedPayment.cuotaNumber}
                    {selectedPayment.receiptNumber && (
                      <span className="ml-2 text-accent-green text-sm font-semibold">(Recibo #{selectedPayment.receiptNumber})</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Monto</p>
                  <p className="font-medium text-text-primary text-lg">
                    {formatCurrency(selectedPayment.amount)}
                    {selectedPayment.paymentType && (
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border align-middle ${
                        selectedPayment.paymentType === 'TOTAL'
                          ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                          : selectedPayment.paymentType === 'MINIMO'
                            ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/30'
                            : 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30'
                      }`}>
                        {selectedPayment.paymentType === 'TOTAL' ? 'Seleccionó: Total' : selectedPayment.paymentType === 'MINIMO' ? 'Seleccionó: Mínimo' : 'Seleccionó: Parcial/Abono'}
                      </span>
                    )}
                  </p>
                  {selectedPayment.quotaValue && (
                    <p className="text-xs text-text-muted">
                      Valor de la cuota al reportar: {formatCurrency(selectedPayment.quotaValue)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Banco</p>
                  <p className="font-medium text-text-primary">{selectedPayment.banco}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Fecha de Pago</p>
                  <p className="font-medium text-text-primary">
                    {dayjs(selectedPayment.fechaPago).format('DD/MM/YYYY')}
                  </p>
                </div>
              </div>
            </div>

            {/* Comprobante */}
            {selectedPayment.comprobante && (
              <div>
                <h3 className="font-medium text-text-primary mb-3 flex items-center justify-between">
                  <span>Comprobante de Pago</span>
                  {selectedPayment.comprobante.match(/\.(jpeg|jpg|gif|png|webp)/i) && (
                    <Button
                      variant="glass"
                      size="sm"
                      className="glass-button text-xs h-8 px-3"
                      onClick={() => setRotationAngle(prev => (prev + 90) % 360)}
                    >
                      Girar Imagen 90°
                    </Button>
                  )}
                </h3>
                <div className="border border-glass-border rounded-lg p-4 bg-glass-primary/20 backdrop-blur-glass flex flex-col items-center justify-center">
                  {selectedPayment.comprobante.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                    <div className="relative group max-w-full p-4">
                      <img
                        src={selectedPayment.comprobante}
                        alt="Comprobante"
                        style={{ transform: `rotate(${rotationAngle}deg) scale(${rotationAngle % 180 !== 0 ? 0.65 : 1})` }}
                        className="max-h-[500px] w-auto rounded-lg shadow-lg cursor-zoom-in transition-all duration-300 origin-center object-contain"
                        onClick={() => window.open(selectedPayment.comprobante || '', '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <FileText className="w-6 h-6 text-text-muted mr-2" />
                        <span className="text-text-secondary truncate max-w-[200px]">
                          Comprobante ({selectedPayment.comprobante.split('/').pop()})
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex justify-end w-full">
                    <Button
                      variant="glass"
                      size="sm"
                      className="glass-button"
                      onClick={() => window.open(selectedPayment.comprobante || '', '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar / Ver Full
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Client Observations */}
            {selectedPayment.observations && (
              <div className="bg-glass-primary/20 backdrop-blur-glass border border-glass-border rounded-lg p-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Observaciones Reportadas por el Cliente
                </p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {selectedPayment.observations}
                </p>
              </div>
            )}

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Observaciones
              </label>
              <textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                rows={3}
                className="glass-input w-full px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                placeholder="Ingrese observaciones sobre este pago..."
              />
            </div>

            {/* Status and Actions */}
            {selectedPayment.status === 'PENDIENTE' && (
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-glass-border">
                <Button
                  variant="outline"
                  onClick={() => handleRejectPayment(selectedPayment.id)}
                  loading={isProcessing}
                  className="glass-button text-accent-red border-accent-red/30 hover:bg-accent-red/20 min-h-[44px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => handleApprovePayment(selectedPayment.id)}
                  loading={isProcessing}
                  className="glass-button bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30 min-h-[44px]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </div>
            )}

            {selectedPayment.status !== 'PENDIENTE' && (
              <div className="pt-4 border-t border-glass-border">
                <div className={`p-3 rounded-lg border backdrop-blur-sm ${getStatusColor(selectedPayment.status)}`}>
                  <div className="flex items-center">
                    {getStatusIcon(selectedPayment.status)}
                    <span className="ml-2 font-medium">
                      Estado: {selectedPayment.status}
                    </span>
                  </div>
                  {selectedPayment.observacion && (
                    <p className="mt-2 text-sm">{selectedPayment.observacion}</p>
                  )}
                  {selectedPayment.receiptUrl && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="glass"
                        size="sm"
                        className="glass-button flex-1 bg-white/10"
                        onClick={() => window.open(selectedPayment?.receiptUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Recibo (PDF)
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        className="glass-button bg-white/10 px-3"
                        onClick={() => selectedPayment.receiptUrl && handleCopyReceiptLink(selectedPayment.receiptUrl)}
                        title="Copiar Link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        className="glass-button flex-1 bg-white/10"
                        onClick={() => handleResendReceipt(selectedPayment.id)}
                        disabled={isProcessing}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Reenviar
                      </Button>
                    </div>
                  )}

                  {/* Edit Payment Button for Admins */}
                  {['superadmin', 'tenant_admin', 'company_admin', 'administrador', 'admin'].includes(admin?.role || '') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-button w-full mt-3 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs flex items-center justify-center font-medium"
                      onClick={() => handleOpenEditModal(selectedPayment)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Corregir / Editar Pago y Recalcular Cuotas
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditPaymentModalOpen}
        onClose={() => setIsEditPaymentModalOpen(false)}
        title="Corregir Pago y Recalcular Cuotas"
        size="md"
      >
        <form onSubmit={handleSaveEditPayment} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Advertencia de Recálculo Automático
            </p>
            <p className="text-[11px] leading-relaxed">
              Al modificar el monto, el sistema revertirá automáticamente las cuotas que fueron pagadas por exceso en este pago y las volverá a calcular en cascada con el nuevo valor real.
            </p>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">Monto Real Correcto ($ COP)</label>
            <Input
              type="number"
              step="any"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              placeholder="Ej: 1666000"
              required
              className="text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-text-secondary font-medium mb-1">Banco / Medio</label>
              <Input
                type="text"
                value={editBank}
                onChange={(e) => setEditBank(e.target.value)}
                placeholder="Ej: Bancolombia"
              />
            </div>
            <div>
              <label className="block text-text-secondary font-medium mb-1">Fecha de Pago</label>
              <Input
                type="date"
                value={editPaymentDate}
                onChange={(e) => setEditPaymentDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">Motivo de la Corrección (Auditoría) *</label>
            <textarea
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={2}
              className="glass-input w-full px-3 py-2 text-xs focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
              placeholder="Ej: Error de digitalización se fue un 0 de más en el valor..."
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">Observaciones Generales</label>
            <textarea
              value={editObservations}
              onChange={(e) => setEditObservations(e.target.value)}
              rows={2}
              className="glass-input w-full px-3 py-2 text-xs"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-glass-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditPaymentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isEditingPayment}
              className="bg-accent-blue text-white"
            >
              Guardar y Recalcular
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Payment Registration Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false)
          setSelectedClientId('')
          setClientDetails(null)
          setSelectedContractId('')
          setManualAmount('')
          setManualBank('')
          setManualObservations('')
          setManualCapture(null)
          setManualPaymentMethod('Transferencia bancaria')
          setManualPaymentOption('minimo')
        }}
        title="Registrar Pago Manual"
        size="xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Cliente</label>
            <Combobox
              options={clients.map(c => ({ value: c._id, label: `${c.name} - ${c.idNumber}` }))}
              value={selectedClientId}
              onChange={setSelectedClientId}
              placeholder="Buscar cliente por nombre o cédula..."
              searchPlaceholder="Escribir nombre..."
            />
          </div>

          {modalLoading && <ModalContentSkeleton sections={2} />}

          {!modalLoading && clientDetails && (
            <div className="space-y-6 animate-fade-in-up">

              {/* Row 1: Contrato/Lote & Forma de Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clientDetails.contracts?.length > 1 ? (
                  <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                    <label className="block text-sm font-medium text-text-primary mb-3">CONTRATO / LOTE</label>
                    <select
                      value={selectedContractId}
                      onChange={(e) => setSelectedContractId(e.target.value)}
                      className="glass-input w-full px-4 py-3 text-lg"
                    >
                      {clientDetails.contracts.map((c: any) => (
                        <option key={c._id} value={c._id}>
                          Contrato de Compraventa: Mz {c.lot?.manzana || '-'} Lote {c.lot?.lotNumber || c.lot?.nomenclature || c.lot?.nomenclatura || '-'}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border flex items-center">
                    <p className="text-sm text-text-muted">
                      Contrato de Compraventa: Mz {clientDetails.contracts?.[0]?.lot?.manzana || '-'} Lote {clientDetails.contracts?.[0]?.lot?.lotNumber || clientDetails.contracts?.[0]?.lot?.nomenclature || clientDetails.contracts?.[0]?.lot?.nomenclatura || '-'}
                    </p>
                  </div>
                )}

                {/* Payment Method Selector (Only for Logged-in Admins) */}
                {['superadmin', 'tenant_admin', 'company_admin'].includes(admin?.role || '') && (
                  <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border space-y-3 animate-fade-in-up">
                    <label className="block text-sm font-semibold text-text-primary flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-accent-blue" />
                      Forma de Pago
                    </label>
                    <select
                      value={manualPaymentMethod}
                      onChange={(e) => {
                        setManualPaymentMethod(e.target.value)
                        if (e.target.value === 'Efectivo') {
                          setManualBank('')
                        }
                      }}
                      className="glass-input w-full px-4 py-3 text-base"
                    >
                      <option value="Transferencia bancaria">Transferencia bancaria</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Consignación en corresponsal">Consignación en corresponsal</option>
                      <option value="Consignación en banco">Consignación en banco</option>
                      <option value="Transferencia interbancaria">Transferencia interbancaria</option>
                      {['superadmin', 'tenant_admin', 'company_admin'].includes(admin?.role || '') && (
                        <option value="Cruce de cuentas">Cruce de cuentas</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border space-y-4">
                <label className="block text-sm font-semibold text-text-primary">
                  ¿Cuánto desea registrar como pagado?
                </label>
                
                {pendingQuotas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Pago Mínimo */}
                    <div
                      onClick={() => {
                        setManualPaymentOption('minimo')
                        setManualAmount(minPaymentAmount.toString())
                      }}
                      className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none active:scale-[0.99] ${
                        manualPaymentOption === 'minimo'
                          ? 'shadow-glow'
                          : 'hover:bg-glass-primary/20'
                      }`}
                      style={manualPaymentOption === 'minimo' ? { backgroundColor: 'rgba(var(--accent-blue-rgb), 0.25)', borderColor: 'rgba(var(--accent-blue-rgb), 0.35)' } : { borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent-blue" />
                          Pago Mínimo
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal">Cuota #{pendingQuotas[0].number} pendiente</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-glass-border/30">
                        <span className="font-extrabold text-text-primary text-base">
                          {formatCurrency(minPaymentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Pago Total */}
                    <div
                      onClick={() => {
                        setManualPaymentOption('total')
                        setManualAmount(totalPaymentAmount.toString())
                      }}
                      className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none active:scale-[0.99] ${
                        manualPaymentOption === 'total'
                          ? 'shadow-glow'
                          : 'hover:bg-glass-primary/20'
                      }`}
                      style={manualPaymentOption === 'total' ? { backgroundColor: 'rgba(var(--accent-blue-rgb), 0.25)', borderColor: 'rgba(var(--accent-blue-rgb), 0.35)' } : { borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent-green" />
                          Pago Total
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal">Pagar deuda total acumulada</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-glass-border/30">
                        <span className="font-extrabold text-text-primary text-base">
                          {formatCurrency(totalPaymentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Otro Valor */}
                    <div
                      onClick={() => {
                        setManualPaymentOption('otro')
                        setManualAmount('')
                      }}
                      className={`flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer select-none active:scale-[0.99] ${
                        manualPaymentOption === 'otro'
                          ? 'shadow-glow'
                          : 'hover:bg-glass-primary/20'
                      }`}
                      style={manualPaymentOption === 'otro' ? { backgroundColor: 'rgba(var(--accent-blue-rgb), 0.25)', borderColor: 'rgba(var(--accent-blue-rgb), 0.35)' } : { borderColor: 'rgba(255,255,255,0.08)' }}
                    >
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent-purple" />
                          Otro Valor (Abonar)
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal">Monto personalizado libre</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-glass-border/30">
                        <span className="text-xs font-semibold text-text-secondary italic">
                          Ingresar monto...
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No hay cuotas pendientes para este contrato.</p>
                )}
              </div>

              {manualPaymentOption === 'otro' && pendingQuotas.length > 0 && (
                <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border animate-fade-in">
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent-purple" />
                    Ingrese el valor a registrar
                  </label>
                  <Input
                    type="number"
                    placeholder="Escriba el monto a pagar..."
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="glass-input h-12 text-lg"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Banco / Medio de Recibo
                  </label>
                  {manualPaymentMethod === 'Efectivo' && ['superadmin', 'tenant_admin', 'admin'].includes(admin?.role || '') ? (
                    <div className="h-12 px-4 rounded-xl border border-glass-border/30 bg-glass-primary/20 flex items-center text-text-disabled select-none">
                      Recibido en Efectivo (Caja)
                    </div>
                  ) : (
                    <>
                      <Combobox
                        options={banks.map(b => ({ value: b.acronym, label: b.acronym }))}
                        value={manualBank}
                        onChange={setManualBank}
                        placeholder="Seleccione un banco..."
                        searchPlaceholder="Buscar banco..."
                        className="h-12"
                      />
                      {loadingBanks && <p className="text-[10px] text-text-muted mt-1 animate-pulse">Cargando bancos...</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Valor a Registrar
                  </label>
                  <div className="h-12 px-4 rounded-xl border border-glass-border bg-glass-primary/20 flex items-center justify-between text-text-primary font-bold">
                    <span>
                      {formatCurrency(
                        manualPaymentOption === 'minimo'
                          ? minPaymentAmount
                          : manualPaymentOption === 'total'
                          ? totalPaymentAmount
                          : parseFloat(manualAmount) || 0
                      )}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                      manualPaymentOption === 'minimo'
                        ? 'bg-accent-blue/15 text-accent-blue'
                        : manualPaymentOption === 'total'
                        ? 'bg-accent-green/15 text-accent-green'
                        : 'bg-accent-purple/15 text-accent-purple'
                    }`}>
                      {manualPaymentOption === 'minimo' ? 'Mínimo' : manualPaymentOption === 'total' ? 'Total' : 'Abono'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Comprobante/Captura & Fecha de Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Comprobante / Captura
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      id="manual-capture-upload"
                      onChange={(e) => setManualCapture(e.target.files?.[0] || null)}
                      className="hidden"
                      accept="image/*,.pdf"
                    />
                    <label
                      htmlFor="manual-capture-upload"
                      className="glass-input h-14 flex items-center justify-between px-4 rounded-xl border border-glass-border bg-glass-primary/50 text-text-primary cursor-pointer hover:border-accent-blue/50 transition-all select-none w-full"
                    >
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4 text-accent-blue" />
                        {manualCapture ? 'Archivo seleccionado' : 'Seleccionar comprobante'}
                      </span>
                      <span className="text-xs text-text-muted italic truncate max-w-[180px] sm:max-w-[240px]">
                        {manualCapture ? manualCapture.name : 'Subir archivo'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent-blue" /> Fecha de Pago
                  </label>
                  <Input
                    type="date"
                    value={manualPaymentDate}
                    onChange={(e) => setManualPaymentDate(e.target.value)}
                    className="glass-input h-12 text-lg"
                    required
                  />
                </div>
              </div>

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <label className="block text-sm font-medium text-text-primary mb-2">OBSERVACIONES</label>
                <textarea
                  value={manualObservations}
                  onChange={(e) => setManualObservations(e.target.value)}
                  className="glass-input w-full px-4 py-3"
                  rows={2}
                  placeholder="Detalles sobre transferencia, número de operación, etc."
                />
              </div>

              {pendingQuotas.length > 0 && (
                <div className="space-y-4">
                  
                  {/* Read-only pending quotas list for reference */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Resumen de Cuotas Pendientes
                    </p>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {pendingQuotas.map((quota: any) => (
                        <div
                          key={quota._id}
                          className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-glass-primary/5 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${quota.number === 0 ? 'bg-accent-green/20 text-accent-green' : quota.type === 'inicial' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-accent-blue/20 text-accent-blue'}`}>
                              {quota.number === 0 ? 'S' : `#${quota.number}`}
                            </div>
                            <div>
                              <p className="font-bold text-text-primary">
                                {quota.number === 0 ? 'Separación' : quota.type === 'inicial' ? 'Cuota Inicial' : 'Cuota Ordinaria'}
                              </p>
                              <p className="text-text-muted">Vence: {dayjs(quota.dueDate).format('DD/MM/YYYY')}</p>
                            </div>
                          </div>
                          <div className="text-right font-bold text-text-primary">
                            {formatCurrency(quota.value - (quota.amountPaid || 0))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-accent-green text-white hover:bg-accent-green/85 h-14 shadow-lg shadow-accent-green/10 text-base font-bold rounded-2xl flex items-center justify-center gap-2 mt-4"
                    onClick={handleRegisterManualPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registrando Pago...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5" />
                        Registrar y Aprobar Pago
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-glass-border">
            <Button
              variant="outline"
              onClick={() => setIsManualModalOpen(false)}
              className="glass-button"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Siigo Export Modal */}
      <Modal
        isOpen={isSiigoModalOpen}
        onClose={() => setIsSiigoModalOpen(false)}
        title="Exportar Pagos a Siigo"
        size="lg"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          <p className="text-sm text-text-secondary">
            Este reporte genera un archivo Excel con la estructura de Comprobantes Contables (Recibos de Caja) de Siigo para los pagos que se encuentran en estado <strong>APROBADO</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={siigoStartDate}
                onChange={(e) => setSiigoStartDate(e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={siigoEndDate}
                onChange={(e) => setSiigoEndDate(e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="border-t border-glass-border pt-4">
            <h3 className="text-sm font-bold text-text-primary mb-3">Configuración de Cuentas Contables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Tipo de Comprobante
                </label>
                <Input
                  type="text"
                  value={siigoComprobante}
                  onChange={(e) => setSiigoComprobante(e.target.value)}
                  className="glass-input"
                  placeholder="Ej: 14"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Centro de Costos
                </label>
                <Input
                  type="text"
                  value={siigoCentroCostos}
                  onChange={(e) => setSiigoCentroCostos(e.target.value)}
                  className="glass-input"
                  placeholder="Ej: 001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Cuenta de Cartera (Clientes)
                </label>
                <Input
                  type="text"
                  value={siigoCuentaCartera}
                  onChange={(e) => setSiigoCuentaCartera(e.target.value)}
                  className="glass-input"
                  placeholder="Ej: 13050502"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                  Cuenta de Banco por Defecto
                </label>
                <Input
                  type="text"
                  value={siigoDefaultBanco}
                  onChange={(e) => setSiigoDefaultBanco(e.target.value)}
                  className="glass-input"
                  placeholder="Ej: 11200501"
                />
              </div>
            </div>
          </div>

          {/* Configuración de bancos de la empresa */}
          {siigoBankAccounts.length > 0 && (
            <div className="border-t border-glass-border pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-text-primary">
                  Cuentas de Siigo por Banco
                </h3>
                <span className="text-[10px] text-text-muted italic">
                  * Se guardarán en el perfil del proyecto
                </span>
              </div>
              <div className="space-y-3 bg-glass-primary/10 rounded-xl p-3 border border-glass-border/30">
                {siigoBankAccounts.map((acc, index) => (
                  <div key={acc._id || index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-glass-border/10 pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-text-primary">{acc.banco}</p>
                      <p className="text-[10px] text-text-muted">{acc.tipoCuenta} - {acc.numeroCuenta}</p>
                    </div>
                    <div className="w-full sm:w-44">
                      <Input
                        type="text"
                        placeholder="Cuenta Siigo (Ej: 11100501)"
                        value={acc.accountingAccount || ''}
                        onChange={(e) => {
                          const updated = [...siigoBankAccounts]
                          updated[index] = { ...updated[index], accountingAccount: e.target.value }
                          setSiigoBankAccounts(updated)
                        }}
                        className="glass-input text-xs py-1 px-2 h-8"
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!selectedCompanyId) {
                      toast.error('No se ha seleccionado ninguna compañía');
                      return;
                    }
                    try {
                      setIsProcessing(true);
                      const response = await adminApi.updateCompany(selectedCompanyId, {
                        bankAccounts: siigoBankAccounts
                      });
                      if (response.data.success) {
                        toast.success('Cuentas contables de los bancos guardadas exitosamente');
                        setCompanyDetails(response.data.data.company);
                      }
                    } catch (error) {
                      toast.error('Error al guardar cuentas bancarias');
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  className="w-full py-1 text-xs glass-button"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Guardando...' : 'Guardar Cuentas Bancarias'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
            <Button
              variant="outline"
              onClick={() => setIsSiigoModalOpen(false)}
              className="glass-button"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  setSiigoIsExporting(true);
                  const response = await adminApi.exportSiigoPayments(siigoStartDate, siigoEndDate, {
                    comprobanteTipo: siigoComprobante,
                    cuentaCartera: siigoCuentaCartera,
                    centroCostos: siigoCentroCostos,
                    defaultCuentaBanco: siigoDefaultBanco
                  });
                  
                  const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `siigo-pagos-${siigoStartDate}-a-${siigoEndDate}.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast.success('Reporte exportado exitosamente');
                  setIsSiigoModalOpen(false);
                } catch (error) {
                  toast.error('Error al exportar pagos');
                } finally {
                  setSiigoIsExporting(false);
                }
              }}
              disabled={siigoIsExporting}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 font-bold"
            >
              {siigoIsExporting ? 'Exportando...' : 'Descargar Excel'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Payment Link / QR Modal */}
      <SharePaymentModal
        isOpen={isSharePaymentModalOpen}
        onClose={() => setIsSharePaymentModalOpen(false)}
        url={getPaymentUrl()}
        title="Compartir Portal de Pagos con Cliente"
        subtitle="Permite a tus clientes consultar sus cuotas pendientes, realizar pagos o subir comprobantes de consignación."
      />
    </div>
  )
}