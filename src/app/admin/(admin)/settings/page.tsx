'use client'

import { useState } from 'react'
import { 
  Building2,
  Users,
  Settings,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  MessageSquare,
  Zap,
  Key,
  CheckCircle,
  X,
  Search
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatsCardSkeleton, TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import toast from 'react-hot-toast'

interface AdminUser {
  id: string
  email: string
  fullName: string
  role: 'ADMIN' | 'COBROS'
  createdAt: string
  isActive: boolean
}

interface TenantConfig {
  id: string
  name: string
  nit: string
  address: string
  phone: string
  email: string
  bankInfo: {
    banco: string
    tipoCuenta: string
    numeroCuenta: string
  }
  integrations: {
    whatsappEnabled: boolean
    whatsappApiKey?: string
    daptaEnabled: boolean
    daptaApiKey?: string
  }
}

// Mock data
const mockAdminUsers: AdminUser[] = [
  {
    id: '1',
    email: 'admin@inmobiliaria.com',
    fullName: 'Administrador Principal',
    role: 'ADMIN',
    createdAt: '2023-01-01',
    isActive: true
  },
  {
    id: '2',
    email: 'cobros@inmobiliaria.com',
    fullName: 'Juan Pérez',
    role: 'COBROS',
    createdAt: '2023-06-15',
    isActive: true
  }
]

const mockTenantConfig: TenantConfig = {
  id: '1',
  name: 'Alicante Inmobiliaria S.A.S.',
  nit: '900123456-1',
  address: 'Calle 100 #15-23, Bogotá, Colombia',
  phone: '+57 1 234 5678',
  email: 'info@alicante.com',
  bankInfo: {
    banco: 'Bancolombia',
    tipoCuenta: 'Ahorros',
    numeroCuenta: '12345678901'
  },
  integrations: {
    whatsappEnabled: true,
    whatsappApiKey: 'sk_test_whatsapp_123***',
    daptaEnabled: false,
    daptaApiKey: undefined
  }
}

export default function SettingsPage() {
  const { isAuthenticated } = useAdminAuthStore()
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'integrations'>('company')
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(mockTenantConfig)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    role: 'COBROS' as 'ADMIN' | 'COBROS',
    password: '',
    confirmPassword: ''
  })

  // Fetch admin users with pagination
  const fetchAdminUsers = async (page: number, limit: number, search?: string) => {
    try {
      // For now, simulate admin users using client data
      const response = await adminApi.getClients(page, limit)
      if (!response.data.success) {
        throw new Error('Error loading admin users')
      }

      let clients = response.data.data.clients || []
      
      // Transform clients to admin users format
      const adminUsers = clients.slice(0, 5).map((client: any, index: number) => ({
        id: `admin-${client.id || index}`,
        email: `${client.fullName?.toLowerCase().replace(/\s+/g, '.')}@alicante.com`,
        fullName: client.fullName || 'Usuario Admin',
        role: index === 0 ? 'ADMIN' : 'COBROS',
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: Math.random() > 0.2
      }))

      // Apply search filter
      let filteredUsers = adminUsers
      if (search && search.trim()) {
        const searchLower = search.toLowerCase()
        filteredUsers = adminUsers.filter(user =>
          user.fullName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        )
      }

      return {
        data: filteredUsers,
        total: Math.max(filteredUsers.length, 8), // Simulate having more users
        page: page,
        limit: limit,
        pages: Math.ceil(Math.max(filteredUsers.length, 8) / limit)
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
      throw error
    }
  }

  const usersPagination = useServerPagination({
    fetchData: fetchAdminUsers,
    dependencies: [],
    initialLimit: 5
  })

  const handleSaveCompanyInfo = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Información de la empresa guardada exitosamente')
    } catch (error) {
      alert('Error al guardar la información')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveIntegrations = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Configuración de integraciones guardada exitosamente')
    } catch (error) {
      alert('Error al guardar las integraciones')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setUserForm({
      email: '',
      fullName: '',
      role: 'COBROS',
      password: '',
      confirmPassword: ''
    })
    setIsUserModalOpen(true)
  }

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user)
    setUserForm({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      password: '',
      confirmPassword: ''
    })
    setIsUserModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (!userForm.fullName || !userForm.email) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    try {
      // Simulate API call for user creation/update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (selectedUser) {
        toast.success('Usuario actualizado exitosamente')
      } else {
        toast.success('Usuario creado exitosamente')
      }
      
      setIsUserModalOpen(false)
      // Refresh users list
      usersPagination.refresh()
    } catch (error) {
      toast.error('Error al guardar el usuario')
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success(`Usuario ${currentStatus ? 'desactivado' : 'activado'} exitosamente`)
      // Refresh users list  
      usersPagination.refresh()
    } catch (error) {
      toast.error('Error al cambiar el estado del usuario')
    }
  }

  const toggleApiKeyVisibility = (key: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const tabs = [
    { key: 'company', label: 'Información de la Empresa', icon: Building2 },
    { key: 'users', label: 'Usuarios Administradores', icon: Users },
    { key: 'integrations', label: 'Integraciones', icon: Settings }
  ]

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-responsive-2xl font-bold text-text-primary">Configuración</h1>
        <p className="text-text-secondary mt-2">
          Administra la configuración general del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-glass-border animate-fade-in-up animate-fade-in-up-delay">
        <nav className="flex flex-wrap gap-4 md:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors min-h-[44px]
                  ${activeTab === tab.key
                    ? 'border-accent-blue text-accent-blue'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-glass-border'
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Company Information Tab */}
      {activeTab === 'company' && (
        <div className="space-y-4 md:space-y-6">
          {configLoading ? (
            <>
              <StatsCardSkeleton className="h-64" />
              <StatsCardSkeleton className="h-48" />
            </>
          ) : (
            <>
              <Card variant="elevated" className="animate-fade-in-up">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold text-text-primary">Información de la Empresa</h3>
                <Button
                  onClick={handleSaveCompanyInfo}
                  loading={isSaving}
                  className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Nombre de la Empresa"
                    value={tenantConfig.name}
                    onChange={(e) => setTenantConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre de la empresa"
                  />

                  <Input
                    label="NIT"
                    value={tenantConfig.nit}
                    onChange={(e) => setTenantConfig(prev => ({ ...prev, nit: e.target.value }))}
                    placeholder="123456789-0"
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Dirección
                    </label>
                    <textarea
                      value={tenantConfig.address}
                      onChange={(e) => setTenantConfig(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="glass-input w-full px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                      placeholder="Dirección completa de la empresa"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Teléfono"
                    value={tenantConfig.phone}
                    onChange={(e) => setTenantConfig(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+57 1 234 5678"
                    icon={Phone}
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={tenantConfig.email}
                    onChange={(e) => setTenantConfig(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@empresa.com"
                    icon={Mail}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          <Card variant="elevated" className="animate-fade-in-up animate-fade-in-up-delay">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Información Bancaria</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Input
                  label="Banco"
                  value={tenantConfig.bankInfo.banco}
                  onChange={(e) => setTenantConfig(prev => ({
                    ...prev,
                    bankInfo: { ...prev.bankInfo, banco: e.target.value }
                  }))}
                  placeholder="Nombre del banco"
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={tenantConfig.bankInfo.tipoCuenta}
                    onChange={(e) => setTenantConfig(prev => ({
                      ...prev,
                      bankInfo: { ...prev.bankInfo, tipoCuenta: e.target.value }
                    }))}
                    className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                  >
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>

                <Input
                  label="Número de Cuenta"
                  value={tenantConfig.bankInfo.numeroCuenta}
                  onChange={(e) => setTenantConfig(prev => ({
                    ...prev,
                    bankInfo: { ...prev.bankInfo, numeroCuenta: e.target.value }
                  }))}
                  placeholder="1234567890"
                />
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4 md:space-y-6">
          <Card variant="elevated" className="animate-fade-in-up">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-text-primary">Usuarios Administradores</h3>
                  <Input
                    placeholder="Buscar usuarios..."
                    value={usersPagination.search}
                    onChange={(e) => usersPagination.handleSearch(e.target.value)}
                    icon={Search}
                    className="glass-input w-64"
                  />
                </div>
                <Button onClick={handleCreateUser} className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-glass-primary/30 backdrop-blur-glass border-b border-glass-border">
                    <tr>
                      <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Usuario</th>
                      <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Email</th>
                      <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Rol</th>
                      <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Estado</th>
                      <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersPagination.loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRowSkeleton key={index} columns={5} />
                      ))
                    ) : usersPagination.total === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-text-muted">
                          <div className="flex flex-col items-center space-y-3">
                            <Users className="w-12 h-12 text-text-disabled" />
                            <p className="text-lg font-medium">No hay usuarios administradores</p>
                            <p className="text-sm">Crea un nuevo usuario para comenzar</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      usersPagination.data.map((user) => (
                      <tr key={user.id} className="border-b border-glass-border hover:bg-glass-primary/20 transition-colors">
                        <td className="py-4 px-4 md:px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-glass-primary/30 backdrop-blur-sm rounded-full flex items-center justify-center mr-3 border border-glass-border">
                              <span className="text-sm font-medium text-text-primary">
                                {user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-text-primary">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 md:px-6 text-text-secondary">{user.email}</td>
                        <td className="py-4 px-4 md:px-6">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                            user.role === 'ADMIN' 
                              ? 'text-accent-purple bg-accent-purple/20 border-accent-purple/30' 
                              : 'text-accent-blue bg-accent-blue/20 border-accent-blue/30'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
                            user.isActive 
                              ? 'text-accent-green bg-accent-green/20 border-accent-green/30' 
                              : 'text-accent-red bg-accent-red/20 border-accent-red/30'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-4 px-4 md:px-6">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="glass-button min-h-[44px] min-w-[44px]"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              className={`glass-button min-h-[44px] min-w-[44px] ${
                                user.isActive 
                                  ? 'text-accent-red hover:text-accent-red hover:bg-accent-red/20'
                                  : 'text-accent-green hover:text-accent-green hover:bg-accent-green/20'
                              }`}
                            >
                              {user.isActive ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end px-4 py-3 border-t border-glass-border">
              <PaginationControls
                page={usersPagination.page}
                pages={usersPagination.pages}
                total={usersPagination.total}
                limit={usersPagination.limit}
                startIndex={usersPagination.startIndex}
                endIndex={usersPagination.endIndex}
                hasNextPage={usersPagination.hasNextPage}
                hasPreviousPage={usersPagination.hasPreviousPage}
                onPageChange={usersPagination.setPage}
                onLimitChange={usersPagination.setLimit}
              />
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4 md:space-y-6">
          {configLoading ? (
            <>
              <StatsCardSkeleton className="h-32" />
              <StatsCardSkeleton className="h-32" />
              <StatsCardSkeleton className="h-16" />
            </>
          ) : (
            <>
          {/* WhatsApp Integration */}
          <Card variant="elevated" className="animate-fade-in-up">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-green/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4 border border-glass-border">
                    <MessageSquare className="w-5 h-5 text-accent-green" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">WhatsApp Business API</h3>
                    <p className="text-sm text-text-secondary">Envío automático de mensajes de cobranza</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-text-secondary mr-3">
                    {tenantConfig.integrations.whatsappEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                  <button
                    onClick={() => setTenantConfig(prev => ({
                      ...prev,
                      integrations: {
                        ...prev.integrations,
                        whatsappEnabled: !prev.integrations.whatsappEnabled
                      }
                    }))}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${tenantConfig.integrations.whatsappEnabled ? 'bg-accent-green' : 'bg-glass-primary/30'}
                    `}
                  >
                    <span className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${tenantConfig.integrations.whatsappEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
              </div>

              {tenantConfig.integrations.whatsappEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      API Key de WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKeys.whatsapp ? 'text' : 'password'}
                        value={tenantConfig.integrations.whatsappApiKey || ''}
                        onChange={(e) => setTenantConfig(prev => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            whatsappApiKey: e.target.value
                          }
                        }))}
                        className="glass-input w-full pr-10 px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                        placeholder="Ingresa tu API Key de WhatsApp"
                      />
                      <button
                        type="button"
                        onClick={() => toggleApiKeyVisibility('whatsapp')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showApiKeys.whatsapp ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dapta Integration */}
          <Card variant="elevated" className="animate-fade-in-up animate-fade-in-up-delay">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-blue/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4 border border-glass-border">
                    <Zap className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Dapta AI</h3>
                    <p className="text-sm text-text-secondary">Llamadas automáticas con inteligencia artificial</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-text-secondary mr-3">
                    {tenantConfig.integrations.daptaEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                  <button
                    onClick={() => setTenantConfig(prev => ({
                      ...prev,
                      integrations: {
                        ...prev.integrations,
                        daptaEnabled: !prev.integrations.daptaEnabled
                      }
                    }))}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${tenantConfig.integrations.daptaEnabled ? 'bg-accent-blue' : 'bg-glass-primary/30'}
                    `}
                  >
                    <span className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${tenantConfig.integrations.daptaEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
              </div>

              {tenantConfig.integrations.daptaEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      API Key de Dapta
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKeys.dapta ? 'text' : 'password'}
                        value={tenantConfig.integrations.daptaApiKey || ''}
                        onChange={(e) => setTenantConfig(prev => ({
                          ...prev,
                          integrations: {
                            ...prev.integrations,
                            daptaApiKey: e.target.value
                          }
                        }))}
                        className="glass-input w-full pr-10 px-3 py-2 min-h-[44px] focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
                        placeholder="Ingresa tu API Key de Dapta"
                      />
                      <button
                        type="button"
                        onClick={() => toggleApiKeyVisibility('dapta')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showApiKeys.dapta ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveIntegrations}
              loading={isSaving}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
            </>
          )}
        </div>
      )}

      {/* User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={selectedUser ? 'Editar Usuario' : 'Crear Usuario'}
        size="md"
      >
        {isUserModalOpen ? (
          <div className="space-y-4">
          <Input
            label="Nombre Completo"
            value={userForm.fullName}
            onChange={(e) => setUserForm(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Nombre completo del usuario"
          />

          <Input
            label="Email"
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@empresa.com"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rol
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'COBROS' }))}
              className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
            >
              <option value="COBROS">Cobros</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <Input
            label={selectedUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Contraseña"
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            value={userForm.confirmPassword}
            onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirmar contraseña"
          />

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-glass-border">
            <Button
              variant="outline"
              onClick={() => setIsUserModalOpen(false)}
              className="glass-button min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={!userForm.fullName || !userForm.email}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
            >
              {selectedUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </div>
        </div>
        ) : (
          <ModalContentSkeleton />
        )}
      </Modal>
    </div>
  )
}