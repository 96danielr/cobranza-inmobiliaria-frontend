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
  ExternalLink
} from 'lucide-react'
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

interface PendingPayment {
  id: string
  contractId: string
  cuotaNumber: number
  amount: string | number
  banco: string
  fechaPago: string
  comprobante?: string | null
  createdAt: string
  status: 'PENDIENTE' | 'PAGADO' | 'MORA'
  observacion?: string
  contract: {
    client: {
      fullName: string
      cedula: string
      phone: string
    }
    lot: {
      manzana: string
      nomenclatura: string
      project: {
        name: string
      }
    }
  }
  receiptUrl?: string
}


export default function PaymentsPage() {
  const { isAuthenticated } = useAdminAuthStore()
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'PAGADO' | 'MORA'>('ALL')
  const [isProcessing, setIsProcessing] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  // Manual Payment State
  const { clients, fetchClientsIfNeeded } = useClientStore()
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clientDetails, setClientDetails] = useState<any>(null)
  const [selectedContractId, setSelectedContractId] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  // Manual Payment Form State
  const [manualAmount, setManualAmount] = useState('')
  const [manualBank, setManualBank] = useState('')
  const [manualObservations, setManualObservations] = useState('')
  const [manualCapture, setManualCapture] = useState<File | null>(null)
  const [companySlug, setCompanySlug] = useState('')
  const [banks, setBanks] = useState<any[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)

  const { selectedCompanyId } = useAdminAuthStore()

  useEffect(() => {
    const fetchCompany = async () => {
      if (selectedCompanyId) {
        try {
          const res = await adminApi.getCompany(selectedCompanyId)
          if (res.data.success) {
            setCompanySlug(res.data.data.company.slug)
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
      const response = await adminApi.getBanks(1, 1000) // Get all banks
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
    initialLimit: 20
  })

  const refresh = () => pagination.refresh()


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
    setObservacion(payment.observacion || '')
    setIsModalOpen(true)
  }

  const handleApprovePayment = async (paymentId: string) => {
    setIsProcessing(true)
    try {
      await adminApi.approvePayment(paymentId)

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
      toast.success('Link público copiado: ' + link, { duration: 4000 })
    } catch (err) {
      // Fallback for non-secure contexts if needed

      toast.error('Haga clic derecho y copie: ' + link)
    }
  }

  const handleCopyReceiptLink = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Enlace del recibo copiado')
  }

  const handleRegisterManualPayment = async (quotaId: string, quotaValue: number) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('quotaId', quotaId)
      formData.append('amount', manualAmount || quotaValue.toString())
      formData.append('bank', manualBank)
      formData.append('observations', manualObservations)
      if (manualCapture) {
        formData.append('capture', manualCapture)
      }
      formData.append('paymentDate', new Date().toISOString())

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

      refresh()
    } catch (error) {

      toast.error('Error al registrar el pago')
    } finally {
      setIsProcessing(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
      case 'PAGADO':
        return 'text-accent-green bg-accent-green/20 border-accent-green/30'
      case 'MORA':
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
    <div className="flex flex-col min-h-full space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Aprobación de Pagos</h1>
          <p className="text-text-secondary mt-2">
            Revisa y aprueba los comprobantes de pago reportados por los clientes
            {!pagination.loading && `(${pagination.total.toLocaleString('es-CO')} cuotas total)`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="glass-button border-glass-border text-text-secondary min-h-[44px]"
            onClick={copyPaymentLink}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Copiar Link Público
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
            <Card variant="elevated">
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

            <Card variant="elevated">
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

            <Card variant="elevated">
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

        <div className="flex-1 overflow-auto min-h-[400px] lg:min-h-[500px] lg:max-h-[600px] xl:max-h-[calc(100vh-350px)] xl:max-w-[900px] 2xl:max-w-[1560px] relative">
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
                    <p className="text-xs text-text-muted">Mz {payment.contract?.lot?.manzana || '-'} Lote {payment.contract?.lot?.nomenclatura || '-'}</p>
                  </td>
                  <td className="py-4 px-6 text-text-primary font-medium">#{payment.cuotaNumber}</td>
                  <td className="py-4 px-6 text-text-primary font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="py-4 px-6 text-text-secondary text-sm">{payment.banco}</td>
                  <td className="py-4 px-6 text-text-secondary text-sm">{dayjs(payment.fechaPago).format('DD/MM/YYYY')}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button variant="glass" size="sm" onClick={() => handleViewPayment(payment)} className="glass-button">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {payment.receiptUrl && (
                        <div className="flex gap-1">
                          <Button
                            variant="glass"
                            size="sm"
                            className="glass-button text-accent-green hover:bg-accent-green/20"
                            onClick={() => window.open(payment.receiptUrl, '_blank')}
                            title="Ver Recibo"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="glass"
                            size="sm"
                            className="glass-button text-accent-blue hover:bg-accent-blue/20"
                            onClick={() => payment.receiptUrl && handleCopyReceiptLink(payment.receiptUrl)}
                            title="Copiar Link de Recibo"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {payment.status === 'PENDIENTE' && (
                        <>
                          <Button
                            variant="glass"
                            size="sm"
                            className="glass-button text-accent-green hover:bg-accent-green/20"
                            onClick={() => handleApprovePayment(payment.id)}
                            disabled={isProcessing}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="glass"
                            size="sm"
                            className="glass-button text-accent-red hover:bg-accent-red/20"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
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
                    {selectedPayment.contract.lot.project.name} - Mz {selectedPayment.contract.lot.manzana} #{selectedPayment.contract.lot.nomenclatura}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Información del Pago</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Cuota Número</p>
                  <p className="font-medium text-text-primary">#{selectedPayment.cuotaNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Monto</p>
                  <p className="font-medium text-text-primary text-lg">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
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
                <h3 className="font-medium text-text-primary mb-3">Comprobante de Pago</h3>
                <div className="border border-glass-border rounded-lg p-4 bg-glass-primary/20 backdrop-blur-glass overflow-hidden">
                  {selectedPayment.comprobante.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                    <div className="relative group">
                      <img
                        src={selectedPayment.comprobante}
                        alt="Comprobante"
                        className="w-full h-auto rounded-lg shadow-lg cursor-zoom-in group-hover:scale-[1.02] transition-transform duration-300"
                        onClick={() => window.open(selectedPayment.comprobante || '', '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-6 h-6 text-text-muted mr-2" />
                        <span className="text-text-secondary truncate max-w-[200px]">
                          Comprobante ({selectedPayment.comprobante.split('/').pop()})
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex justify-end">
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
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
        }}
        title="Registrar Pago Manual"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 p-3 bg-accent-blue/10 rounded-lg border border-accent-blue/20">
              <User className="w-5 h-5 text-accent-blue" />
              <p className="text-sm font-medium text-accent-blue">Paso 1: Seleccione el cliente</p>
            </div>
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
              <div className="flex items-center gap-2 mb-2 p-3 bg-accent-purple/10 rounded-lg border border-accent-purple/20">
                <FileText className="w-5 h-5 text-accent-purple" />
                <p className="text-sm font-medium text-accent-purple">Paso 2: Complete los detalles del pago</p>
              </div>

              {clientDetails.contracts?.length > 1 && (
                <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                  <label className="block text-sm font-medium text-text-primary mb-3">CONTRATO / LOTE</label>
                  <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-lg"
                  >
                    {clientDetails.contracts.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.negotiation || 'Contrato'} - Mz {c.lotId?.manzana || '-'} Lote {c.lotId?.nomenclatura || '-'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Banco
                  </label>
                  <Combobox
                    options={banks.map(b => ({ value: b.acronym, label: b.acronym }))}
                    value={manualBank}
                    onChange={setManualBank}
                    placeholder="Seleccione un banco..."
                    searchPlaceholder="Buscar banco..."
                    className="h-12"
                  />
                  {loadingBanks && <p className="text-[10px] text-text-muted mt-1 animate-pulse">Cargando bancos...</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Monto Pagado (Opcional)
                  </label>
                  <Input
                    type="number"
                    placeholder="Valor total por defecto"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="glass-input h-12"
                  />
                </div>
              </div>

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Comprobante / Captura
                </label>
                <div className="relative group">
                  <Input
                    type="file"
                    onChange={(e) => setManualCapture(e.target.files?.[0] || null)}
                    className="glass-input h-14 pt-3 flex-1 file:hidden cursor-pointer"
                    accept="image/*,.pdf"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-text-muted italic">
                    {manualCapture ? manualCapture.name : 'Subir archivo (opcional)'}
                  </div>
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

              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-accent-green/10 rounded-lg border border-accent-green/20">
                  <CheckCircle className="w-5 h-5 text-accent-green" />
                  <p className="text-sm font-medium text-accent-green">Paso 3: Seleccione la cuota que está pagando</p>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {clientDetails.contracts
                    .find((c: any) => c._id === selectedContractId)
                    ?.quotas?.filter((q: any) => q.status !== 'pagado')
                    .sort((a: any, b: any) => {
                      if (a.type === 'inicial' && b.type !== 'inicial') return -1;
                      if (a.type !== 'inicial' && b.type === 'inicial') return 1;
                      return a.number - b.number;
                    })
                    .map((quota: any) => (
                      <div
                        key={quota._id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-glass-border bg-glass-primary/10 hover:bg-glass-primary/20 transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${quota.type === 'inicial' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-accent-blue/20 text-accent-blue'}`}>
                            <span className="font-bold">#{quota.number}</span>
                          </div>
                          <div>
                            <p className={`font-bold ${quota.type === 'inicial' ? 'text-accent-purple' : 'text-text-primary'}`}>
                              {quota.type === 'inicial' ? 'Cuota Inicial' : 'Cuota Ordinaria'}
                            </p>
                            <p className="text-sm text-text-muted">Vence: {dayjs(quota.dueDate).format('DD/MM/YYYY')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <span className="text-xl font-bold text-text-primary">{formatCurrency(quota.value)}</span>
                          <Button
                            size="lg"
                            className="bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/40 px-6 h-12 shadow-md shadow-accent-green/10"
                            onClick={() => handleRegisterManualPayment(quota._id, quota.value)}
                            disabled={isProcessing}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Pagar
                          </Button>
                        </div>
                      </div>
                    ))}
                  {clientDetails.contracts
                    .find((c: any) => c._id === selectedContractId)
                    ?.quotas?.filter((q: any) => q.status !== 'pagado').length === 0 && (
                      <p className="text-center py-4 text-text-muted">No hay cuotas pendientes para este contrato.</p>
                    )}
                </div>
              </div>
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
    </div>
  )
}