'use client'

import { useState } from 'react'
import { 
  ChevronRight,
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  Eye,
  MessageSquare
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

interface ClientCardProps {
  client: {
    _id: string
    name: string
    idNumber: string
    phone: string
    email?: string
    address?: string
    birthDate?: string
    behavior: string
    createdAt: string
    _count?: {
      contracts?: number
    }
  }
  onView: (client: any) => void
}

export function ClientCard({ client, onView }: ClientCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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

  const behaviorConfig = getBehaviorConfig(client.behavior)
  const contractCount = client._count?.contracts || 0
  const age = client.birthDate ? dayjs().diff(dayjs(client.birthDate), 'years') : null

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
        {/* Header - Client Name and Behavior */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <User className="w-4 h-4 text-text-secondary mr-2 flex-shrink-0" />
              <h3 className="font-semibold text-text-primary">
                {client.name}
              </h3>
            </div>
            <p className="text-sm text-text-muted">
              C.C. {client.idNumber}
            </p>
          </div>
          <span className={cn(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm flex-shrink-0',
            behaviorConfig.color
          )}>
            {client.behavior}
          </span>
        </div>

        {/* Contact Info - Prominent Display */}
        <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-accent-blue mr-2" />
              <span className="text-sm text-text-secondary">Contacto Principal</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">
                {client.phone}
              </p>
            </div>
          </div>
          
          {client.email && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-text-muted mr-2" />
                <span className="text-xs text-text-muted">Email</span>
              </div>
              <p className="text-xs text-text-secondary truncate max-w-[180px]">
                {client.email}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 text-text-muted mr-2" />
              <span className="text-sm text-text-secondary">
                {contractCount === 0 ? 'Sin contratos' : 
                 contractCount === 1 ? '1 contrato' : 
                 `${contractCount} contratos`}
              </span>
            </div>
            {age && (
              <div className="text-right">
                <p className="text-sm text-text-secondary">
                  {age} años
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 text-text-muted mr-2" />
            <div className="min-w-0">
              <p className="text-xs text-text-muted">Registrado</p>
              <p className="text-sm text-text-secondary truncate">
                {dayjs(client.createdAt).format('DD/MM/YYYY')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Estado</p>
            <div className="flex items-center justify-end">
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                contractCount > 0 ? "bg-accent-green" : "bg-accent-red"
              )} />
              <p className="text-sm text-text-secondary">
                {contractCount > 0 ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="border-t border-glass-border pt-3 mt-3 space-y-2 animate-fade-in">
            <div className="text-xs text-text-muted space-y-1">
              {client.address && (
                <div className="flex items-start">
                  <MapPin className="w-3 h-3 text-text-muted mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Dirección:</p>
                    <p className="text-text-secondary">{client.address}</p>
                  </div>
                </div>
              )}
              
              {client.birthDate && (
                <p><span className="font-medium">Fecha de nacimiento:</span> {dayjs(client.birthDate).format('DD/MM/YYYY')}</p>
              )}
              
              <p><span className="font-medium">ID Cliente:</span> {client._id}</p>
              
              <div className="pt-2">
                <p className="font-medium mb-1">Actividad Reciente:</p>
                <div className="bg-glass-primary/10 rounded p-2">
                  <p className="text-text-secondary">
                    Cliente registrado hace {dayjs().diff(dayjs(client.createdAt), 'days')} días
                    {contractCount > 0 && ` • ${contractCount} ${contractCount === 1 ? 'contrato activo' : 'contratos activos'}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-glass-border">
          {/* Toggle Details */}
          <Button
            variant="outline"
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
              variant="outline"
              size="sm"
              className="glass-button min-h-[44px] min-w-[44px] text-accent-green hover:text-accent-green hover:bg-accent-green/20"
              title="Enviar mensaje"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(client)}
              className="glass-button min-h-[44px] px-4 hover:shadow-glow"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="text-sm">Ver perfil</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading skeleton for ClientCard
export function ClientCardSkeleton() {
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

          {/* Contact section */}
          <div className="bg-glass-primary/20 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <div className="h-4 bg-glass-secondary rounded w-24" />
              <div className="h-4 bg-glass-secondary rounded w-20" />
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="h-3 bg-glass-secondary rounded w-16" />
              <div className="h-3 bg-glass-secondary rounded w-28" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-glass-secondary rounded w-20" />
              <div className="h-4 bg-glass-secondary rounded w-12" />
            </div>
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="h-8 bg-glass-secondary rounded" />
            <div className="h-8 bg-glass-secondary rounded" />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-glass-border">
            <div className="h-8 bg-glass-secondary rounded w-20" />
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-glass-secondary rounded" />
              <div className="h-8 bg-glass-secondary rounded w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}