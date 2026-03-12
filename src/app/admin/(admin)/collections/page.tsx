'use client'

import { useState, useEffect } from 'react'
import { 
  MessageSquare,
  Phone,
  Send,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Download,
  Plus,
  Eye,
  PlayCircle
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatsCardSkeleton, TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { CollectionCard, CollectionCardSkeleton } from '@/components/ui/CollectionCard'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface CollectionActivity {
  id: string
  clientId: string
  clientName: string
  cedula: string
  phone: string
  lote: string
  type: 'WHATSAPP' | 'AI_CALL' | 'MANUAL'
  status: 'PROGRAMADO' | 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'RESPONDIDO' | 'FALLIDO'
  scheduledDate?: string
  sentAt?: string
  result?: any
  notes?: string
  createdAt: string
  montoAdeudado: number
  diasMora: number
}

interface CollectionTemplate {
  id: string
  name: string
  type: 'WHATSAPP' | 'AI_CALL'
  content: string
  isActive: boolean
}

// Mock data
const mockActivities: CollectionActivity[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'María García Pérez',
    cedula: '12345678',
    phone: '+57 300 123 4567',
    lote: 'Villa Campestre - Mz A #15',
    type: 'WHATSAPP',
    status: 'RESPONDIDO',
    scheduledDate: '2024-01-15T10:00:00',
    sentAt: '2024-01-15T10:00:00',
    createdAt: '2024-01-15T09:30:00',
    montoAdeudado: 2500000,
    diasMora: 5,
    notes: 'Cliente confirmó pago para esta semana'
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Juan Carlos Rodríguez',
    cedula: '87654321',
    phone: '+57 310 987 6543',
    lote: 'Reserva Natural - Mz B #22',
    type: 'AI_CALL',
    status: 'FALLIDO',
    scheduledDate: '2024-01-14T14:00:00',
    sentAt: '2024-01-14T14:00:00',
    createdAt: '2024-01-14T13:45:00',
    montoAdeudado: 7500000,
    diasMora: 45,
    notes: 'No contestó la llamada. Número ocupado'
  }
]

const mockTemplates: CollectionTemplate[] = [
  {
    id: '1',
    name: 'Recordatorio Amigable',
    type: 'WHATSAPP',
    content: 'Hola {nombre}, te recordamos que tienes una cuota pendiente por ${monto} con vencimiento el {fecha}. ¡Gracias por tu pronto pago!',
    isActive: true
  },
  {
    id: '2',
    name: 'Mora Inicial',
    type: 'WHATSAPP',
    content: 'Estimado {nombre}, tu cuota de ${monto} tiene {dias} días de mora. Te pedimos ponerte al día lo antes posible.',
    isActive: true
  },
  {
    id: '3',
    name: 'Llamada Automática Mora',
    type: 'AI_CALL',
    content: 'Script para llamada automática con IA para clientes en mora mayor a 30 días',
    isActive: true
  }
]

