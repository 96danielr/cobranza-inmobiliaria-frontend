'use client'

import { useState } from 'react'
import { 
  Eye,
  ChevronRight,
  Building2,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

interface PortfolioCardProps {
  client: {
    clientId: string
    clientName: string
    cedula: string
    phone: string
    totalContracts: number
    totalValue: number
    totalPaid: number
    totalPending: number
    averageRecaudo: number
    behaviorTag: 'DISPUESTO' | 'INDECISO' | 'EVASIVO'
    daysInArrears: number
    lastContact?: string
    contracts?: any[]
  }
  onView: (client: any) => void
}

export function PortfolioCard({ client, onView }: PortfolioCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getBehaviorConfig = (behavior: string) => {
    switch (behavior) {
      case 'DISPUESTO':
        return {
          color: 'text-accent-green bg-accent-green/20 border-accent-green/30',
          bgColor: 'bg-accent-green/5'
        }
      case 'INDECISO':
        return {
          color: 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30',
          bgColor: 'bg-accent-yellow/5'
        }
      case 'EVASIVO':
        return {
          color: 'text-accent-red bg-accent-red/20 border-accent-red/30',
          bgColor: 'bg-accent-red/5'
        }
      default:
        return {
          color: 'text-text-muted bg-glass-primary/20 border-glass-border',
          bgColor: 'bg-glass-primary/5'
        }
    }
  }

  const getPaymentStatus = () => {
    const percentage = client.averageRecaudo
    if (percentage >= 80) return { icon: <TrendingUp className="w-3 h-3" />, color: 'text-accent-green' }
    if (percentage >= 50) return { icon: <Minus className="w-3 h-3" />, color: 'text-accent-yellow' }
    return { icon: <TrendingDown className="w-3 h-3" />, color: 'text-accent-red' }
  }

  const getMoraStatus = () => {
    if (client.daysInArrears === 0) return { text: 'Al día', color: 'text-accent-green' }
    if (client.daysInArrears <= 15) return { text: `${client.daysInArrears} días`, color: 'text-accent-yellow' }
    if (client.daysInArrears <= 30) return { text: `${client.daysInArrears} días`, color: 'text-accent-orange' }
    return { text: `${client.daysInArrears} días`, color: 'text-accent-red' }
  }

  const behaviorConfig = getBehaviorConfig(client.behaviorTag)
  const paymentStatus = getPaymentStatus()
  const moraStatus = getMoraStatus()
  const paymentPercentage = client.averageRecaudo

  return (
    <Card 
      variant="interactive" 
      className={cn(
        "transition-all duration-200 hover:shadow-glass-hover",
        behaviorConfig.bgColor,
        isExpanded && "shadow-glass-hover"
      )}
    >
      <CardContent className="p-4">
        {/* Header - Client and Behavior */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <User className="w-4 h-4 text-text-secondary mr-2 flex-shrink-0" />
              <h3 className="font-semibold text-text-primary truncate">
                {client.clientName}
              </h3>
            </div>
            <p className="text-sm text-text-muted">
              C.C. {client.cedula}
            </p>
          </div>
          <span className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm flex-shrink-0',
            behaviorConfig.color
          )}>
            {client.behaviorTag}
          </span>
        </div>

        {/* Saldo and Contracts - Prominent Display */}
        <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-accent-blue mr-2" />
              <span className="text-sm text-text-secondary">Saldo Pendiente</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(client.totalPending)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="w-4 h-4 text-text-muted mr-2" />
              <span className="text-sm text-text-secondary">
                {client.totalContracts} {client.totalContracts === 1 ? 'contrato' : 'contratos'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">
                Total: {formatCurrency(client.totalValue)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {paymentStatus.icon}
              <span className={cn("text-sm ml-1", paymentStatus.color)}>
                Progreso de Pagos
              </span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {client.averageRecaudo}%
            </span>
          </div>
          <div className="w-full bg-glass-primary/20 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                paymentPercentage >= 80 ? "bg-accent-green" :
                paymentPercentage >= 50 ? "bg-accent-yellow" : "bg-accent-red"
              )}
              style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-1">
            <span>0%</span>
            <span className="font-medium">{paymentPercentage.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 text-text-muted mr-2" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Estado mora</p>
              <p className={cn("text-sm font-medium truncate", moraStatus.color)}>
                {moraStatus.text}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Último contacto</p>
            <p className="text-sm text-text-secondary">
              {client.lastContact ? dayjs(client.lastContact).format('DD/MM/YYYY') : 'Sin contacto'}
            </p>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-glass-border pt-3 mt-3 space-y-2 animate-fade-in">
            <div className="text-xs text-text-muted space-y-1">
              <p><span className="font-medium">Teléfono:</span> {client.phone}</p>
              <p><span className="font-medium">Total pagado:</span> {formatCurrency(client.totalPaid)}</p>
              <p><span className="font-medium">Días en mora:</span> {client.daysInArrears} días</p>
              {client.contracts && client.contracts.length > 0 && (
                <p><span className="font-medium">Contratos:</span> {client.contracts.length} activos</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-glass-border">
          {/* Toggle Details */}
          <Button
            variant="glass"
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
              variant="glass"
              size="sm"
              onClick={() => onView(client)}
              className="glass-button min-h-[44px] px-4 hover:shadow-glow"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="text-sm">Ver detalles</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton for PortfolioCard
export function PortfolioCardSkeleton() {
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
            <div className="w-16 h-6 bg-glass-secondary rounded-full" />
          </div>

          {/* Amount section */}
          <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-glass-secondary rounded w-24" />
              <div className="h-6 bg-glass-secondary rounded w-20" />
            </div>
            <div className="h-4 bg-glass-secondary rounded w-40" />
            <div className="h-3 bg-glass-secondary rounded w-32 mt-1" />
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between mb-2">
              <div className="h-4 bg-glass-secondary rounded w-20" />
              <div className="h-4 bg-glass-secondary rounded w-12" />
            </div>
            <div className="w-full bg-glass-secondary rounded-full h-2" />
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="h-8 bg-glass-secondary rounded" />
            <div className="h-8 bg-glass-secondary rounded" />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-glass-border">
            <div className="h-8 bg-glass-secondary rounded w-20" />
            <div className="h-8 bg-glass-secondary rounded w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}