'use client'

import { useRouter } from 'next/navigation'
import { MapPin, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Contract } from '@/types'
import { formatCurrency, getVencimientoColor } from '@/lib/utils'

interface ContractCardProps {
  contract: Contract
}

export function ContractCard({ contract }: ContractCardProps) {
  const router = useRouter()
  
  const vencimientoInfo = getVencimientoColor(
    contract.proximoVencimiento, 
    contract.diasMora
  )

  const handleViewDetails = () => {
    router.push(`/contract/${contract.id}`)
  }

  const handleReportPayment = () => {
    router.push(`/report-payment?contractId=${contract.id}`)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Manzana {contract.lote.manzana} - Lote {contract.lote.nomenclatura}
            </h3>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {contract.lote.proyecto}
            </div>
          </div>
          <Badge className={vencimientoInfo.color}>
            {vencimientoInfo.text}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <ProgressBar
            value={contract.porcentajePagado}
            label="Progreso de pago"
            showLabel
          />
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(contract.valorTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pagado</p>
            <p className="font-semibold text-green-600">
              {formatCurrency(contract.totalPagado)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pendiente</p>
            <p className="font-semibold text-red-600">
              {formatCurrency(contract.totalPendiente)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cuota Mensual</p>
            <p className="font-semibold text-primary">
              {formatCurrency(contract.valorCuota)}
            </p>
          </div>
        </div>

        {/* Cuotas Info */}
        <div className="flex items-center justify-between mb-4 p-3 bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-xl">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium">
              {contract.cuotasPagadas} de {contract.totalCuotas} cuotas
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Día de pago</p>
            <p className="font-semibold">{contract.diaPago}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="flex-1"
          >
            Ver Detalle
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleReportPayment}
            className="flex-1"
          >
            Reportar Pago
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}