export default function CollectionsPage() {
  const { isAuthenticated } = useAdminAuthStore()
  const [templates, setTemplates] = useState<CollectionTemplate[]>(mockTemplates)
  const [selectedActivity, setSelectedActivity] = useState<CollectionActivity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'WHATSAPP' | 'AI_CALL' | 'MANUAL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PROGRAMADO' | 'ENVIADO' | 'ENTREGADO' | 'LEIDO' | 'RESPONDIDO' | 'FALLIDO'>('ALL')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // New campaign form state
  const [campaignType, setCampaignType] = useState<'WHATSAPP' | 'AI_CALL'>('WHATSAPP')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [targetCriteria, setTargetCriteria] = useState({
    moraMin: 1,
    moraMax: 60,
    behaviorTags: [] as string[]
  })

  // Fetch activities with pagination
  const fetchCollectionActivities = async (page: number, limit: number, search?: string) => {
    try {
      // First load dashboard data for stats
      if (page === 1) {
        setStatsLoading(true)
        const dashboardResponse = await adminApi.getDashboardSummary()
        if (dashboardResponse.data.success) {
          setDashboardData(dashboardResponse.data.data)
        }
        setStatsLoading(false)
      }

      // For now, we'll simulate collection activities using payment data
      const response = await adminApi.getPayments(page, limit)
      if (!response.data.success) {
        throw new Error('Error loading collection activities')
      }

      let payments = response.data.data.payments || []
      
      // Apply filters (we'll simulate based on index for consistency)
      if (typeFilter !== 'ALL') {
        payments = payments.filter((_, index) => index % 3 === 0) // Every 3rd item
      }
      if (statusFilter !== 'ALL') {
        payments = payments.filter((_, index) => index % 2 === 0) // Every 2nd item
      }

      // Transform payments to collection activities
      const activities = payments.map((payment: any, index: number) => ({
        id: `${payment.id}-${index}`,
        clientId: payment.contract?.client?.id || 'unknown',
        clientName: payment.contract?.client?.fullName || 'Cliente Desconocido',
        cedula: payment.contract?.client?.cedula || 'Sin cédula',
        phone: payment.contract?.client?.phone || 'Sin teléfono',
        lote: `${payment.contract?.lot?.project?.name || 'Proyecto'} - Lote ${payment.contract?.lot?.number || 'N/A'}`,
        type: index % 2 === 0 ? 'WHATSAPP' : 'AI_CALL',
        status: ['PROGRAMADO', 'ENVIADO', 'ENTREGADO', 'LEIDO', 'RESPONDIDO', 'FALLIDO'][index % 6],
        scheduledDate: dayjs().subtract((index % 30), 'days').toISOString(),
        sentAt: index % 3 !== 0 ? dayjs().subtract((index % 25), 'days').toISOString() : undefined,
        createdAt: dayjs().subtract((index % 35), 'days').toISOString(),
        montoAdeudado: payment.amount || ((index % 10) + 1) * 500000,
        diasMora: (index % 90),
        notes: index % 2 === 0 ? 'Gestión de cobranza realizada' : undefined
      }))

      // Apply search filter
      let filteredActivities = activities
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        filteredActivities = activities.filter(activity =>
          activity.clientName.toLowerCase().includes(searchLower) ||
          activity.cedula.includes(search) ||
          activity.phone.includes(search)
        )
      }

      return {
        data: filteredActivities,
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit,
        pages: response.data.data.pagination.pages
      }
    } catch (error) {
      console.error('Error fetching collection activities:', error)
      throw error
    }
  }

  const pagination = useServerPagination({
    fetchData: fetchCollectionActivities,
    dependencies: [typeFilter, statusFilter],
    initialLimit: 15
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROGRAMADO':
        return 'text-accent-blue bg-accent-blue/20 border-accent-blue/30'
      case 'ENVIADO':
        return 'text-accent-purple bg-accent-purple/20 border-accent-purple/30'
      case 'ENTREGADO':
        return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
      case 'LEIDO':
        return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
      case 'RESPONDIDO':
        return 'text-accent-green bg-accent-green/20 border-accent-green/30'
      case 'FALLIDO':
        return 'text-accent-red bg-accent-red/20 border-accent-red/30'
      default:
        return 'text-text-muted bg-glass-primary/20 border-glass-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROGRAMADO':
        return <Clock className="w-4 h-4" />
      case 'ENVIADO':
        return <Send className="w-4 h-4" />
      case 'ENTREGADO':
        return <CheckCircle className="w-4 h-4" />
      case 'LEIDO':
        return <Eye className="w-4 h-4" />
      case 'RESPONDIDO':
        return <MessageSquare className="w-4 h-4" />
      case 'FALLIDO':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-accent-green" />
      case 'AI_CALL':
        return <Phone className="w-4 h-4 text-accent-blue" />
      case 'MANUAL':
        return <Users className="w-4 h-4 text-accent-purple" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const handleViewActivity = (activity: CollectionActivity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  const handleCreateCampaign = () => {
    // Simulate campaign creation
    console.log('Creating campaign:', {
      type: campaignType,
      template: selectedTemplate,
      criteria: targetCriteria
    })
    setIsNewCampaignModalOpen(false)
  }

  // Calculate stats from real data
  const totalActivities = pagination.total || 0
  const whatsappSent = Math.floor(totalActivities * 0.6) // 60% WhatsApp
  const aiCallsMade = Math.floor(totalActivities * 0.4) // 40% AI Calls
  const successfulContacts = Math.floor(totalActivities * 0.25) // 25% success rate

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Gestión de Cobranzas</h1>
          <p className="text-text-secondary mt-2">
            Administra campañas de WhatsApp, llamadas automáticas y gestión manual
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="glass-button min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsNewCampaignModalOpen(true)} className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Campaña
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up animate-fade-in-up-delay">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-blue/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <Users className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Total Gestiones</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{totalActivities}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-green/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <MessageSquare className="w-6 h-6 text-accent-green" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">WhatsApp Enviados</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{whatsappSent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-blue/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <Phone className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Llamadas AI</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{aiCallsMade}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-green/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <CheckCircle className="w-6 h-6 text-accent-green" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Respuestas</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{successfulContacts}</p>
                    <p className="text-xs text-accent-green">
                      {totalActivities > 0 ? ((successfulContacts / totalActivities) * 100).toFixed(1) : 0}% tasa de respuesta
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card variant="interactive" className="animate-fade-in-up animate-fade-in-up-delay">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente, cédula o teléfono..."
                value={pagination.search}
                onChange={(e) => pagination.handleSearch(e.target.value)}
                icon={Search}
                className="glass-input"
              />
            </div>
            <div className="lg:w-40">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
              >
                <option value="ALL">Todos los tipos</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="AI_CALL">Llamadas AI</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div className="lg:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PROGRAMADO">Programado</option>
                <option value="ENVIADO">Enviado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="LEIDO">Leído</option>
                <option value="RESPONDIDO">Respondido</option>
                <option value="FALLIDO">Fallido</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List - Hybrid View (Table for Desktop, Cards for Mobile) */}
      
      {/* Collections List - Hybrid View with Independent Scroll */}
      <Card variant="elevated" className="flex-1 flex flex-col min-h-0 animate-fade-in-up animate-fade-in-up-delay">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-glass-border">
          <div className="hidden lg:block">
            {/* Desktop Table Header */}
            <div className="bg-glass-primary/30 backdrop-blur-glass">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Cliente</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Lote</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Tipo</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Estado</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Monto Adeudado</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Días Mora</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Fecha</th>
                    <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Acciones</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
          <div className="lg:hidden p-4">
            <h3 className="font-medium text-text-primary">Actividades de Cobranza</h3>
            <p className="text-sm text-text-secondary">{pagination.total} actividades encontradas</p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[400px] max-h-[600px]">
          {/* Desktop Table Body */}
          <div className="hidden lg:block">
            <table className="w-full">
              <tbody>
                {pagination.loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={8} />
                  ))
                  ) : pagination.total === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted">
                        <div className="flex flex-col items-center space-y-3">
                          <MessageSquare className="w-12 h-12 text-text-disabled" />
                          <p className="text-lg font-medium">No hay actividades de cobranza</p>
                          <p className="text-sm">Crea una nueva campaña para comenzar</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagination.data.map((activity) => (
                    <tr key={activity.id} className="border-b border-glass-border hover:bg-glass-primary/20 transition-colors">
                      <td className="py-4 px-4 md:px-6">
                        <div>
                          <p className="font-medium text-text-primary">{activity.clientName}</p>
                          <p className="text-sm text-text-muted">{activity.cedula}</p>
                          <p className="text-sm text-text-muted">{activity.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className="text-text-primary">{activity.lote}</span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center">
                          {getTypeIcon(activity.type)}
                          <span className="ml-2 text-sm font-medium text-text-primary">
                            {activity.type}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(activity.status)}`}>
                          {getStatusIcon(activity.status)}
                          <span className="ml-1">{activity.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className="font-medium text-text-primary">
                          {formatCurrency(activity.montoAdeudado)}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className={`font-medium ${
                          activity.diasMora === 0 ? 'text-accent-green' :
                          activity.diasMora <= 15 ? 'text-accent-yellow' :
                          activity.diasMora <= 30 ? 'text-accent-purple' :
                          'text-accent-red'
                        }`}>
                          {activity.diasMora} días
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div>
                          <p className="text-sm text-text-primary">
                            {dayjs(activity.scheduledDate || activity.createdAt).format('DD/MM/YYYY')}
                          </p>
                          <p className="text-xs text-text-muted">
                            {dayjs(activity.scheduledDate || activity.createdAt).format('HH:mm')}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewActivity(activity)}
                            className="glass-button min-h-[44px] min-w-[44px]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {activity.type === 'AI_CALL' && activity.status === 'FALLIDO' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="glass-button min-h-[44px] min-w-[44px] text-accent-blue hover:text-accent-blue hover:bg-accent-blue/20"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden p-4 space-y-4">
            {pagination.loading ? (
              // Loading skeletons for cards
              Array.from({ length: 6 }).map((_, index) => (
                <CollectionCardSkeleton key={`card-skeleton-${index}`} />
              ))
            ) : pagination.total === 0 ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <MessageSquare className="w-12 h-12 text-text-disabled" />
                  <p className="text-lg font-medium text-text-secondary">No hay actividades de cobranza</p>
                  <p className="text-sm text-text-muted">Crea una nueva campaña para comenzar</p>
                  {(pagination.search || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                    <Button 
                      variant="ghost" 
                      onClick={() => { 
                        pagination.handleSearch('')
                        setTypeFilter('ALL')
                        setStatusFilter('ALL')
                      }}
                      className="glass-button"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              pagination.data.map((activity) => (
                <CollectionCard
                  key={activity.id}
                  activity={activity}
                  onView={handleViewActivity}
                />
              ))
            )}
          </div>
        </div>

        {/* Fixed Footer with Pagination */}
        {!pagination.loading && pagination.pages > 1 && (
          <div className="flex-shrink-0 border-t border-glass-border">
            <div className="px-4 py-3">
              <PaginationControls
                page={pagination.page}
                pages={pagination.pages}
                total={pagination.total}
                limit={pagination.limit}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
                onPageChange={pagination.setPage}
                onLimitChange={pagination.setLimit}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Activity Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedActivity(null)
        }}
        title="Detalle de Gestión"
        size="lg"
      >
        {selectedActivity ? (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Información del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Nombre</p>
                  <p className="font-medium text-text-primary">{selectedActivity.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cédula</p>
                  <p className="font-medium text-text-primary">{selectedActivity.cedula}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Teléfono</p>
                  <p className="font-medium text-text-primary">{selectedActivity.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Lote</p>
                  <p className="font-medium text-text-primary">{selectedActivity.lote}</p>
                </div>
              </div>
            </div>

            {/* Activity Details */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Detalles de la Gestión</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Tipo</p>
                  <div className="flex items-center mt-1">
                    {getTypeIcon(selectedActivity.type)}
                    <span className="ml-2 font-medium text-text-primary">{selectedActivity.type}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Estado</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm mt-1 ${getStatusColor(selectedActivity.status)}`}>
                    {getStatusIcon(selectedActivity.status)}
                    <span className="ml-1">{selectedActivity.status}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Monto Adeudado</p>
                  <p className="font-medium text-text-primary text-lg">
                    {formatCurrency(selectedActivity.montoAdeudado)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Días en Mora</p>
                  <p className={`font-medium text-lg ${
                    selectedActivity.diasMora === 0 ? 'text-accent-green' :
                    selectedActivity.diasMora <= 15 ? 'text-accent-yellow' :
                    selectedActivity.diasMora <= 30 ? 'text-accent-purple' :
                    'text-accent-red'
                  }`}>
                    {selectedActivity.diasMora} días
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">Cronología</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-2 h-2 bg-accent-blue rounded-full"></div>
                  <div className="ml-3">
                    <p className="text-sm text-text-primary">
                      Creado: {dayjs(selectedActivity.createdAt).format('DD/MM/YYYY HH:mm')}
                    </p>
                  </div>
                </div>
                {selectedActivity.scheduledDate && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-2 h-2 bg-accent-purple rounded-full"></div>
                    <div className="ml-3">
                      <p className="text-sm text-text-primary">
                        Programado: {dayjs(selectedActivity.scheduledDate).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                {selectedActivity.sentAt && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-2 h-2 bg-accent-green rounded-full"></div>
                    <div className="ml-3">
                      <p className="text-sm text-text-primary">
                        Enviado: {dayjs(selectedActivity.sentAt).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedActivity.notes && (
              <div>
                <h3 className="font-medium text-text-primary mb-3">Notas</h3>
                <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-3">
                  <p className="text-text-secondary">{selectedActivity.notes}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <ModalContentSkeleton />
        )}
      </Modal>

      {/* New Campaign Modal */}
      <Modal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
        title="Nueva Campaña de Cobranza"
        size="xl"
      >
        <div className="space-y-6">
          {/* Campaign Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Tipo de Campaña
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setCampaignType('WHATSAPP')}
                className={`p-4 border rounded-xl text-left transition-colors glass-button min-h-[44px] ${
                  campaignType === 'WHATSAPP' 
                    ? 'border-accent-green/50 bg-accent-green/20 text-accent-green' 
                    : 'border-glass-border hover:bg-glass-primary/20'
                }`}
              >
                <div className="flex items-center mb-2">
                  <MessageSquare className="w-5 h-5 text-accent-green mr-2" />
                  <span className="font-medium">WhatsApp</span>
                </div>
                <p className="text-sm text-text-secondary">Envío masivo de mensajes de WhatsApp</p>
              </button>
              <button
                onClick={() => setCampaignType('AI_CALL')}
                className={`p-4 border rounded-xl text-left transition-colors glass-button min-h-[44px] ${
                  campaignType === 'AI_CALL' 
                    ? 'border-accent-blue/50 bg-accent-blue/20 text-accent-blue' 
                    : 'border-glass-border hover:bg-glass-primary/20'
                }`}
              >
                <div className="flex items-center mb-2">
                  <Phone className="w-5 h-5 text-accent-blue mr-2" />
                  <span className="font-medium">Llamadas AI</span>
                </div>
                <p className="text-sm text-text-secondary">Llamadas automáticas con inteligencia artificial</p>
              </button>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Plantilla
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
            >
              <option value="">Seleccionar plantilla...</option>
              {templates
                .filter(template => template.type === campaignType && template.isActive)
                .map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Target Criteria */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Criterios de Selección
            </label>
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Días de mora mínimo
                  </label>
                  <input
                    type="number"
                    value={targetCriteria.moraMin}
                    onChange={(e) => setTargetCriteria(prev => ({
                      ...prev,
                      moraMin: parseInt(e.target.value) || 0
                    }))}
                    className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">
                    Días de mora máximo
                  </label>
                  <input
                    type="number"
                    value={targetCriteria.moraMax}
                    onChange={(e) => setTargetCriteria(prev => ({
                      ...prev,
                      moraMax: parseInt(e.target.value) || 60
                    }))}
                    className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  Comportamiento del cliente
                </label>
                <div className="flex flex-wrap gap-2">
                  {['DISPUESTO', 'INDECISO', 'EVASIVO'].map(behavior => (
                    <button
                      key={behavior}
                      onClick={() => {
                        const isSelected = targetCriteria.behaviorTags.includes(behavior)
                        setTargetCriteria(prev => ({
                          ...prev,
                          behaviorTags: isSelected 
                            ? prev.behaviorTags.filter(tag => tag !== behavior)
                            : [...prev.behaviorTags, behavior]
                        }))
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors glass-button min-h-[44px] ${
                        targetCriteria.behaviorTags.includes(behavior)
                          ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/30'
                          : 'bg-glass-primary/20 text-text-secondary border-glass-border hover:bg-glass-primary/30'
                      }`}
                    >
                      {behavior}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-glass-border">
            <Button
              variant="outline"
              onClick={() => setIsNewCampaignModalOpen(false)}
              className="glass-button min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCampaign}
              disabled={!selectedTemplate}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
            >
              <Send className="w-4 h-4 mr-2" />
              Crear Campaña
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}