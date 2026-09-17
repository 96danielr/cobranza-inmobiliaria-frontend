'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, TrendingUp, CreditCard, Download } from 'lucide-react'
import toast from 'react-hot-toast'

import { apiClient } from '@/lib/api'
import { ContractDetail } from '@/types'
import { formatCurrency, formatDate, getVencimientoColor } from '@/lib/utils'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { FullPageLoading, CardSkeleton } from '@/components/ui/LoadingSpinner'
import { PlanPagosTable } from '@/components/contract/PlanPagosTable'
import { formatPropertyUnit, PropertyType } from '@/lib/propertyTypes'

export default function ContractDetailPage() {
  const [contractDetail, setContractDetail] = useState<ContractDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  useEffect(() => {
    if (contractId) {
      loadContractDetail()
    }
  }, [contractId])

  const loadContractDetail = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getContract(contractId)
      
      if (response.data.success) {
        setContractDetail(response.data.data)
      } else {
        toast.error('Error cargando el detalle del contrato')
        router.push('/portal/lots')
      }
    } catch (error: any) {
      toast.error('Error de conexión')
      router.push('/portal/lots')
    } finally {
      setIsLoading(false)
    }
  }

  const [downloadingStatement, setDownloadingStatement] = useState(false)

  const handleDownloadStatement = async () => {
    try {
      setDownloadingStatement(true)
      const response = await apiClient.downloadStatement(contractId)
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const lotInfo = `Mz${contractDetail?.lote?.manzana || ''}-${contractDetail?.lote?.nomenclatura || ''}`
      link.download = `estado_cuenta-${lotInfo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Estado de cuenta descargado exitosamente')
    } catch (error: any) {
      toast.error('Error al descargar el estado de cuenta')
      console.error('Error downloading statement:', error)
    } finally {
      setDownloadingStatement(false)
    }
  }

  const handleGoBack = () => {
    router.push('/portal/lots')
  }

  const handleReportPayment = () => {
    router.push(`/portal/report-payment?contractId=${contractId}`)
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
        <CardSkeleton lines={2} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
        <CardSkeleton lines={5} />
      </div>
    )
  }

  if (!contractDetail) {
    return null
  }

  const proximaCuota = contractDetail.cuotasPagadas + 1
  const proximoVencimiento = contractDetail.planPagos
    .find(cuota => cuota.numero === proximaCuota)?.fechaVencimiento

  const diasMora = proximoVencimiento ? 
    Math.max(0, Math.floor((new Date().getTime() - new Date(proximoVencimiento).getTime()) / (1000 * 3600 * 24))) : 0

  const vencimientoInfo = getVencimientoColor(proximoVencimiento || null, diasMora)

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="glass-button min-h-[44px] touch-target"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <Button
            onClick={handleDownloadStatement}
            loading={downloadingStatement}
            className="glass-button text-xs font-bold uppercase tracking-wider min-h-[44px] touch-target"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Estado
          </Button>
        </div>
        
        <div>
          <h1 className="text-responsive-lg font-bold text-text-primary">
            {formatPropertyUnit({
              propertyType: (contractDetail.propertyType || contractDetail.lote.propertyType || 'lotes') as PropertyType,
              lotNumber: contractDetail.lote.lotNumber || contractDetail.lote.nomenclatura,
              manzana: contractDetail.lote.manzana,
              tower: contractDetail.lote.tower,
              floor: contractDetail.lote.floor,
              nomenclature: contractDetail.lote.nomenclatura
            })}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-text-secondary">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-accent-blue" />
              {contractDetail.lote.proyecto}
            </div>
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-accent-green" />
              Área: {contractDetail.lote.areaTotalM2} m²
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      <div className="mb-6 animate-fade-in-up-delay">
        <h2 className="text-responsive-base font-semibold text-text-primary mb-4">
          Resumen Financiero
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated" className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-text-secondary mb-1">Valor Total</p>
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(contractDetail.valorTotal)}
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-text-secondary mb-1">Total Pagado</p>
              <p className="text-lg font-bold text-accent-green">
                {formatCurrency(contractDetail.totalPagado)}
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-text-secondary mb-1">Saldo Pendiente</p>
              <p className={`text-lg font-bold ${
                diasMora > 0 ? 'text-accent-red' : 'text-text-primary'
              }`}>
                {formatCurrency(contractDetail.valorTotal - contractDetail.totalPagado)}
              </p>
            </CardContent>
          </Card>

          <Card variant="elevated" className="glass-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-text-secondary mb-1">Progreso</p>
              <div className="mt-2">
                <ProgressBar
                  value={contractDetail.porcentajePagado}
                  showLabel
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información Adicional */}
        <Card variant="elevated" className="glass-card">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div>
                <p className="text-sm text-text-secondary">Cuota Mensual</p>
                <p className="text-xl font-bold text-accent-blue">
                  {formatCurrency(contractDetail.valorCuota)}
                </p>
              </div>

              <div>
                <p className="text-sm text-text-secondary">Día de Pago</p>
                <p className="text-lg font-semibold text-text-primary">
                  {contractDetail.diaPago} de cada mes
                </p>
              </div>

              <div>
                <p className="text-sm text-text-secondary">Cuotas Pagadas</p>
                <p className="text-lg font-semibold text-text-primary">
                  {contractDetail.cuotasPagadas} de {contractDetail.totalCuotas}
                </p>
              </div>

              {proximoVencimiento && (
                <div>
                  <p className="text-sm text-text-secondary">Próximo Vencimiento</p>
                  <Badge className={`${vencimientoInfo.color} glass-button`}>
                    {vencimientoInfo.text}
                  </Badge>
                </div>
              )}

              {diasMora > 0 && (
                <div>
                  <p className="text-sm text-text-secondary">Días de Mora</p>
                  <Badge variant="danger" className="badge-danger">
                    {diasMora} días
                  </Badge>
                </div>
              )}

              <div>
                <p className="text-sm text-text-secondary">Estado del Contrato</p>
                <Badge 
                  variant={contractDetail.status === 'ACTIVO' ? 'success' : 'default'}
                  className={contractDetail.status === 'ACTIVO' ? 'badge-success' : 'badge-info'}
                >
                  {contractDetail.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan de Pagos */}
      <div className="mb-6 animate-fade-in-up-delay-2">
        <h2 className="text-responsive-base font-semibold text-text-primary mb-4">
          Plan de Pagos Completo
        </h2>
        
        <div className="glass-card">
          <PlanPagosTable 
            cuotas={contractDetail.planPagos}
            contractId={contractId}
            proximaCuota={proximaCuota}
          />
        </div>
      </div>

      {/* Botón Fijo Mobile */}
      <div className="fixed bottom-20 left-4 right-4 md:hidden">
        <Button
          onClick={handleReportPayment}
          className="w-full glass-button shadow-glow"
          size="lg"
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Reportar Pago
        </Button>
      </div>
    </div>
  )
}