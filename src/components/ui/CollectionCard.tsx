'use client'

import { useState } from 'react'
import { 
  ChevronRight,
  User,
  MessageSquare,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  Zap
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

interface CollectionCardProps {
  activity: {
    id: string
    clientId: string
    clientName: string
    cedula: string
    phone: string
    lote: string
    type: 'WHATSAPP' | 'AI_CALL' | 'MANUAL' | 'EMAIL'
    status: 'PROGRAMADO' | 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'RESPONDIDO' | 'FALLIDO'
    scheduledDate?: string
    sentAt?: string
    createdAt: string
    montoAdeudado: number
    diasMora: number
    behaviorTag?: 'DISPUESTO' | 'INDECISO' | 'EVASIVO'
    notes?: string
  }
  onView: (activity: any) => void
}

export function CollectionCard({ activity, onView }: CollectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'WHATSAPP':
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          label: 'WhatsApp',
          color: 'text-accent-green bg-accent-green/20 border-accent-green/30'
        }
      case 'AI_CALL':
        return {
          icon: <Bot className="w-4 h-4" />,
          label: 'Llamada AI',
          color: 'text-accent-purple bg-accent-purple/20 border-accent-purple/30'
        }
      case 'MANUAL':
        return {
          icon: <Phone className="w-4 h-4" />,
          label: 'Llamada Manual',
          color: 'text-accent-blue bg-accent-blue/20 border-accent-blue/30'
        }
      case 'EMAIL':
        return {
          icon: <Zap className="w-4 h-4" />,
          label: 'Email',
          color: 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
        }
      default:
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          label: 'Mensaje',
          color: 'text-text-muted bg-glass-primary/20 border-glass-border'
        }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PROGRAMADO':
        return {
          color: 'text-accent-blue bg-accent-blue/20 border-accent-blue/30',
          icon: <Clock className="w-3 h-3" />,
          bgColor: 'bg-accent-blue/5'
        }
      case 'ENVIADO':
      case 'ENTREGADO':
        return {
          color: 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30',
          icon: <CheckCircle className="w-3 h-3" />,
          bgColor: 'bg-accent-yellow/5'
        }
      case 'LEIDO':
      case 'RESPONDIDO':
        return {
          color: 'text-accent-green bg-accent-green/20 border-accent-green/30',
          icon: <CheckCircle className="w-3 h-3" />,
          bgColor: 'bg-accent-green/5'
        }
      case 'FALLIDO':
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

  const getBehaviorConfig = (behavior: string) => {
    switch (behavior) {
      case 'DISPUESTO':
        return { color: 'text-accent-green bg-accent-green/20 border-accent-green/30' }
      case 'INDECISO':
        return { color: 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30' }
      case 'EVASIVO':
        return { color: 'text-accent-red bg-accent-red/20 border-accent-red/30' }
      default:
        return { color: 'text-text-muted bg-glass-primary/20 border-glass-border' }
    }
  }

  const typeConfig = getTypeConfig(activity.type)
  const statusConfig = getStatusConfig(activity.status)
  const behaviorConfig = getBehaviorConfig(activity.behaviorTag || '')

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
                {activity.clientName}
              </h3>
            </div>
            <p className="text-sm text-text-muted">
              C.C. {activity.cedula}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
              statusConfig.color
            )}>
              {statusConfig.icon}
              <span className="ml-1">{activity.status}</span>
            </span>
          </div>
        </div>

        {/* Collection Type and Amount */}
        <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
                typeConfig.color
              )}>
                {typeConfig.icon}
                <span className="ml-1">{typeConfig.label}</span>
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-text-primary">
                {formatCurrency(activity.montoAdeudado)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">
              {activity.lote}
            </span>
            <div className="flex items-center gap-2">
              {activity.diasMora > 0 && (
                <span className="text-xs text-accent-red font-medium">
                  {activity.diasMora} días mora
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timing Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 text-text-muted mr-2" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted">
                {activity.sentAt ? 'Ejecutado' : 'Programado'}
              </p>
              <p className="text-sm text-text-secondary truncate">
                {dayjs(activity.sentAt || activity.scheduledDate || activity.createdAt).format('DD/MM/YYYY HH:mm')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Teléfono</p>
            <p className="text-sm text-text-secondary">
              {activity.phone}
            </p>
          </div>
        </div>

        {/* Notes Preview */}
        {activity.notes && !isExpanded && (
          <div className="mb-3">
            <p className="text-xs text-text-muted mb-1">Notas:</p>
            <p className="text-sm text-text-secondary line-clamp-2 bg-glass-primary/10 rounded p-2">
              {activity.notes}
            </p>
          </div>
        )}

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-glass-border pt-3 mt-3 space-y-3 animate-fade-in">
            {activity.notes && (
              <div>
                <p className="text-xs font-medium text-text-primary mb-2">Notas de Gestión:</p>
                <div className="bg-glass-primary/10 rounded-lg p-3">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {activity.notes}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-text-muted">
              <div>
                <p><span className="font-medium">Cliente ID:</span> {activity.clientId}</p>
                <p><span className="font-medium">Actividad ID:</span> {activity.id}</p>
              </div>
              <div>
                <p><span className="font-medium">Días mora:</span> {activity.diasMora}</p>
                <p><span className="font-medium">Creado:</span> {dayjs(activity.createdAt).format('DD/MM/YYYY')}</p>
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
              onClick={() => onView(activity)}
              className="glass-button min-h-[44px] px-4 hover:shadow-glow"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              <span className="text-sm">Ver detalles</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton for CollectionCard
export function CollectionCardSkeleton() {
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

          {/* Type and amount section */}
          <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="h-6 bg-glass-secondary rounded w-20" />
              <div className="h-6 bg-glass-secondary rounded w-24" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-glass-secondary rounded w-32" />
              <div className="h-4 bg-glass-secondary rounded w-16" />
            </div>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="h-8 bg-glass-secondary rounded" />
            <div className="h-8 bg-glass-secondary rounded" />
          </div>

          {/* Message preview */}
          <div className="mb-3">
            <div className="h-3 bg-glass-secondary rounded w-16 mb-1" />
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