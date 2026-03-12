'use client'

import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Notification } from '@/types'
import { formatDateRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const getNotificationConfig = () => {
    switch (notification.type) {
      case 'VENCIMIENTO':
        return {
          icon: Clock,
          bgColor: 'bg-yellow-50 border-yellow-200',
          iconColor: 'text-yellow-600',
          textColor: 'text-yellow-800'
        }
      case 'MORA':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        }
      case 'PAGO_PENDIENTE':
        return {
          icon: Clock,
          bgColor: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800'
        }
      case 'PAGO_RECHAZADO':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50 border-red-200',
          iconColor: 'text-red-600',
          textColor: 'text-red-800'
        }
      default:
        return {
          icon: CheckCircle,
          bgColor: 'bg-glass-primary/30 border-glass-border',
          iconColor: 'text-text-secondary',
          textColor: 'text-text-primary'
        }
    }
  }

  const config = getNotificationConfig()
  const Icon = config.icon

  return (
    <Card className={cn('border-l-4', config.bgColor)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Icon className={cn('w-5 h-5 mt-0.5', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', config.textColor)}>
              {notification.message}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {formatDateRelative(notification.date)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}