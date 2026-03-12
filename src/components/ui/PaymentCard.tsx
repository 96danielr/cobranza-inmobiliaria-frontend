'use client'

import { useState } from 'react'
import { 
  Check, 
  X, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  User,
  CreditCard,
  Calendar
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

interface PaymentCardProps {
  payment: {
    id: string
    contractId: string
    cuotaNumber: number
    amount: string | number
    banco: string
    fechaPago: string
    comprobante?: string | null
    createdAt: string
    status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
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
  onView: (payment: any) => void
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  isProcessing?: boolean
}

export function PaymentCard({ 
  payment, 
  onView, 
  onApprove, 
  onReject, 
  isProcessing = false 
}: PaymentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numValue)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return {
          color: 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30',
          icon: <Clock className="w-3 h-3" />,
          bgColor: 'bg-accent-yellow/5'
        }
      case 'APROBADO':
        return {
          color: 'text-accent-green bg-accent-green/20 border-accent-green/30',
          icon: <CheckCircle className="w-3 h-3" />,
          bgColor: 'bg-accent-green/5'
        }
      case 'RECHAZADO':
        return {
          color: 'text-accent-red bg-accent-red/20 border-accent-red/30',
          icon: <AlertCircle className="w-3 h-3" />,
          bgColor: 'bg-accent-red/5'
        }
      default:
        return {
          color: 'text-text-muted bg-glass-primary/20 border-glass-border',
          icon: <Clock className="w-3 h-3" />,
          bgColor: 'bg-glass-primary/5'
        }
    }
  }

  const statusConfig = getStatusConfig(payment.status)

  return (
    <Card 
      variant="interactive" 
      className={cn(
        "transition-all duration-200 hover:shadow-glass-hover",
        statusConfig.bgColor,
        isExpanded && "shadow-glass-hover"
      )}
    >
      <CardContent className="p-4">
        {/* Header - Client and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <User className="w-4 h-4 text-text-secondary mr-2 flex-shrink-0" />
              <h3 className="font-semibold text-text-primary truncate">
                {payment.contract.client.fullName}
              </h3>
            </div>
            <p className="text-sm text-text-muted">
              C.C. {payment.contract.client.cedula}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
              statusConfig.color
            )}>
              {statusConfig.icon}
              <span className="ml-1">{payment.status}</span>
            </span>
          </div>
        </div>

        {/* Amount and Project - Prominent Display */}
        <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-accent-blue mr-2" />
              <span className="text-sm text-text-secondary">Cuota #{payment.cuotaNumber}</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Building2 className="w-4 h-4 text-text-muted mr-2" />
            <span className="text-sm text-text-secondary">
              {payment.contract.lot.project.name}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Mz {payment.contract.lot.manzana} - #{payment.contract.lot.nomenclatura}
          </p>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 text-text-muted mr-2" />
            <span className="text-sm text-text-secondary">
              {dayjs(payment.fechaPago).format('DD/MM/YYYY')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm text-text-secondary">{payment.banco}</span>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-glass-border pt-3 mt-3 space-y-2 animate-fade-in">
            <div className="text-xs text-text-muted">
              <p><span className="font-medium">Teléfono:</span> {payment.contract.client.phone}</p>
              <p><span className="font-medium">Creado:</span> {dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm')}</p>
              {payment.observacion && (
                <p className="mt-2">
                  <span className="font-medium">Observación:</span> {payment.observacion}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-glass-border">
          {/* Toggle Details */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass-button text-text-muted hover:text-text-primary min-h-[44px] px-3"
          >
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform",
              isExpanded && "rotate-90"
            )} />
            <span className="ml-1 text-sm">
              {isExpanded ? 'Ocultar' : 'Ver más'}
            </span>
          </Button>

          {/* Main Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(payment)}
              className="glass-button min-h-[44px] min-w-[44px] hover:shadow-glow"
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            {payment.status === 'PENDIENTE' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReject?.(payment.id)}
                  disabled={isProcessing}
                  className="glass-button min-h-[44px] min-w-[44px] text-accent-red hover:text-accent-red hover:bg-accent-red/20"
                  title="Rechazar"
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onApprove?.(payment.id)}
                  disabled={isProcessing}
                  className="glass-button min-h-[44px] min-w-[44px] text-accent-green hover:text-accent-green hover:bg-accent-green/20"
                  title="Aprobar"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton for PaymentCard
export function PaymentCardSkeleton() {
  return (
    <Card variant="elevated">
      <CardContent className="p-4">
        <div className="animate-pulse">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-glass-secondary rounded mr-2" />
                <div className="h-4 bg-glass-secondary rounded w-32" />
              </div>
              <div className="h-3 bg-glass-secondary rounded w-24 mt-1" />
            </div>
            <div className="w-20 h-6 bg-glass-secondary rounded-full" />
          </div>

          {/* Amount section */}
          <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-glass-secondary rounded w-20" />
              <div className="h-6 bg-glass-secondary rounded w-24" />
            </div>
            <div className="h-4 bg-glass-secondary rounded w-40" />
            <div className="h-3 bg-glass-secondary rounded w-32 mt-1" />
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="h-4 bg-glass-secondary rounded" />
            <div className="h-4 bg-glass-secondary rounded" />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-glass-border">
            <div className="h-8 bg-glass-secondary rounded w-20" />
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-glass-secondary rounded" />
              <div className="w-10 h-10 bg-glass-secondary rounded" />
              <div className="w-10 h-10 bg-glass-secondary rounded" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}