'use client'

import { useState, useEffect } from 'react'
import { CreditCard, FileText, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

import { apiClient } from '@/lib/api'
import { PaymentHistory, Payment } from '@/types'

import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/LoadingSpinner'
import { PaymentCard } from '@/components/payments/PaymentCard'

type PaymentStatus = 'ALL' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

export default function PaymentsPage() {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory | null>(null)
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<PaymentStatus>('ALL')
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null)

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    if (paymentHistory) {
      filterPayments(activeFilter)
    }
  }, [paymentHistory, activeFilter])

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getPayments(1, 50) // Load first 50 payments
      
      if (response.data.success) {
        setPaymentHistory(response.data.data)
      } else {
        toast.error('Error cargando historial de pagos')
      }
    } catch (error: any) {
      toast.error('Error de conexión')
      console.error('Error loading payments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPayments = (status: PaymentStatus) => {
    if (!paymentHistory) return

    let filtered = paymentHistory.payments
    
    if (status !== 'ALL') {
      filtered = paymentHistory.payments.filter(payment => payment.status === status)
    }

    setFilteredPayments(filtered)
  }

  const handleFilterChange = (status: PaymentStatus) => {
    setActiveFilter(status)
  }

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      setDownloadingReceipt(paymentId)
      
      const response = await apiClient.downloadReceipt(paymentId)
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `recibo-${paymentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Recibo descargado exitosamente')
    } catch (error: any) {
      toast.error('Error descargando el recibo')
      console.error('Error downloading receipt:', error)
    } finally {
      setDownloadingReceipt(null)
    }
  }

  const handleReportPayment = () => {
    window.location.href = '/report-payment'
  }

  const getFilterCounts = () => {
    if (!paymentHistory) return { all: 0, pendiente: 0, aprobado: 0, rechazado: 0 }

    const payments = paymentHistory.payments
    return {
      all: payments.length,
      pendiente: payments.filter(p => p.status === 'PENDIENTE').length,
      aprobado: payments.filter(p => p.status === 'APROBADO').length,
      rechazado: payments.filter(p => p.status === 'RECHAZADO').length
    }
  }

  const filterCounts = getFilterCounts()

  const filterTabs = [
    { key: 'ALL' as PaymentStatus, label: 'Todos', count: filterCounts.all },
    { key: 'PENDIENTE' as PaymentStatus, label: 'Pendientes', count: filterCounts.pendiente },
    { key: 'APROBADO' as PaymentStatus, label: 'Aprobados', count: filterCounts.aprobado },
    { key: 'RECHAZADO' as PaymentStatus, label: 'Rechazados', count: filterCounts.rechazado }
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up">
        <div className="flex items-center">
          <CreditCard className="w-6 h-6 text-accent-blue mr-3" />
          <div>
            <h1 className="text-responsive-lg font-bold text-text-primary">
              Mis Pagos
            </h1>
            <p className="text-text-secondary text-responsive-base">
              Historial completo de tus pagos reportados
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleReportPayment}
          className="hidden sm:flex glass-button min-h-[44px] touch-target"
        >
          <Plus className="w-4 h-4 mr-2" />
          Reportar Pago
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-fade-in-up">
          {/* Skeleton Filters */}
          <CardSkeleton lines={1} />
          
          {/* Skeleton Payment Cards */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} lines={4} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="mb-6 animate-fade-in-up-delay">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 flex items-center min-h-[44px] touch-target ${
                    activeFilter === tab.key
                      ? 'bg-accent-blue text-white shadow-glow'
                      : 'glass-button text-text-primary hover:bg-glass-secondary'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge 
                      className={`ml-2 ${
                        activeFilter === tab.key
                          ? 'bg-white/20 text-white'
                          : 'badge-info'
                      }`}
                      size="sm"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Payment List */}
          {filteredPayments.length > 0 ? (
            <div className="space-y-4 animate-fade-in-up-delay-2">
              {filteredPayments.map((payment, index) => (
                <div key={payment.id} className={`animate-fade-in-up-delay-${Math.min(index, 3)}`}>
                  <PaymentCard
                    payment={payment}
                    onDownloadReceipt={handleDownloadReceipt}
                    downloadingReceipt={downloadingReceipt}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Card variant="elevated" className="glass-card animate-fade-in-up-delay-2">
              <CardContent className="p-8 md:p-12 text-center">
                <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-responsive-base font-medium text-text-primary mb-2">
                  {activeFilter === 'ALL' 
                    ? 'Aún no tienes pagos registrados'
                    : `No tienes pagos ${activeFilter.toLowerCase()}`
                  }
                </h3>
                <p className="text-text-secondary mb-6">
                  {activeFilter === 'ALL'
                    ? 'Reporta tu primer pago para comenzar a ver tu historial aquí.'
                    : `Cuando tengas pagos ${activeFilter.toLowerCase()} aparecerán en esta sección.`
                  }
                </p>
                <Button onClick={handleReportPayment} className="glass-button min-h-[44px] touch-target">
                  <Plus className="w-4 h-4 mr-2" />
                  Reportar Primer Pago
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Load More Button - For future pagination */}
          {paymentHistory && paymentHistory.pagination.pages > 1 && (
            <div className="mt-6 text-center animate-fade-in-up-delay-3">
              <Button variant="outline" className="glass-button min-h-[44px] touch-target">
                Cargar Más Pagos
              </Button>
            </div>
          )}
        </>
      )}

      {/* Mobile Report Payment Button */}
      <div className="fixed bottom-20 left-4 right-4 sm:hidden">
        <Button
          onClick={handleReportPayment}
          className="w-full glass-button shadow-glow"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Reportar Pago
        </Button>
      </div>
    </div>
  )
}