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
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatsCardSkeleton, TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PaymentCard, PaymentCardSkeleton } from '@/components/ui/PaymentCard'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
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
}


export default function PaymentsPage() {
  const { isAuthenticated } = useAdminAuthStore()
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'PAGADO' | 'MORA'>('ALL')
  const [isProcessing, setIsProcessing] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  // Fetch payments with server-side pagination — same pattern as Clients page
  const fetchPayments = useCallback(async (page: number, limit: number, search?: string) => {
    try {
      const response = await adminApi.getPayments(page, limit, search, statusFilter)
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
      console.error('Error fetching payments:', error)
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
      setSelectedPayment(null)
      setObservacion('')
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Error al aprobar el pago')
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
      console.error('Error rejecting payment:', error)
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
    <div className="flex flex-col h-full space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Aprobación de Pagos</h1>
          <p className="text-text-secondary mt-2">
            Revisa y aprueba los comprobantes de pago reportados por los clientes 
            {!pagination.loading && `(${pagination.total.toLocaleString('es-CO')} cuotas total)`}
          </p>
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
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-glass-border">
          <div className="hidden lg:block bg-glass-primary/30 backdrop-blur-glass">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Cliente</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Proyecto/Lote</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary"># Cuota</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Monto</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Banco</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Fecha</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Estado</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Acciones</th>
                </tr>
              </thead>
            </table>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[400px]">
          <table className="hidden lg:table w-full">
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
            <div>
              <h3 className="font-medium text-text-primary mb-3">Comprobante de Pago</h3>
              <div className="border border-glass-border rounded-lg p-4 bg-glass-primary/20 backdrop-blur-glass">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-6 h-6 text-text-muted mr-2" />
                    <span className="text-text-secondary">Comprobante de pago</span>
                  </div>
                  <Button variant="glass" size="sm" className="glass-button">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            </div>

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
                      Pago {selectedPayment.status}
                    </span>
                  </div>
                  {selectedPayment.observacion && (
                    <p className="mt-2 text-sm">{selectedPayment.observacion}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}