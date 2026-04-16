'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  DollarSign,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Eye,
  Phone,
  MessageSquare,
  Users,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SortHeader } from '@/components/ui/SortHeader'
import { StatsCardSkeleton, TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PortfolioCard, PortfolioCardSkeleton } from '@/components/ui/PortfolioCard'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface ClientPortfolio {
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
  contracts: ContractSummary[]
  daysInArrears: number
  lastContact?: string
}

interface ContractSummary {
  id: string
  project: string
  manzana: string
  nomenclatura: string
  valorTotal: number
  totalPagado: number
  cuotasPagadas: number
  totalCuotas: number
  valorCuota: number
  diasMora: number
  status: string
  proximoVencimiento?: string
}



export default function PortfolioPage() {
  const { isAuthenticated } = useAdminAuthStore()
  const [selectedClient, setSelectedClient] = useState<ClientPortfolio | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [behaviorFilter, setBehaviorFilter] = useState<'ALL' | 'DISPUESTO' | 'INDECISO' | 'EVASIVO'>('ALL')
  const [moraFilter, setMoraFilter] = useState<'ALL' | 'AL_DIA' | 'IN_MORA' | 'MORA_1_15' | 'MORA_16_30' | 'MORA_31_60' | 'MORA_60_PLUS'>('ALL')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Server-side pagination for portfolio
  const fetchPortfolio = useCallback(async (page: number, limit: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    // Load dashboard data for stats
    const dashboardResponse = await adminApi.getDashboardSummary()
    if (dashboardResponse.data.success) {
      setDashboardData(dashboardResponse.data.data)
    }

    // Load clients data and convert to portfolio format
    // Map moraFilter to boolean for server
    const moraOnly = moraFilter !== 'ALL' && moraFilter !== 'AL_DIA'
    const alDiaOnly = moraFilter === 'AL_DIA'

    const clientsResponse = await adminApi.getClients(page, limit, search, sortBy, sortOrder, behaviorFilter, moraOnly, alDiaOnly)

    if (!clientsResponse.data.success) {
      throw new Error('Error loading portfolio data')
    }

    let clients = clientsResponse.data.data.clients

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase()
      clients = clients.filter((client: any) =>
        (client.name || client.fullName || '').toLowerCase().includes(searchLower) ||
        (client.idNumber || client.cedula || '').includes(search) ||
        (client.email || '').toLowerCase().includes(searchLower)
      )
    }

    // Convert to portfolio format
    const portfolioData = clients.map((client: any) => ({
      clientId: client._id || client.id,
      clientName: client.name || client.fullName,
      cedula: client.idNumber || client.cedula,
      phone: client.phone,
      totalContracts: client.totalContracts || 0,
      totalValue: client.totalValue || 0,
      totalPaid: client.totalPaid || 0,
      totalPending: client.totalPending || 0,
      averageRecaudo: Math.round(client.porcentajeRecaudo || 0),
      behaviorTag: client.behavior || 'INDECISO',
      daysInArrears: client.diasMora || 0,
      lastContact: client.lastContact || undefined,
      contracts: [] 
    }))

    return {
      data: portfolioData,
      total: clientsResponse.data.data.pagination.total,
      page: clientsResponse.data.data.pagination.page,
      limit: clientsResponse.data.data.pagination.limit,
      pages: clientsResponse.data.data.pagination.pages
    }
  }, [behaviorFilter, moraFilter])

  const pagination = useServerPagination({
    initialLimit: 15,
    fetchData: fetchPortfolio,
    dependencies: [behaviorFilter, moraFilter]
  })



  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getBehaviorColor = (behavior: string) => {
    const b = (behavior || '').toUpperCase().trim();
    if (b.includes('DISPUESTO')) {
      return 'text-accent-green bg-accent-green/20 border-accent-green/30'
    }
    if (b.includes('INDECISO')) {
      return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
    }
    if (b.includes('EVASIVO')) {
      return 'text-accent-red bg-accent-red/20 border-accent-red/30'
    }
    return 'text-text-muted bg-glass-primary/20 border-glass-border'
  }

  const getMoraColor = (days: number) => {
    if (days === 0) return 'text-accent-green bg-accent-green/20 border-accent-green/30'
    if (days <= 15) return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
    if (days <= 30) return 'text-accent-purple bg-accent-purple/20 border-accent-purple/30'
    return 'text-accent-red bg-accent-red/20 border-accent-red/30'
  }

  const getMoraText = (days: number) => {
    if (days === 0) return 'Al día'
    return `${days} días`
  }

  const handleViewClient = async (client: ClientPortfolio) => {
    setSelectedClient(client)
    setIsModalOpen(true)
    setModalLoading(true)
    
    try {
      const response = await adminApi.getClient(client.clientId)
      if (response.data.success) {
        const fullClient = response.data.data
        setSelectedClient({
          clientId: fullClient._id,
          clientName: fullClient.name,
          cedula: fullClient.idNumber,
          phone: fullClient.phone,
          totalContracts: fullClient.contracts?.length || 0,
          totalValue: fullClient.contracts?.reduce((sum: number, c: any) => sum + (c.totalValue || 0), 0) || 0,
          totalPaid: fullClient.contracts?.reduce((sum: number, c: any) => sum + (c.totalPagado || 0), 0) || 0,
          totalPending: fullClient.contracts?.reduce((sum: number, c: any) => sum + (c.totalValue - c.totalPagado || 0), 0) || 0,
          averageRecaudo: fullClient.contracts?.length ? 
            Math.round((fullClient.contracts.reduce((sum: number, c: any) => sum + (c.totalPagado || 0), 0) / 
            fullClient.contracts.reduce((sum: number, c: any) => sum + (c.totalValue || 1), 0)) * 100) : 0,
          behaviorTag: fullClient.behavior || 'INDECISO',
          daysInArrears: client.daysInArrears,
          contracts: fullClient.contracts.map((c: any) => ({
            id: c._id,
            project: c.negotiation || 'Proyecto sin nombre',
            manzana: 'N/A', 
            nomenclatura: 'N/A',
            valorTotal: c.totalValue,
            totalPagado: c.totalPagado,
            // Value breakdown
            valorTotalInicial: c.valorTotalInicial,
            valorPagadoInicial: c.valorPagadoInicial,
            valorTotalCuotas: c.valorTotalCuotas,
            valorPagadoCuotas: c.valorPagadoCuotas,
            // New detailed fields
            cuotasInicialesPagadas: c.cuotasInicialesPagadas,
            totalCuotasIniciales: c.totalCuotasIniciales,
            cuotasNormalesPagadas: c.cuotasNormalesPagadas,
            totalCuotasNormales: c.totalCuotasNormales,
            initialQuotaPercentage: c.initialQuotaPercentage,
            // Fallback
            cuotasPagadas: c.cuotasPagadas,
            totalCuotas: c.totalCuotas,
            valorCuota: c.valorCuota,
            diasMora: c.diasMora,
            status: c.status,
            proximoVencimiento: c.startDate 
          }))
        })
      }
    } catch (error) {
      toast.error('Error al cargar detalles del cliente')
    } finally {
      setModalLoading(false)
    }
  }

  // Calculate stats
  // Calculate stats from current page data
  const totalClients = pagination.total
  const clientsAlDia = pagination.data.filter(c => c.daysInArrears === 0).length
  const clientsEnMora = pagination.data.filter(c => c.daysInArrears > 0).length
  // Calculate stats from dashboard summary if available, otherwise from current page data (fallback)
  const totalRecaudado = dashboardData?.cartera?.totalRecaudado ?? pagination.data.reduce((sum, c) => sum + (c.totalPaid || 0), 0)
  const ventasTotales = dashboardData?.cartera?.valorTotalCartera ?? pagination.data.reduce((sum, c) => sum + (c.totalValue || 0), 0)
  const valorCartera = Math.max(0, ventasTotales - totalRecaudado)


  return (
    <div className="flex flex-col min-h-full space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Gestión de Cartera</h1>
          <p className="text-text-secondary mt-2">
            {dashboardData ?
              `${dashboardData.mora.totalContratosActivos} contratos activos - $${(dashboardData.cartera.valorTotalCartera / 1000000000).toFixed(1)}B en cartera total` :
              'Administra y supervisa toda la cartera de clientes y contratos'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="glass-button min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 2xl:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up animate-fade-in-up-delay">
        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent-green/20 backdrop-blur-sm rounded-full border border-glass-border">
                <CheckCircle className="w-6 h-6 text-accent-green" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary font-medium">Total Recaudado</p>
                <p className="text-responsive-lg font-bold text-text-primary">
                  {formatCurrency(totalRecaudado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent-blue/20 backdrop-blur-sm rounded-full border border-glass-border">
                <DollarSign className="w-6 h-6 text-accent-blue" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary font-medium">Valor Total de la Cartera</p>
                <p className="text-responsive-lg font-bold text-text-primary">
                  {formatCurrency(valorCartera)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent-green/20 backdrop-blur-sm rounded-full border border-glass-border">
                <TrendingUp className="w-6 h-6 text-accent-green" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary font-medium">Clientes al Día</p>
                <p className="text-responsive-xl font-bold text-text-primary">{clientsAlDia}</p>
                <p className="text-xs text-accent-green">
                  {totalClients > 0 ? ((clientsAlDia / totalClients) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent-red/20 backdrop-blur-sm rounded-full border border-glass-border">
                <TrendingDown className="w-6 h-6 text-accent-red" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary font-medium">Clientes en Mora</p>
                <p className="text-responsive-xl font-bold text-text-primary">{clientsEnMora}</p>
                <p className="text-xs text-accent-red">
                  {totalClients > 0 ? ((clientsEnMora / totalClients) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <div className="lg:w-48">
              <select
                value={behaviorFilter}
                onChange={(e) => setBehaviorFilter(e.target.value as any)}
                className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
              >
                <option value="ALL">Todos los comportamientos</option>
                <option value="DISPUESTO">Dispuestos</option>
                <option value="INDECISO">Indecisos</option>
                <option value="EVASIVO">Evasivos</option>
              </select>
            </div>
            <div className="lg:w-48">
              <select
                value={moraFilter}
                onChange={(e) => setMoraFilter(e.target.value as any)}
                className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
              >
                <option value="ALL">Todos los estados</option>
                <option value="AL_DIA">Al día</option>
                <option value="MORA_1_15">Mora 1-15 días</option>
                <option value="MORA_16_30">Mora 16-30 días</option>
                <option value="MORA_31_60">Mora 31-60 días</option>
                <option value="MORA_60_PLUS">Mora +60 días</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio List - Hybrid View (Table for Desktop, Cards for Mobile) */}

      {/* Portfolio List - Hybrid View with Independent Scroll */}
      <Card variant="elevated" className="flex-1 flex flex-col min-h-0 animate-fade-in-up animate-fade-in-up-delay">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-glass-border">
          <div className="lg:hidden p-4">
            <h3 className="font-medium text-text-primary">Portafolio de Clientes</h3>
            <p className="text-sm text-text-secondary">{pagination.total} clientes encontrados</p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto min-h-[400px] lg:min-h-[500px] lg:max-h-[600px] xl:max-h-[calc(100vh-350px)] w-full relative">
          {/* Desktop Table Body */}
          <div className="hidden lg:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 z-20">
                  <SortHeader 
                    label="Cliente" 
                    field="name" 
                    currentSortBy={pagination.sortBy} 
                    currentSortOrder={pagination.sortOrder} 
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border sticky left-0 z-30"
                  />
                  <SortHeader 
                    label="Cédula" 
                    field="idNumber" 
                    currentSortBy={pagination.sortBy} 
                    currentSortOrder={pagination.sortOrder} 
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Contacto</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Contratos</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Valor Total Lote</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Pendiente</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">% Recaudo</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Estado Mora</th>
                  <SortHeader 
                    label="Comportamiento" 
                    field="behavior" 
                    currentSortBy={pagination.sortBy} 
                    currentSortOrder={pagination.sortOrder} 
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Último Contacto</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={`portfolio-skeleton-${index}`} columns={11} />
                  ))
                ) : pagination.total === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center space-y-3">
                        <Users className="w-12 h-12 text-text-disabled" />
                        <p className="text-lg font-medium">No hay clientes en el portafolio</p>
                        <p className="text-sm">Agrega clientes para comenzar a gestionar tu portafolio</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagination.data.map((client) => (
                    <tr key={client.clientId} className="border-b border-glass-border hover:bg-glass-primary/20 transition-colors">
                      <td className="py-4 px-4 md:px-6 sticky left-0 z-10 bg-glass-secondary/95 backdrop-blur-sm border-r border-glass-border/30">
                        <p className="font-semibold text-text-primary whitespace-nowrap min-w-max">{client.clientName}</p>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <p className="text-sm text-text-primary">{client.cedula}</p>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <p className="text-sm text-text-primary">{client.phone}</p>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className="font-medium text-text-primary">
                          {client.totalContracts}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className="font-medium text-text-primary">
                          {formatCurrency(client.totalValue)}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className="font-medium text-text-primary">
                          {formatCurrency(client.totalPending)}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-text-primary">
                            {client.averageRecaudo}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getMoraColor(client.daysInArrears)}`}>
                          {getMoraText(client.daysInArrears)}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getBehaviorColor(client.behaviorTag)}`}>
                          {client.behaviorTag}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <span className="text-sm text-text-secondary">
                          {client.lastContact ? dayjs(client.lastContact).format('DD/MM/YYYY') : 'Sin contacto'}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="glass"
                            size="sm"
                            onClick={() => handleViewClient(client)}
                            className="glass-button min-h-[44px] min-w-[44px]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="glass"
                            size="sm"
                            className="glass-button min-h-[44px] min-w-[44px] text-accent-green hover:text-accent-green hover:bg-accent-green/20"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="glass"
                            size="sm"
                            className="glass-button min-h-[44px] min-w-[44px] text-accent-blue hover:text-accent-blue hover:bg-accent-blue/20"
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
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
            {pagination.total === 0 && !pagination.loading ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Users className="w-12 h-12 text-text-disabled" />
                  <p className="text-lg font-medium text-text-secondary">No hay clientes en el portafolio</p>
                  <p className="text-sm text-text-muted">Agrega clientes para comenzar a gestionar tu portafolio</p>
                  {(pagination.search || behaviorFilter !== 'ALL') && (
                    <Button
                      variant="glass"
                      onClick={() => {
                        pagination.handleSearch('')
                        setBehaviorFilter('ALL')
                      }}
                      className="glass-button"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              pagination.data.map((client) => (
                <PortfolioCard
                  key={client.clientId}
                  client={client}
                  onView={handleViewClient}
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
                onPageChange={pagination.goToPage}
                onLimitChange={pagination.changeLimit}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Client Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedClient(null)
        }}
        title="Detalle del Cliente"
        size="xl"
      >
        {selectedClient && !modalLoading ? (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Información del Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Nombre Completo</p>
                  <p className="font-medium text-text-primary">{selectedClient.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cédula</p>
                  <p className="font-medium text-text-primary">{selectedClient.cedula}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Teléfono</p>
                  <p className="font-medium text-text-primary">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Comportamiento</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getBehaviorColor(selectedClient.behaviorTag)}`}>
                    {selectedClient.behaviorTag}
                  </span>
                </div>
              </div>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-accent-blue/20 backdrop-blur-glass border border-glass-border rounded-lg p-4">
                <p className="text-sm text-text-secondary">Valor Total</p>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(selectedClient.totalValue)}
                </p>
              </div>
              <div className="bg-accent-green/20 backdrop-blur-glass border border-glass-border rounded-lg p-4">
                <p className="text-sm text-text-secondary">Total Pagado</p>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(selectedClient.totalPaid)}
                </p>
              </div>
              <div className="bg-accent-red/20 backdrop-blur-glass border border-glass-border rounded-lg p-4">
                <p className="text-sm text-text-secondary">Pendiente</p>
                <p className="text-lg font-bold text-text-primary">
                  {formatCurrency(selectedClient.totalPending)}
                </p>
              </div>
              <div className="bg-accent-purple/20 backdrop-blur-glass border border-glass-border rounded-lg p-4">
                <p className="text-sm text-text-secondary">% Recaudo</p>
                <p className="text-lg font-bold text-text-primary">
                  {selectedClient.averageRecaudo}%
                </p>
              </div>
            </div>

            {/* Contracts */}
            <div>
              <h3 className="font-medium text-text-primary mb-3">Contratos</h3>
              <div className="space-y-3">
                {selectedClient.contracts.map((contract) => (
                  <div key={contract.id} className="border border-glass-border rounded-lg p-4 bg-glass-primary/20 backdrop-blur-glass">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-text-primary">{contract.project}</h4>
                        <p className="text-sm text-text-muted">
                          Manzana {contract.manzana} - Lote #{contract.nomenclatura}
                        </p>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getMoraColor(contract.diasMora)}`}>
                        {getMoraText(contract.diasMora)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-text-secondary">Valor Total</p>
                        <p className="font-medium text-text-primary">
                          {formatCurrency(contract.valorTotal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Total Pagado</p>
                        <p className="font-medium text-text-primary">
                          {formatCurrency(contract.totalPagado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Cuotas</p>
                        <p className="font-medium text-text-primary">
                          {contract.cuotasPagadas}/{contract.totalCuotas}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Próximo Vencimiento</p>
                        <p className="font-medium text-text-primary">
                          {contract.proximoVencimiento ?
                            dayjs(contract.proximoVencimiento).format('DD/MM/YYYY') :
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pt-4 border-t border-glass-border">
                      {/* Initial Quotas */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-text-secondary font-semibold uppercase tracking-wider">Cuotas Iniciales</span>
                            <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">
                              {(contract as any).initialQuotaPercentage ? `${Number((contract as any).initialQuotaPercentage).toFixed(2)}%` : '0%'}
                            </span>
                          </div>
                          <span className="text-text-primary px-2 py-0.5 bg-glass-primary rounded">
                            {(contract as any).cuotasInicialesPagadas}/{(contract as any).totalCuotasIniciales}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-[10px] text-text-muted">
                            Recaudado: <span className="text-accent-green font-medium">{formatCurrency((contract as any).valorPagadoInicial)}</span>
                          </p>
                          <p className="text-[10px] text-text-muted">
                            Total: <span className="text-text-primary">{formatCurrency((contract as any).valorTotalInicial)}</span>
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 bg-glass-primary/30 rounded-full h-2 mr-2">
                            <div
                              className="bg-accent-purple h-2 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                              style={{ 
                                width: `${(contract as any).totalCuotasIniciales > 0 ? 
                                  ((contract as any).cuotasInicialesPagadas / (contract as any).totalCuotasIniciales) * 100 : 0}%` 
                                }}
                            />
                          </div>
                          <span className="text-xs font-bold text-accent-purple">
                            {(contract as any).totalCuotasIniciales > 0 ? 
                              (((contract as any).cuotasInicialesPagadas / (contract as any).totalCuotasIniciales) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Normal Quotas */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-secondary font-semibold uppercase tracking-wider">Cuotas Ordinarias</span>
                          <span className="text-text-primary px-2 py-0.5 bg-glass-primary rounded">
                            {(contract as any).cuotasNormalesPagadas}/{(contract as any).totalCuotasNormales}
                          </span>
                        </div>
                        <div className="flex justify-between items-end mb-1">
                          <p className="text-[10px] text-text-muted">
                            Recaudado: <span className="text-accent-green font-medium">{formatCurrency((contract as any).valorPagadoCuotas)}</span>
                          </p>
                          <p className="text-[10px] text-text-muted">
                            Total: <span className="text-text-primary">{formatCurrency((contract as any).valorTotalCuotas)}</span>
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 bg-glass-primary/30 rounded-full h-2 mr-2">
                            <div
                              className="bg-accent-blue h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                              style={{ 
                                width: `${(contract as any).totalCuotasNormales > 0 ? 
                                  ((contract as any).cuotasNormalesPagadas / (contract as any).totalCuotasNormales) * 100 : 0}%` 
                                }}
                            />
                          </div>
                          <span className="text-xs font-bold text-accent-blue">
                            {(contract as any).totalCuotasNormales > 0 ? 
                                (((contract as any).cuotasNormalesPagadas / (contract as any).totalCuotasNormales) * 100).toFixed(0) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ModalContentSkeleton />
        )}
      </Modal>
    </div>
  )
}