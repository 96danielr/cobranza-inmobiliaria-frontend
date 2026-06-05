'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Loader2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Upload,
  DollarSign
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
import { WhatsAppChatModal } from '@/components/WhatsAppChatModal'

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
  const { isAuthenticated, admin } = useAdminAuthStore()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<{ [contractId: string]: 'payments' | 'plan' | 'details' | null }>({})
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false)
  const [activeChatClient, setActiveChatClient] = useState<any>(null)
  
  // Manual Payment State inside Client Detail
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false)
  const [selectedContractForPayment, setSelectedContractForPayment] = useState<any>(null)
  const [manualAmount, setManualAmount] = useState('')
  const [manualBank, setManualBank] = useState('')
  const [manualObservations, setManualObservations] = useState('')
  const [manualCapture, setManualCapture] = useState<File | null>(null)
  const [manualPaymentMethod, setManualPaymentMethod] = useState<string>('Transferencia bancaria')
  const [manualPaymentOption, setManualPaymentOption] = useState<'minimo' | 'total' | 'otro'>('minimo')
  const [manualPaymentDate, setManualPaymentDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [banks, setBanks] = useState<any[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [behaviorFilter, setBehaviorFilter] = useState<'ALL' | 'DISPUESTO' | 'INDECISO' | 'EVASIVO'>('ALL')
  const [statsLoading, setStatsLoading] = useState(false)

  const [newClient, setNewClient] = useState({
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    behavior: 'N/A',
    password: ''
  })

  const [editClient, setEditClient] = useState({
    _id: '',
    name: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    behavior: 'N/A',
    contractsCount: 0
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


  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numValue)
  }

  const pendingQuotas = useMemo(() => {
    if (!selectedContractForPayment || !selectedContractForPayment.quotas) return []
    return selectedContractForPayment.quotas
      .filter((q: any) => q.status !== 'pagado')
      .sort((a: any, b: any) => {
        if (a.type === 'inicial' && b.type !== 'inicial') return -1;
        if (a.type !== 'inicial' && b.type === 'inicial') return 1;
        return a.number - b.number;
      })
  }, [selectedContractForPayment])

  const minPaymentAmount = useMemo(() => {
    return pendingQuotas.length > 0 ? (pendingQuotas[0].value - (pendingQuotas[0].amountPaid || 0)) : 0
  }, [pendingQuotas])

  const totalPaymentAmount = useMemo(() => {
    return pendingQuotas.reduce((sum: number, q: any) => sum + (q.value - (q.amountPaid || 0)), 0)
  }, [pendingQuotas])

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true)
      const response = await adminApi.getBanks(1, 1000, undefined, undefined, undefined, false)
      if (response.data.success) {
        setBanks(response.data.data.banks)
      }
    } catch (error) {
      console.error('Error fetching banks', error)
    } finally {
      setLoadingBanks(false)
    }
  }

  const handleOpenManualPayment = (contract: any) => {
    setSelectedContractForPayment(contract)
    setManualAmount('')
    setManualBank('')
    setManualObservations('')
    setManualCapture(null)
    setManualPaymentMethod('Transferencia bancaria')
    setManualPaymentOption('minimo')
    setManualPaymentDate(dayjs().format('YYYY-MM-DD'))
    setIsManualPaymentModalOpen(true)
    fetchBanks()
  }

  const handleRegisterManualPayment = async () => {
    if (pendingQuotas.length === 0) {
      toast.error('No hay cuotas pendientes para pagar')
      return
    }

    let finalAmount = 0
    if (manualPaymentOption === 'minimo') {
      finalAmount = minPaymentAmount
    } else if (manualPaymentOption === 'total') {
      finalAmount = totalPaymentAmount
    } else {
      if (!manualAmount || parseFloat(manualAmount) <= 0) {
        toast.error('Debe ingresar un monto válido a pagar')
        return
      }
      finalAmount = parseFloat(manualAmount)
    }

    if (manualPaymentMethod === 'Transferencia bancaria' && !manualBank) {
      toast.error('Debe seleccionar un banco para la transferencia')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('quotaId', pendingQuotas[0]._id)
      formData.append('amount', finalAmount.toString())
      formData.append('bank', manualPaymentMethod === 'Efectivo' ? 'EFECTIVO' : manualBank)
      formData.append('paymentMethod', manualPaymentMethod)
      formData.append('observations', manualObservations)
      if (manualCapture) {
        formData.append('capture', manualCapture)
      }
      formData.append('paymentDate', manualPaymentDate)

      await adminApi.registerManualPayment(formData)

      toast.success('Pago registrado y aprobado exitosamente')
      setIsManualPaymentModalOpen(false)
      
      // Reload client detail info to show updated numbers/reception list
      if (selectedClient) {
        setIsDetailsLoading(true)
        const response = await adminApi.getClient(selectedClient._id)
        if (response.data.success) {
          setSelectedClient(response.data.data)
        }
        setIsDetailsLoading(false)
      }
      pagination.refresh()
    } catch (error) {
      toast.error('Error al registrar el pago')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewClient = async (client: Client) => {
    setSelectedClient(client)
    setIsModalOpen(true)
    setIsDetailsLoading(true)
    setExpandedSection({})
    try {
      const response = await adminApi.getClient(client._id)
      if (response.data.success) {
        setSelectedClient(response.data.data)
      }
    } catch (error) {
      toast.error('Error al cargar detalles completos del cliente')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const handleOpenWhatsApp = (client: any) => {
    setActiveChatClient(client)
    setIsWhatsAppModalOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setEditClient({
      _id: client._id,
      name: client.name,
      idNumber: client.idNumber,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      behavior: client.behavior || 'N/A',
      contractsCount: client._count?.contracts || client.contracts?.length || 0
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editClient.name || !editClient.idNumber) {
      toast.error('Nombre y Cédula son obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      // Note: We need a putClient method in adminApi. Assuming it exists or using create pattern.
      // Looking at adminApi.ts from previous views, it has createClient but might need updateClient.
      // Wait, let me check adminApi.ts again if it has updateClient for clients.
      await adminApi.updateClient(editClient._id, editClient)
      toast.success('Cliente actualizado exitosamente')
      setIsEditModalOpen(false)
      pagination.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar cliente')
    } finally {
      setIsSubmitting(false)
    }
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
        behavior: 'N/A',
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
            <Card variant="elevated" className="stats-card stats-blue">
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

            <Card variant="elevated" className="stats-card stats-green">
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

            <Card variant="elevated" className="stats-card stats-red">
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

            <Card variant="elevated" className="stats-card stats-yellow">
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
                        {(client._count?.contracts || client.contracts?.length || 0) > 0 ? (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getBehaviorColor(client.behavior)}`}>
                            {client.behavior && client.behavior !== 'N/A' ? client.behavior : 'No definido'}
                          </span>
                        ) : (
                          <span className="text-xs text-text-disabled font-medium italic">Sin compras</span>
                        )}
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
                            onClick={() => handleOpenEdit(client)}
                            className="glass-button min-h-[44px] min-w-[44px] text-accent-blue hover:text-accent-blue hover:bg-accent-blue/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenWhatsApp(client)}
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
        size="xl"
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
                  {(selectedClient._count?.contracts || selectedClient.contracts?.length || 0) > 0 ? (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${getBehaviorColor(selectedClient.behavior)}`}>
                      {selectedClient.behavior}
                    </span>
                  ) : (
                    <span className="text-xs text-text-disabled font-medium italic">No aplica (Sin compras)</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Contratos</p>
                  <p className="font-medium text-text-primary">{selectedClient.contracts?.length || selectedClient._count?.contracts || 0}</p>
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
                  {selectedClient.contracts.map((contract: any, idx: number) => {
                    const nomenclature = contract.lot?.nomenclature
                      ? `${contract.lot.nomenclature} - E: ${contract.lot.stage || '-'} Mz: ${contract.lot.manzana || '-'} Lote: ${contract.lot.lotNumber || '-'}`
                      : contract.lot?.lotNumber
                      ? `Lote: E: ${contract.lot.stage || '-'} - M: ${contract.lot.manzana || '-'} - L: ${contract.lot.lotNumber}`
                      : `Contrato #${idx + 1}`;

                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const activeSection = expandedSection[contract._id] || null;

                    const toggleLocalSection = (section: 'payments' | 'plan' | 'details') => {
                      setExpandedSection(prev => ({
                        ...prev,
                        [contract._id]: prev[contract._id] === section ? null : section
                      }));
                    };

                    const paidQuotas = contract.quotas
                      ? contract.quotas.filter((q: any) => q.status === 'pagado')
                      : [];

                    return (
                      <div key={contract._id || idx} className="bg-glass-primary/20 backdrop-blur-sm border border-glass-border rounded-xl p-5 hover:bg-glass-primary/30 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                          <div>
                            <p className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-1">
                              {contract.negotiation || 'Contrato de Venta'}
                            </p>
                            <h4 className="font-bold text-text-primary text-lg">
                              {nomenclature}
                            </h4>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-text-secondary sm:text-sm">Valor Total</p>
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

                        <div className="mt-4 flex flex-wrap gap-2 items-center justify-between text-xs">
                          <p className="text-text-muted">
                            Fecha: {dayjs(contract.contractDate).format('DD/MM/YYYY')}
                          </p>
                          
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1 px-2.5 glass-button border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10"
                              onClick={() => window.open(`${apiBaseUrl}/public/statement/${contract._id}`, '_blank')}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Estado de Cuenta
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-[10px] py-1 px-2.5 glass-button ${activeSection === 'payments' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40' : 'border-glass-border text-text-secondary'}`}
                              onClick={() => toggleLocalSection('payments')}
                            >
                              Ver Pagos
                              {activeSection === 'payments' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-[10px] py-1 px-2.5 glass-button ${activeSection === 'plan' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40' : 'border-glass-border text-text-secondary'}`}
                              onClick={() => toggleLocalSection('plan')}
                            >
                              Plan de Pagos
                              {activeSection === 'plan' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className={`text-[10px] py-1 px-2.5 glass-button ${activeSection === 'details' ? 'bg-accent-blue/20 text-accent-blue border-accent-blue/40' : 'border-glass-border text-text-secondary'}`}
                              onClick={() => toggleLocalSection('details')}
                            >
                              Ver Contrato
                              {activeSection === 'details' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] py-1 px-2.5 glass-button border-accent-green/30 text-accent-green hover:bg-accent-green/10"
                              onClick={() => handleOpenManualPayment(contract)}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Reportar Pago
                            </Button>
                          </div>
                        </div>

                        {/* Collapsible Sections */}
                        {isDetailsLoading && activeSection && (
                          <div className="mt-4 pt-4 border-t border-glass-border/40 flex justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-accent-blue" />
                          </div>
                        )}

                        {!isDetailsLoading && activeSection === 'payments' && (
                          <div className="mt-4 pt-4 border-t border-glass-border/40 space-y-2 animate-fade-in-up">
                            <h5 className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-2">Recibos de Caja Emitidos</h5>
                            {paidQuotas.length === 0 ? (
                              <p className="text-xs text-text-muted italic">No hay pagos registrados o aprobados para este contrato.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-glass-border/50 text-text-secondary font-medium">
                                      <th className="py-2">Cuota</th>
                                      <th className="py-2">Fecha de Pago</th>
                                      <th className="py-2">Monto</th>
                                      <th className="py-2">Banco/Método</th>
                                      <th className="py-2 text-right">Recibo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {paidQuotas.map((q: any) => (
                                      <tr key={q._id} className="border-b border-glass-border/30 hover:bg-glass-primary/10 transition-colors">
                                        <td className="py-2 font-medium text-text-primary">#{q.number} ({q.type === 'inicial' ? 'Inicial' : 'Normal'})</td>
                                        <td className="py-2 text-text-secondary">{dayjs(q.paymentDate || q.updatedAt).format('DD/MM/YYYY')}</td>
                                        <td className="py-2 text-accent-green font-bold">
                                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(q.amountPaid || q.value || 0)}
                                        </td>
                                        <td className="py-2 text-text-secondary">{q.paymentBank || q.paymentMethod || 'N/A'}</td>
                                        <td className="py-2 text-right">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-[10px] py-0.5 px-2 glass-button border-accent-green/30 text-accent-green hover:bg-accent-green/10"
                                            onClick={() => window.open(`${apiBaseUrl}/public/receipt/${q._id}`, '_blank')}
                                          >
                                            Reimprimir
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {!isDetailsLoading && activeSection === 'plan' && (
                          <div className="mt-4 pt-4 border-t border-glass-border/40 space-y-2 animate-fade-in-up">
                            <h5 className="font-semibold text-text-primary text-xs uppercase tracking-wider mb-2">Plan de Pagos Completo</h5>
                            {(!contract.quotas || contract.quotas.length === 0) ? (
                              <p className="text-xs text-text-muted italic">Plan de pagos no disponible.</p>
                            ) : (
                              <div className="overflow-x-auto max-h-[250px] overflow-y-auto pr-1">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-glass-border/50 text-text-secondary font-medium sticky top-0 bg-glass-primary/90 backdrop-blur-sm">
                                      <th className="py-2">Cuota</th>
                                      <th className="py-2">Vencimiento</th>
                                      <th className="py-2">Valor Pactado</th>
                                      <th className="py-2">Abonado</th>
                                      <th className="py-2 text-right">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {contract.quotas.sort((a: any, b: any) => {
                                      if (a.type === 'inicial' && b.type !== 'inicial') return -1;
                                      if (a.type !== 'inicial' && b.type === 'inicial') return 1;
                                      return a.number - b.number;
                                    }).map((q: any) => {
                                      let statusBadgeColor = 'text-text-muted bg-glass-primary/20 border-glass-border';
                                      if (q.status === 'pagado') statusBadgeColor = 'text-accent-green bg-accent-green/10 border-accent-green/20';
                                      else if (q.status === 'pendiente') statusBadgeColor = 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20';
                                      else if (q.status === 'mora') statusBadgeColor = 'text-accent-red bg-accent-red/10 border-accent-red/20';

                                      return (
                                        <tr key={q._id} className="border-b border-glass-border/30 hover:bg-glass-primary/10 transition-colors">
                                          <td className="py-2 font-medium text-text-primary">#{q.number} ({q.type === 'inicial' ? 'Inicial' : 'Normal'})</td>
                                          <td className="py-2 text-text-secondary">{dayjs(q.dueDate).format('DD/MM/YYYY')}</td>
                                          <td className="py-2 text-text-primary font-bold">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(q.value || 0)}
                                          </td>
                                          <td className="py-2 text-text-secondary">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(q.amountPaid || 0)}
                                          </td>
                                          <td className="py-2 text-right">
                                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase ${statusBadgeColor}`}>
                                              {q.status}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {!isDetailsLoading && activeSection === 'details' && (
                          <div className="mt-4 pt-4 border-t border-glass-border/40 space-y-3 animate-fade-in-up">
                            <h5 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Detalles de la Negociación</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-glass-primary/10 border border-glass-border/30 p-3 rounded-lg">
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Negociación</p>
                                <p className="font-medium text-text-primary">{contract.negotiation || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Apéndice</p>
                                <p className="font-medium text-text-primary">{contract.appendix || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Fecha Inicio</p>
                                <p className="font-medium text-text-primary">{contract.startDate ? dayjs(contract.startDate).format('DD/MM/YYYY') : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Día de Pago</p>
                                <p className="font-medium text-text-primary">Día {contract.paymentDay || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Bono</p>
                                <p className="font-medium text-text-primary">{contract.bonus || 'Sin bono'}</p>
                              </div>
                              {contract.bonusValue > 0 && (
                                <div>
                                  <p className="text-text-secondary text-[10px] uppercase">Valor Bono</p>
                                  <p className="font-medium text-text-primary">
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(contract.bonusValue)}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Vendedor</p>
                                <p className="font-medium text-text-primary">{contract.commercial || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary text-[10px] uppercase">Estado Contrato</p>
                                <p className="font-medium text-accent-blue">{contract.status || 'ACTIVO'}</p>
                              </div>
                              {contract.revisadoPor && (
                                <div>
                                  <p className="text-text-secondary text-[10px] uppercase">Revisado Por</p>
                                  <p className="font-medium text-text-primary">{contract.revisadoPor}</p>
                                </div>
                              )}
                              {contract.observations && (
                                <div className="col-span-2 sm:col-span-3 border-t border-glass-border/30 pt-2">
                                  <p className="text-text-secondary text-[10px] uppercase">Observaciones</p>
                                  <p className="text-text-primary italic mt-0.5">{contract.observations}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-glass-border">
              <Button variant="outline" className="glass-button min-h-[44px]">
                <FileText className="w-4 h-4 mr-2" />
                Ver Historial
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleOpenWhatsApp(selectedClient)}
                className="glass-button text-accent-green border-accent-green/30 hover:bg-accent-green/20 min-h-[44px]"
              >
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

      {/* Registrar Pago Manual Modal */}
      <Modal
        isOpen={isManualPaymentModalOpen}
        onClose={() => {
          setIsManualPaymentModalOpen(false)
          setSelectedContractForPayment(null)
          setManualAmount('')
          setManualBank('')
          setManualObservations('')
          setManualCapture(null)
          setManualPaymentMethod('Transferencia bancaria')
          setManualPaymentOption('minimo')
        }}
        title="Registrar Pago Manual"
        size="lg"
      >
        <div className="space-y-6">
          {selectedContractForPayment && selectedClient && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border space-y-1">
                <p className="text-xs text-text-secondary uppercase">Cliente</p>
                <p className="font-bold text-text-primary text-base">{selectedClient.name}</p>
                <p className="text-xs text-text-muted">Cédula: {selectedClient.idNumber}</p>
                <p className="text-xs text-text-muted mt-2 border-t border-glass-border/30 pt-2 uppercase font-semibold text-accent-blue">
                  Contrato Lote: {selectedContractForPayment.lot?.nomenclature || `Lote: ${selectedContractForPayment.lot?.lotNumber || '-'}`}
                </p>
              </div>

              {/* Payment Method Selector */}
              {['superadmin', 'tenant_admin', 'company_admin'].includes(admin?.role || '') && (
                <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border space-y-3">
                  <label className="block text-sm font-semibold text-text-primary flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-accent-blue" />
                    Forma de Pago
                  </label>
                  <select
                    value={manualPaymentMethod}
                    onChange={(e) => {
                      setManualPaymentMethod(e.target.value)
                      if (e.target.value === 'Efectivo') {
                        setManualBank('')
                      }
                    }}
                    className="glass-input w-full px-4 py-3 text-base"
                  >
                    <option value="Transferencia bancaria">Transferencia bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Consignación en corresponsal">Consignación en corresponsal</option>
                    <option value="Consignación en banco">Consignación en banco</option>
                    <option value="Transferencia interbancaria">Transferencia interbancaria</option>
                    {['superadmin', 'tenant_admin', 'company_admin'].includes(admin?.role || '') && (
                      <option value="Cruce de cuentas">Cruce de cuentas</option>
                    )}
                  </select>
                </div>
              )}

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border space-y-4">
                <label className="block text-sm font-semibold text-text-primary">
                  ¿Cuánto desea registrar como pagado?
                </label>
                
                {pendingQuotas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Pago Mínimo */}
                    <div
                      onClick={() => {
                        setManualPaymentOption('minimo')
                        setManualAmount(minPaymentAmount.toString())
                      }}
                      className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                        manualPaymentOption === 'minimo'
                          ? 'bg-accent-blue/15 border-accent-blue shadow-glow'
                          : 'bg-glass-primary/10 border-glass-border hover:bg-glass-primary/20'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent-blue" />
                          Pago Mínimo
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal">Cuota #{pendingQuotas[0].number} pendiente</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-glass-border/30">
                        <span className="font-extrabold text-text-primary text-base">
                          {formatCurrency(minPaymentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Pago Total */}
                    <div
                      onClick={() => {
                        setManualPaymentOption('total')
                        setManualAmount(totalPaymentAmount.toString())
                      }}
                      className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                        manualPaymentOption === 'total'
                          ? 'bg-accent-green/15 border-accent-green shadow-glow'
                          : 'bg-glass-primary/10 border-glass-border hover:bg-glass-primary/20'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent-green" />
                          Pago Total
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal">Pagar deuda total acumulada</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-glass-border/30">
                        <span className="font-extrabold text-text-primary text-base">
                          {formatCurrency(totalPaymentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Otro Valor */}
                    <div
                      onClick={() => {
                        setManualPaymentOption('otro')
                        setManualAmount('')
                      }}
                      className={`flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                        manualPaymentOption === 'otro'
                          ? 'bg-accent-purple/15 border-accent-purple shadow-glow'
                          : 'bg-glass-primary/10 border-glass-border hover:bg-glass-primary/20'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-accent-purple" />
                          Otro Valor (Abonar)
                        </p>
                        <p className="text-[10px] text-text-muted mt-1 leading-normal">Monto personalizado libre</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-glass-border/30">
                        <span className="text-xs font-semibold text-text-secondary italic">
                          Ingresar monto...
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No hay cuotas pendientes para este contrato.</p>
                )}
              </div>

              {manualPaymentOption === 'otro' && pendingQuotas.length > 0 && (
                <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border animate-fade-in">
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent-purple" />
                    Ingrese el valor a registrar
                  </label>
                  <Input
                    type="number"
                    placeholder="Escriba el monto a pagar..."
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="glass-input h-12 text-lg"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Banco / Medio de Recibo
                  </label>
                  {manualPaymentMethod === 'Efectivo' && ['superadmin', 'tenant_admin', 'admin'].includes(admin?.role || '') ? (
                    <div className="h-12 px-4 rounded-xl border border-glass-border/30 bg-glass-primary/20 flex items-center text-text-disabled select-none">
                      Recibido en Efectivo (Caja)
                    </div>
                  ) : (
                    <>
                      <Combobox
                        options={banks.map(b => ({ value: b.acronym, label: b.acronym }))}
                        value={manualBank}
                        onChange={setManualBank}
                        placeholder="Seleccione un banco..."
                        searchPlaceholder="Buscar banco..."
                        className="h-12"
                      />
                      {loadingBanks && <p className="text-[10px] text-text-muted mt-1 animate-pulse">Cargando bancos...</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Valor a Registrar
                  </label>
                  <div className="h-12 px-4 rounded-xl border border-glass-border bg-glass-primary/20 flex items-center justify-between text-text-primary font-bold">
                    <span>
                      {formatCurrency(
                        manualPaymentOption === 'minimo'
                          ? minPaymentAmount
                          : manualPaymentOption === 'total'
                          ? totalPaymentAmount
                          : parseFloat(manualAmount) || 0
                      )}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                      manualPaymentOption === 'minimo'
                        ? 'bg-accent-blue/15 text-accent-blue'
                        : manualPaymentOption === 'total'
                        ? 'bg-accent-green/15 text-accent-green'
                        : 'bg-accent-purple/15 text-accent-purple'
                    }`}>
                      {manualPaymentOption === 'minimo' ? 'Mínimo' : manualPaymentOption === 'total' ? 'Total' : 'Abono'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Comprobante / Captura (Opcional)
                </label>
                <div className="relative group">
                  <Input
                    type="file"
                    onChange={(e) => setManualCapture(e.target.files?.[0] || null)}
                    className="glass-input h-14 pt-3 flex-1 file:hidden cursor-pointer"
                    accept="image/*,.pdf"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-text-muted italic">
                    {manualCapture ? manualCapture.name : 'Subir archivo...'}
                  </div>
                </div>
              </div>

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <label className="block text-sm font-medium text-text-primary mb-2">Observaciones</label>
                <textarea
                  placeholder="Observaciones de este pago..."
                  value={manualObservations}
                  onChange={(e) => setManualObservations(e.target.value)}
                  className="glass-input w-full min-h-[80px] p-3 text-sm focus:ring-2 focus:ring-accent-blue/50"
                />
              </div>

              <div className="bg-glass-primary/30 p-4 rounded-xl border border-glass-border">
                <label className="block text-sm font-medium text-text-primary mb-2">Fecha del Pago</label>
                <Input
                  type="date"
                  value={manualPaymentDate}
                  onChange={(e) => setManualPaymentDate(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-glass-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsManualPaymentModalOpen(false)
                setSelectedContractForPayment(null)
              }}
              className="glass-button"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRegisterManualPayment}
              loading={isSubmitting}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30"
            >
              Registrar y Aprobar Pago
            </Button>
          </div>
        </div>
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
      {/* WhatsApp Chat Modal */}
      <WhatsAppChatModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false)
          setActiveChatClient(null)
        }}
        client={activeChatClient}
      />

      {/* Edit Client Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Cliente"
        size="lg"
      >
        <form onSubmit={handleUpdateClient} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Nombre Completo *</label>
              <Input
                placeholder="Ej. Juan Pérez"
                value={editClient.name}
                onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Cédula / ID *</label>
              <Input
                placeholder="Sin puntos ni comas"
                value={editClient.idNumber}
                onChange={(e) => setEditClient({ ...editClient, idNumber: e.target.value })}
                className="glass-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Teléfono</label>
              <Input
                placeholder="Ej. 3101234567"
                value={editClient.phone}
                onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={editClient.email}
                onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                className="glass-input"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-text-secondary">Dirección</label>
              <Input
                placeholder="Dirección de residencia"
                value={editClient.address}
                onChange={(e) => setEditClient({ ...editClient, address: e.target.value })}
                className="glass-input"
              />
            </div>
            {editClient.contractsCount > 0 && (
              <div className="space-y-2 md:col-span-2 animate-fade-in">
                <label className="text-sm font-medium text-text-secondary">Estado / Comportamiento de pago</label>
                <Combobox
                  value={editClient.behavior}
                  onChange={(val) => setEditClient({ ...editClient, behavior: val as string })}
                  options={[
                    { value: 'DISPUESTO', label: 'Dispuesto' },
                    { value: 'INDECISO', label: 'Indeciso' },
                    { value: 'EVASIVO', label: 'Evasivos' },
                    { value: 'N/A', label: 'No definido' },
                  ]}
                  placeholder="Seleccione estado"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-glass-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="glass-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-w-[120px]"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}