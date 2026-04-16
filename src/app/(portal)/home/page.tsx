'use client'

import { useState, useEffect } from 'react'
import { Bell, Wallet, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { PortalHomeData } from '@/types'
import { formatDate } from '@/lib/utils'

import { ContractCard } from '@/components/home/ContractCard'
import { NotificationCard } from '@/components/home/NotificationCard'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { CardSkeleton, LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const [homeData, setHomeData] = useState<PortalHomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { client } = useAuthStore()

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getHome()
      
      if (response.data.success) {
        setHomeData(response.data.data)
      } else {
        toast.error('Error cargando información del dashboard')
      }
    } catch (error: any) {
      toast.error('Error de conexión')

    } finally {
      setIsLoading(false)
    }
  }

  const currentDate = formatDate(new Date(), 'dddd, DD [de] MMMM [de] YYYY')

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-responsive-lg font-bold text-text-primary">
          ¡Hola, {client?.fullName}! 👋
        </h1>
        <p className="text-text-secondary mt-1 text-responsive-base">
          {currentDate}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-fade-in-up">
          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} lines={4} />
            ))}
          </div>
          <CardSkeleton lines={2} />
        </div>
      ) : (
        <>
          {/* Notifications Section */}
          {homeData?.notifications && homeData.notifications.length > 0 && (
            <div className="mb-6 animate-fade-in-up">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-accent-yellow mr-2" />
                <h2 className="text-responsive-base font-semibold text-text-primary">
                  Notificaciones Importantes
                </h2>
              </div>
              <div className="space-y-3">
                {homeData.notifications.map((notification, index) => (
                  <NotificationCard 
                    key={`${notification.type}-${index}`} 
                    notification={notification} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Contracts Section */}
          <div className="mb-6 animate-fade-in-up-delay">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-accent-blue mr-2" />
                <h2 className="text-responsive-base font-semibold text-text-primary">
                  Mis Contratos
                </h2>
              </div>
              <span className="text-sm text-text-secondary">
                {homeData?.contracts?.length || 0} contrato(s)
              </span>
            </div>

            {homeData?.contracts && homeData.contracts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {homeData.contracts.map((contract, index) => (
                  <div key={contract.id} className={`animate-fade-in-up-delay-${Math.min(index, 3)}`}>
                    <ContractCard 
                      contract={contract}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card variant="elevated" className="glass-card">
                <CardContent className="p-6 md:p-8 text-center">
                  <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <h3 className="text-responsive-base font-medium text-text-primary mb-2">
                    No tienes contratos activos
                  </h3>
                  <p className="text-text-secondary">
                    Cuando tengas contratos activos aparecerán aquí.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <Card variant="elevated" className="glass-card animate-fade-in-up-delay-2">
            <CardHeader>
              <h3 className="text-responsive-base font-semibold text-text-primary">
                Acciones Rápidas
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => window.location.href = '/payments'}
                  className="glass-button p-4 text-center rounded-xl hover:shadow-glow transition-all duration-300 min-h-[44px] touch-target group"
                >
                  <FileText className="w-8 h-8 text-accent-blue mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-text-primary">Mis Pagos</p>
                </button>
                <button
                  onClick={() => window.location.href = '/report-payment'}
                  className="glass-button p-4 text-center rounded-xl hover:shadow-glow transition-all duration-300 min-h-[44px] touch-target group"
                >
                  <Wallet className="w-8 h-8 text-accent-green mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-text-primary">Reportar Pago</p>
                </button>
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="glass-button p-4 text-center rounded-xl hover:shadow-glow transition-all duration-300 min-h-[44px] touch-target group"
                >
                  <Bell className="w-8 h-8 text-accent-purple mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-text-primary">Mi Perfil</p>
                </button>
                <button
                  onClick={loadHomeData}
                  className="glass-button p-4 text-center rounded-xl hover:shadow-glow transition-all duration-300 min-h-[44px] touch-target group"
                >
                  <LoadingSpinner size="sm" className="mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-medium text-text-primary">Actualizar</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}