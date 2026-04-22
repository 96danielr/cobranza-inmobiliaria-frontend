'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Download,
  Eye,
  Phone,
  MessageSquare,
  Plus,
  Edit,
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SortHeader } from '@/components/ui/SortHeader'
import { StatsCardSkeleton, TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { ClientCard, ClientCardSkeleton } from '@/components/ui/ClientCard'
import { PaginationControls } from '@/components/ui/Pagination'
import { Combobox } from '@/components/ui/Combobox'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { useClientStore } from '@/stores/clientStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface Client {
  _id: string
  name: string
  idNumber: string
  phone: string
  email?: string
  address?: string
  behavior: string
  excelRowId?: number
  createdAt: string
  _count?: {
    contracts: number
  }
  contracts?: any[]
}

interface ApiResponse {
  success: boolean
  data: {
    clients: Client[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

export default function ClientsPage() {
  const { clients: storeClients, setClients } = useClientStore()
  const { isAuthenticated } = useAdminAuthStore()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [behaviorFilter, setBehaviorFilter] = useState<'ALL' | 'DISPUESTO' | 'INDECISO' | 'EVASIVO'>('ALL')
  const [statsLoading, setStatsLoading] = useState(false)

  const [newClient, setNewClient] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    behavior: 'INDECISO',
    password: ''
  })

  // Fetch clients with pagination and filtering
  const fetchClients = useCallback(async (page: number, limit: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    try {
      const response = await adminApi.getClients(page, limit, search, sortBy, sortOrder)
      if (!response.data.success) {
        throw new Error('Error loading clients')
      }

      const freshClients = response.data.data.clients || []

      // Update global store if we're on the first page without search
      if (page === 1 && !search) {
        setClients(freshClients, response.data.data.pagination.total)
      }

      let filteredClients = freshClients

      // Apply behavior filter
      if (behaviorFilter !== 'ALL') {
        filteredClients = filteredClients.filter((client: Client) => client.behavior === behaviorFilter)
      }

      return {
        data: filteredClients,
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit,
        pages: response.data.data.pagination.pages
      }
    } catch (error) {

      throw error
    }
  }, [behaviorFilter])

  const pagination = useServerPagination({
    fetchData: fetchClients,
    initialLimit: 20
  })

  // Remove format currency function as we're not using financial data yet

  const getBehaviorColor = (behavior: string) => {
    switch (behavior) {
      case 'DISPUESTO':
        return 'text-accent-green bg-accent-green/20 border-accent-green/30'
      case 'INDECISO':
        return 'text-accent-yellow bg-accent-yellow/20 border-accent-yellow/30'
      case 'EVASIVO':
        return 'text-accent-red bg-accent-red/20 border-accent-red/30'
      case 'N/A':
      case '':
        return 'text-text-muted bg-glass-primary/10 border-glass-border/40'
      default:
        return 'text-text-muted bg-glass-primary/20 border-glass-border'
    }
  }


  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setIsModalOpen(true)
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClient.name || !newClient.idNumber) {
      toast.error('Nombre y Cédula son obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      await adminApi.createClient(newClient)
      toast.success('Cliente creado exitosamente')
      setIsCreateModalOpen(false)
      setNewClient({
        name: '',
        idNumber: '',
        phone: '',
        email: '',
        address: '',
        behavior: 'INDECISO',
        password: ''
      })
      pagination.refresh()
    } catch (error: any) {

      toast.error(error.response?.data?.message || 'Error al crear cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate stats from real data
  const totalClients = pagination.total || 0

  // Real stats based on the data we have
  const clientsDispuestos = pagination.data.filter(c => c.behavior === 'DISPUESTO').length
  const clientsEvasivos = pagination.data.filter(c => c.behavior === 'EVASIVO').length
  const clientsIndecisos = pagination.data.filter(c => c.behavior === 'INDECISO').length

  return (
    <div className="flex flex-col min-h-full space-y-4 md:space-y-6 px-1 py-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Gestión de Clientes</h1>
          <p className="text-text-secondary mt-2">
            Administra la información y comportamiento de todos los clientes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="glass-button min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
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
                    <User className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Total Clientes</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{totalClients}</p>
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
                    <p className="text-sm text-text-secondary font-medium">Dispuestos</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{clientsDispuestos}</p>
                    <p className="text-xs text-accent-green">
                      {totalClients > 0 ? ((clientsDispuestos / totalClients) * 100).toFixed(1) : 0}%
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
                    <p className="text-sm text-text-secondary font-medium">Evasivos</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{clientsEvasivos}</p>
                    <p className="text-xs text-accent-red">
                      {totalClients > 0 ? ((clientsEvasivos / totalClients) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-accent-yellow/20 backdrop-blur-sm rounded-full border border-glass-border">
                    <AlertTriangle className="w-6 h-6 text-accent-yellow" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-text-secondary font-medium">Indecisos</p>
                    <p className="text-responsive-xl font-bold text-text-primary">{clientsIndecisos}</p>
                    <p className="text-xs text-accent-yellow">
                      {totalClients > 0 ? ((clientsIndecisos / totalClients) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card variant="interactive" className="animate-fade-in-up animate-fade-in-up-delay relative z-40">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, cédula, teléfono..."
                value={pagination.search}
                onChange={(e) => pagination.handleSearch(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="lg:w-72">
              <Combobox
                value={behaviorFilter}
                onChange={(val) => setBehaviorFilter(val as any)}
                options={[
                  { value: 'ALL', label: 'Todos los comportamientos' },
                  { value: 'DISPUESTO', label: 'Dispuestos' },
                  { value: 'INDECISO', label: 'Indecisos' },
                  { value: 'EVASIVO', label: 'Evasivos' },
                  { value: 'N/A', label: 'No definido' },
                ]}
                placeholder="Filtrar por comportamiento"
                searchPlaceholder="Buscar estado..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List - Hybrid View with Independent Scroll */}
      <Card variant="elevated" className="flex-1 flex flex-col min-h-0 animate-fade-in-up animate-fade-in-up-delay">
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto min-h-[400px] lg:min-h-[500px] lg:max-h-[600px] xl:max-h-[calc(100vh-350px)] w-100 xl:max-w-[900px] 2xl:max-w-[1560px] relative">
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
                    className="py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <SortHeader
                    label="Cédula"
                    field="idNumber"
                    currentSortBy={pagination.sortBy}
                    currentSortOrder={pagination.sortOrder}
                    onSort={pagination.handleSort}
                    className="py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border w-40"
                  />
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Contacto</th>
                  <SortHeader
                    label="Comportamiento"
                    field="behavior"
                    currentSortBy={pagination.sortBy}
                    currentSortOrder={pagination.sortOrder}
                    onSort={pagination.handleSort}
                    className="py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border w-48"
                  />
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border w-56">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={5} />
                  ))
                ) : pagination.total === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center space-y-3">
                        <User className="w-12 h-12 text-text-disabled" />
                        <p className="text-lg font-medium">No hay clientes registrados</p>
                        <p className="text-sm">Agrega un nuevo cliente para comenzar</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagination.data.map((client) => (
                    <tr key={client._id} className="border-b border-glass-border hover:bg-glass-primary/20 transition-colors">

                      <td className="py-2 px-4 md:px-6">
                        <p className="font-medium text-text-primary whitespace-nowrap">{client.name}</p>
                      </td>
                      <td className="py-2 px-4 md:px-6 font-mono text-xs text-text-muted w-40">
                        {client.idNumber || 'Sin Cédula'}
                      </td>
                      <td className="py-2 px-4 md:px-6">
                        <div>
                          <p className="text-sm text-text-primary">{client.phone}</p>
                          {client.email && (
                            <p className="text-xs text-text-muted">{client.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 md:px-6 w-48">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getBehaviorColor(client.behavior)}`}>
                          {client.behavior && client.behavior !== 'N/A' ? client.behavior : 'No definido'}
                        </span>
                      </td>
                      <td className="py-2 px-4 md:px-6 w-56">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClient(client)}
                            className="glass-button min-h-[44px] min-w-[44px]"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button min-h-[44px] min-w-[44px] text-accent-blue hover:text-accent-blue hover:bg-accent-blue/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button min-h-[44px] min-w-[44px] text-accent-green hover:text-accent-green hover:bg-accent-green/20"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button min-h-[44px] min-w-[44px] text-accent-purple hover:text-accent-purple hover:bg-accent-purple/20"
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
            {pagination.loading ? (
              // Loading skeletons for cards
              Array.from({ length: 6 }).map((_, index) => (
                <ClientCardSkeleton key={`card-skeleton-${index}`} />
              ))
            ) : pagination.total === 0 ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <User className="w-12 h-12 text-text-disabled" />
                  <p className="text-lg font-medium text-text-secondary">No hay clientes registrados</p>
                  <p className="text-sm text-text-muted">Agrega un nuevo cliente para comenzar</p>
                  {(pagination.search || behaviorFilter !== 'ALL') && (
                    <Button
                      variant="outline"
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
                <ClientCard
                  key={client._id}
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
        size="lg"
      >
        {selectedClient ? (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg p-4">
              <h3 className="font-medium text-text-primary mb-3">Información Personal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Nombre Completo</p>
                  <p className="font-medium text-text-primary">{selectedClient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cédula</p>
                  <p className="font-medium text-text-primary">{selectedClient.idNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Teléfono</p>
                  <p className="font-medium text-text-primary">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Email</p>
                  <p className="font-medium text-text-primary">{selectedClient.email || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cliente desde</p>
                  <p className="font-medium text-text-primary">
                    {dayjs(selectedClient.createdAt).format('DD/MM/YYYY')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Comportamiento</p>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getBehaviorColor(selectedClient.behavior)}`}>
                    {selectedClient.behavior}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Contratos</p>
                  <p className="font-medium text-text-primary">{selectedClient._count?.contracts || 0}</p>
                </div>
              </div>
            </div>

            {/* Contracts Info */}
            {selectedClient.contracts && selectedClient.contracts.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent-blue" />
                  Contratos ({selectedClient.contracts.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedClient.contracts.map((contract: any, idx: number) => (
                    <div key={contract._id || idx} className="bg-glass-primary/20 backdrop-blur-sm border border-glass-border rounded-xl p-5 hover:bg-glass-primary/30 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-1">
                            {contract.negotiation || 'Contrato de Venta'}
                          </p>
                          <h4 className="font-bold text-text-primary text-lg">
                            {contract.lot?.lotNumber ? `Lote ${contract.lot.lotNumber}` : `Contrato #${idx + 1}`}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-text-secondary">Valor Total</p>
                          <p className="text-lg font-black text-text-primary">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(contract.totalValue || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-b border-glass-border/50">
                        <div>
                          <p className="text-xs text-text-secondary uppercase mb-1">Cuota Inicial</p>
                          <div className="flex flex-col">
                            <p className="font-bold text-text-primary">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(contract.valorTotalInicial || 0)}
                            </p>
                            <span className="text-[10px] sm:text-xs font-medium text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full w-fit mt-1">
                              {contract.initialQuotaPercentage ? `${Number(contract.initialQuotaPercentage).toFixed(2)}%` : '0%'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary uppercase mb-1">Cuotas Normales</p>
                          <p className="font-bold text-text-primary">
                            {contract.totalCuotasNormales || contract.installmentsCount || 0} de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(contract.installmentValue || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary uppercase mb-1">Recaudado</p>
                          <p className="font-bold text-accent-green">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(contract.totalPagado || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary uppercase mb-1">Saldo</p>
                          <p className="font-bold text-accent-red">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format((contract.totalValue || 0) - (contract.totalPagado || 0))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <p className="text-xs text-text-muted">
                          Fecha: {dayjs(contract.contractDate).format('DD/MM/YYYY')}
                        </p>
                        <Link href={`/admin/payments?search=${selectedClient.name}`} className="text-xs font-bold text-accent-blue hover:underline">
                          Ver Pagos →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-glass-border">
              <Button variant="outline" className="glass-button min-h-[44px]">
                <FileText className="w-4 h-4 mr-2" />
                Ver Historial
              </Button>
              <Button variant="outline" className="glass-button text-accent-green border-accent-green/30 hover:bg-accent-green/20 min-h-[44px]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar WhatsApp
              </Button>
              <Button className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]">
                <Phone className="w-4 h-4 mr-2" />
                Programar Llamada
              </Button>
            </div>
          </div>
        ) : (
          <ModalContentSkeleton />
        )}
      </Modal>

      {/* New Client Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Agregar Nuevo Cliente"
        size="lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Nombre Completo *</label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Cédula / ID *</label>
              <Input
                placeholder="Sin puntos ni comas"
                value={newClient.idNumber}
                onChange={(e) => setNewClient({ ...newClient, idNumber: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Teléfono</label>
              <Input
                placeholder="Ej. 3101234567"
                value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-text-secondary">Dirección</label>
              <Input
                placeholder="Dirección de residencia"
                value={newClient.address}
                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-text-secondary">Contraseña para el Portal (Opcional)</label>
              <Input
                type="password"
                placeholder="Asigna una contraseña para que el cliente ingrese"
                value={newClient.password}
                onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                className="glass-input"
              />
              <p className="text-[10px] text-text-muted">Si ingresas una contraseña y el cliente tiene email, se habilitará su acceso automáticamente.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-text-secondary">Estado / Comportamiento inicial</label>
              <Combobox
                value={newClient.behavior}
                onChange={(val) => setNewClient({ ...newClient, behavior: val as string })}
                options={[
                  { value: 'ALL', label: 'No definido' },
                  { value: 'DISPUESTO', label: 'Dispuesto' },
                  { value: 'INDECISO', label: 'Indeciso' },
                  { value: 'EVASIVO', label: 'Evasivo' },
                ]}
                placeholder="Seleccione estado"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-glass-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="glass-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-w-[120px]"
            >
              Crear Cliente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}