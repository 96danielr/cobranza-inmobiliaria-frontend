'use client'

import { useState } from 'react'
import { Download, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Cuota } from '@/types'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import toast from 'react-hot-toast'

interface PlanPagosTableProps {
  cuotas: Cuota[]
  contractId: string
  proximaCuota?: number
}

export function PlanPagosTable({ 
  cuotas, 
  contractId, 
  proximaCuota 
}: PlanPagosTableProps) {
  const [downloadingReceipt, setDownloadingReceipt] = useState<number | null>(null)

  const handleDownloadReceipt = async (cuotaNumber: number) => {
    // This would need the payment ID, but for now we'll show a placeholder
    toast.error('Funcionalidad en desarrollo')
  }

  const handlePayNow = (cuotaNumber: number) => {
    window.location.href = `/report-payment?contractId=${contractId}&cuota=${cuotaNumber}`
  }

  const getActionButton = (cuota: Cuota) => {
    switch (cuota.status) {
      case 'PAGADA':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadReceipt(cuota.numero)}
            loading={downloadingReceipt === cuota.numero}
          >
            <Download className="w-4 h-4 mr-1" />
            Recibo
          </Button>
        )
      case 'VENCIDA':
        return (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handlePayNow(cuota.numero)}
          >
            <CreditCard className="w-4 h-4 mr-1" />
            Pagar
          </Button>
        )
      default:
        return <span className="text-text-muted text-sm">-</span>
    }
  }

  const getStatusBadge = (cuota: Cuota) => {
    const baseClass = getStatusColor(cuota.status)
    
    switch (cuota.status) {
      case 'PAGADA':
        return (
          <Badge className={baseClass}>
            Pagada ✓
          </Badge>
        )
      case 'VENCIDA':
        const diasVencida = Math.floor(
          (new Date().getTime() - new Date(cuota.fechaVencimiento).getTime()) 
          / (1000 * 3600 * 24)
        )
        return (
          <Badge className={baseClass}>
            Vencida ({diasVencida} días)
          </Badge>
        )
      case 'PENDIENTE':
        return (
          <Badge className={baseClass}>
            Pendiente
          </Badge>
        )
      default:
        return (
          <Badge className={baseClass}>
            {cuota.status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border bg-glass-primary/30">
                    <th className="text-left py-3 px-4 font-medium text-text-primary">#</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Fecha Esperada</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Valor</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-text-primary">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.map((cuota) => {
                    const isProximaCuota = proximaCuota === cuota.numero
                    
                    return (
                      <tr 
                        key={cuota.numero}
                        className={`border-b border-glass-border/50 hover:bg-glass-secondary ${
                          isProximaCuota ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            isProximaCuota ? 'text-blue-600' : 'text-text-primary'
                          }`}>
                            {cuota.numero}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-primary">
                          {formatDate(cuota.fechaVencimiento)}
                          {cuota.fechaPago && (
                            <div className="text-xs text-green-600">
                              Pagada: {formatDate(cuota.fechaPago)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {formatCurrency(cuota.monto)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(cuota)}
                        </td>
                        <td className="py-3 px-4">
                          {getActionButton(cuota)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {cuotas.map((cuota) => {
          const isProximaCuota = proximaCuota === cuota.numero
          
          return (
            <Card 
              key={cuota.numero}
              className={isProximaCuota ? 'border-blue-200 bg-blue-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    isProximaCuota ? 'text-blue-600' : 'text-text-primary'
                  }`}>
                    Cuota #{cuota.numero}
                  </h4>
                  {getStatusBadge(cuota)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Fecha esperada:</span>
                    <span className="font-medium">{formatDate(cuota.fechaVencimiento)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Valor:</span>
                    <span className="font-medium">{formatCurrency(cuota.monto)}</span>
                  </div>
                  
                  {cuota.fechaPago && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Fecha de pago:</span>
                      <span className="font-medium text-green-600">
                        {formatDate(cuota.fechaPago)}
                      </span>
                    </div>
                  )}
                  
                  {cuota.observaciones && (
                    <div className="mt-2 p-2 bg-glass-primary/30 rounded text-xs">
                      {cuota.observaciones}
                    </div>
                  )}
                </div>
                
                <div className="mt-3 flex justify-end">
                  {getActionButton(cuota)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}