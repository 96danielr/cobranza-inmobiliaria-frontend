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
        {/* Header - Behavior Tag (Top) */}
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm flex-shrink-0 uppercase tracking-wider',
            behaviorConfig.color
          )}>
            {client.behaviorTag}
          </span>
          <div className="flex items-center space-x-2">
            {/* Optional badge for contracts count if we want to be fancy */}
            <span className="text-[10px] text-text-muted bg-glass-primary/30 px-2 py-0.5 rounded-full border border-glass-border">
              ID: {client.cedula}
            </span>
          </div>
        </div>

        {/* Client Identity */}
        <div className="mb-4">
          <div className="min-w-0">
            <h3 className="font-bold text-text-primary text-lg leading-tight">
              {(() => {
                const name = client.clientName
                // Helper to split long strings
                const getSplitParts = (str: string) => {
                  // 1. Try splitting by spaces if there are more than 2 words
                  const words = str.split(' ')
                  if (words.length > 2) {
                    return { first: words.slice(0, 2).join(' '), second: words.slice(2).join(' ') }
                  }

                  // 2. If it's a single long string (> 15 chars), try underscores/hyphens
                  if (str.length > 15) {
                    const delimiters = /[_\-]/
                    if (delimiters.test(str)) {
                      const parts = str.split(delimiters)
                      const mid = Math.ceil(parts.length / 2)
                      // Try to reconstruct with a similar separator or space
                      return { 
                        first: parts.slice(0, mid).join('_'), 
                        second: parts.slice(mid).join('_') 
                      }
                    }
                    // 3. Last resort: split roughly in half
                    const midPoint = Math.floor(str.length / 2)
                    return { first: str.substring(0, midPoint), second: str.substring(midPoint) }
                  }

                  return { first: str, second: '' }
                }

                const { first, second } = getSplitParts(name)
                
                return (
                  <div className="flex flex-col">
                    <span className="truncate" title={name}>{first}</span>
                    {second && (
                      <span className="text-sm font-semibold text-text-secondary opacity-90 truncate" title={name}>
                        {second}
                      </span>
                    )}
                  </div>
                )
              })()}
            </h3>
            <p className="text-[10px] text-text-muted mt-1 truncate uppercase tracking-tighter">
              Cliente Inmobiliario
            </p>
          </div>
        </div>

        {/* Saldo and Contracts - Prominent Display */}
        <div className="bg-glass-primary/20 rounded-lg p-3 mb-3 border border-glass-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-accent-blue mr-2 flex-shrink-0" />
              <span className="text-sm text-text-secondary">Saldo Pendiente</span>
            </div>
            <div className="sm:text-right">
              <p className="text-lg font-bold text-text-primary leading-none">
                {formatCurrency(client.totalPending)}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-glass-border/30">
            <div className="flex items-center">
              <Building2 className="w-4 h-4 text-text-muted mr-2 flex-shrink-0" />
              <span className="text-sm text-text-secondary">
                {client.totalContracts} {client.totalContracts === 1 ? 'contrato' : 'contratos'}
              </span>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-text-secondary">
                Total: <span className="font-medium text-text-primary">{formatCurrency(client.totalValue)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center min-w-0">
              {paymentStatus.icon}
              <span className={cn("text-xs font-medium ml-1 truncate", paymentStatus.color)}>
                RECUPERACIÓN
              </span>
            </div>
            <span className="text-sm font-bold text-text-primary">
              {client.averageRecaudo}%
            </span>
          </div>
          <div className="w-full bg-glass-primary/30 rounded-full h-2.5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--color-glow),0.3)]",
                paymentPercentage >= 80 ? "bg-accent-green" :
                paymentPercentage >= 50 ? "bg-accent-yellow" : "bg-accent-red"
              )}
              style={{ 
                width: `${Math.min(paymentPercentage, 100)}%`,
                // Applying a CSS variable for the glow based on color
                '--color-glow': paymentPercentage >= 80 ? '74, 222, 128' : 
                               paymentPercentage >= 50 ? '251, 191, 36' : '248, 113, 113'
              } as any}
            />
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="space-y-1">
            <div className="flex items-center text-[10px] uppercase tracking-wider text-text-muted">
              <Calendar className="w-3 h-3 mr-1" />
              Estado mora
            </div>
            <p className={cn("text-xs font-bold px-2 py-0.5 rounded border inline-block", 
              moraStatus.color.replace('text-', 'bg-').replace('accent-', 'accent-').split(' ')[0] + '/10',
              moraStatus.color)}>
              {moraStatus.text}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[10px] uppercase tracking-wider text-text-muted">Último contacto</div>
            <p className="text-xs text-text-secondary font-medium">
              {client.lastContact ? dayjs(client.lastContact).format('DD/MM/YYYY') : 'Sin contacto'}
            </p>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-glass-border pt-4 mt-3 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Teléfono:</span>
                <span className="text-text-primary font-medium">{client.phone}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Total pagado:</span>
                <span className="text-accent-green font-medium">{formatCurrency(client.totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Días en mora actual:</span>
                <span className={cn("font-medium", moraStatus.color)}>{client.daysInArrears} días</span>
              </div>
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