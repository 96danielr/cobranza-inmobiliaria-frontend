'use client'

import { Download, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Payment } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PaymentCardProps {
  payment: Payment
  onDownloadReceipt: (paymentId: string) => void
  downloadingReceipt: string | null
}

export function PaymentCard({ 
  payment, 
  onDownloadReceipt,
  downloadingReceipt 
}: PaymentCardProps) {
  const getStatusConfig = () => {
    switch (payment.status) {
      case 'APROBADO':
        return {
          variant: 'success' as const,
          icon: CheckCircle,
          text: 'Aprobado ✓',
          bgColor: 'bg-green-50 border-green-200'
        }
      case 'RECHAZADO':
        return {
          variant: 'danger' as const,
          icon: AlertCircle,
          text: 'Rechazado ✗',
          bgColor: 'bg-red-50 border-red-200'
        }
      case 'PENDIENTE':
      default:
        return {
          variant: 'warning' as const,
          icon: Clock,
          text: 'En revisión',
          bgColor: 'bg-yellow-50 border-yellow-200'
        }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      payment.status === 'RECHAZADO' ? 'border-red-200' : ''
    }`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Lote Mz{payment.contract.lot.manzana}-{payment.contract.lot.nomenclatura}
            </h3>
            <p className="text-sm text-gray-600">
              {payment.contract.lot.project.name}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center">
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.text}
          </Badge>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Cuota</p>
            <p className="font-semibold">#{payment.cuotaNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monto</p>
            <p className="font-semibold text-primary">
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha de Pago</p>
            <p className="font-semibold">
              {formatDate(payment.fechaPago)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Banco</p>
            <p className="font-semibold">{payment.banco}</p>
          </div>
        </div>

        {/* Status-specific Content */}
        {payment.status === 'APROBADO' && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadReceipt(payment.id)}
              loading={downloadingReceipt === payment.id}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Recibo
            </Button>
          </div>
        )}

        {payment.status === 'RECHAZADO' && payment.observacion && (
          <div className="mb-4 p-3 bg-accent-red/15 border border-accent-red/20 rounded-xl">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-accent-red mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-accent-red mb-1">
                  Motivo del rechazo:
                </p>
                <p className="text-sm text-text-secondary">
                  {payment.observacion}
                </p>
              </div>
            </div>
          </div>
        )}

        {payment.status === 'PENDIENTE' && (
          <div className="mb-4 p-3 bg-accent-yellow/15 border border-accent-yellow/20 rounded-xl">
            <div className="flex items-start">
              <Clock className="w-4 h-4 text-accent-yellow mt-0.5 mr-2" />
              <p className="text-sm text-text-secondary">
                Estamos revisando tu comprobante. Te notificaremos cuando esté listo.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Reportado el {formatDate(payment.createdAt, 'DD/MM/YYYY HH:mm')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}