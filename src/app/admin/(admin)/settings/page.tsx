'use client'

import { useState, useEffect } from 'react'
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
  Search,
  Smartphone,
  Upload
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
  accountId: string
  email: string
  fullName: string
  role: string
  createdAt: string
  status: 'active' | 'inactive'
  accountStatus: string
  lastLogin?: string
}

interface TenantConfig {
  id: string
  name: string
  slug?: string
  nit: string
  address: string
  phone: string
  email: string
  bankInfo: {
    banco: string
    tipoCuenta: string
    numeroCuenta: string
  }
  bankAccounts?: Array<{
    _id?: string
    banco: string
    tipoCuenta: string
    numeroCuenta: string
    titular?: string
    qrCode?: string
    isActive: boolean
  }>
  integrations: {
    whatsappEnabled: boolean
    whatsappApiKey?: string
    whatsappWabaId?: string
    whatsappPhoneId?: string
    whatsappAccessToken?: string
    whatsappDisplayPhone?: string
    whatsappVerifiedName?: string
    whatsappConnectedAt?: string
    daptaEnabled: boolean
    daptaApiKey?: string
  }
  logo?: string
  projectLogo?: string
}

// Mock data
const mockAdminUsers: AdminUser[] = []

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
  bankAccounts: [],
  integrations: {
    whatsappEnabled: true,
    whatsappApiKey: 'sk_test_whatsapp_123***',
    daptaEnabled: false,
    daptaApiKey: undefined
  },
  logo: '',
  projectLogo: ''
}

export default function SettingsPage() {
  const { isAuthenticated } = useAdminAuthStore()
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'integrations' | 'quotas'>('company')
  const [limits, setLimits] = useState<any[]>([])
  const [usage, setUsage] = useState<any[]>([])
  const [limitsLoading, setLimitsLoading] = useState(false)
  const [tenantConfig, setTenantConfig] = useState<TenantConfig>(mockTenantConfig)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<{ [key: string]: boolean }>({})
  const [isSaving, setIsSaving] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)

  // Bank accounts states
  const [availableBanks, setAvailableBanks] = useState<any[]>([])
  const [isBankModalOpen, setIsBankModalOpen] = useState(false)
  const [selectedBankIndex, setSelectedBankIndex] = useState<number | null>(null)
  const [bankForm, setBankForm] = useState({
    banco: '',
    tipoCuenta: 'Ahorros',
    numeroCuenta: '',
    titular: '',
    qrCode: '',
    isActive: true
  })

  const selectedCompanyId = useAdminAuthStore(state => state.selectedCompanyId)

  // Fetch company config
  const fetchCompanyConfig = async () => {
    if (!selectedCompanyId) return
    setConfigLoading(true)
    try {
      const response = await adminApi.getCompany(selectedCompanyId)
      if (response.data.success) {
        const companyData = response.data.data.company
        setTenantConfig({
          id: companyData._id,
          name: companyData.name,
          slug: companyData.slug || '',
          nit: companyData.nit || '',
          address: companyData.address || '',
          phone: companyData.phone || '',
          email: companyData.email || '',
          bankInfo: companyData.bankInfo || {
            banco: '',
            tipoCuenta: 'Ahorros',
            numeroCuenta: ''
          },
          bankAccounts: companyData.bankAccounts || [],
          integrations: companyData.integrations || {
            whatsappEnabled: false,
            daptaEnabled: false
          },
          logo: companyData.logo || '',
          projectLogo: companyData.projectLogo || ''
        })
      }
    } catch (error) {
      toast.error('Error al cargar la configuración')
    } finally {
      setConfigLoading(false)
    }
  }

  const fetchAvailableBanks = async () => {
    try {
      const response = await adminApi.getBanks(1, 100)
      if (response.data.success) {
        setAvailableBanks(response.data.data.banks)
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  const fetchLimits = async () => {
    setLimitsLoading(true)
    try {
      const [limitsRes, usageRes] = await Promise.all([
        adminApi.getLimits(),
        adminApi.getUsageStats({ feature: 'ai_chat' })
      ])
      if (limitsRes.data.success) setLimits(limitsRes.data.data)
      if (usageRes.data.success) setUsage(usageRes.data.data)
    } catch (error) {
      console.error('Error fetching limits:', error)
    } finally {
      setLimitsLoading(false)
    }
  }

  const saveBankAccounts = async (newAccounts: any[]) => {
    if (!selectedCompanyId) return
    setIsSaving(true)
    try {
      await adminApi.updateCompany(selectedCompanyId, {
        bankAccounts: newAccounts
      })
      toast.success('Cuentas bancarias actualizadas exitosamente')
      fetchCompanyConfig()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar cuentas bancarias')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateBankAccount = () => {
    setSelectedBankIndex(null)
    setBankForm({
      banco: '',
      tipoCuenta: 'Ahorros',
      numeroCuenta: '',
      titular: '',
      qrCode: '',
      isActive: true
    })
    setIsBankModalOpen(true)
  }

  const handleEditBankAccount = (index: number) => {
    const acc = tenantConfig.bankAccounts?.[index]
    if (!acc) return
    setSelectedBankIndex(index)
    setBankForm({
      banco: acc.banco,
      tipoCuenta: acc.tipoCuenta,
      numeroCuenta: acc.numeroCuenta,
      titular: acc.titular || '',
      qrCode: acc.qrCode || '',
      isActive: acc.isActive
    })
    setIsBankModalOpen(true)
  }

  const handleDeleteBankAccount = async (index: number) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta bancaria?')) return
    const currentAccounts = tenantConfig.bankAccounts ? [...tenantConfig.bankAccounts] : []
    currentAccounts.splice(index, 1)
    await saveBankAccounts(currentAccounts)
  }

  const handleToggleBankAccountStatus = async (index: number) => {
    const currentAccounts = tenantConfig.bankAccounts ? [...tenantConfig.bankAccounts] : []
    if (!currentAccounts[index]) return
    currentAccounts[index] = {
      ...currentAccounts[index],
      isActive: !currentAccounts[index].isActive
    }
    await saveBankAccounts(currentAccounts)
  }

  const handleQrCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 2MB)')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setBankForm(prev => ({
        ...prev,
        qrCode: reader.result as string
      }))
      toast.success('QR cargado exitosamente')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveBankAccount = async () => {
    if (!bankForm.banco || !bankForm.numeroCuenta) {
      toast.error('Banco y Número de cuenta son obligatorios')
      return
    }

    const currentAccounts = tenantConfig.bankAccounts ? [...tenantConfig.bankAccounts] : []
    
    if (selectedBankIndex !== null) {
      // Edit
      currentAccounts[selectedBankIndex] = {
        ...currentAccounts[selectedBankIndex],
        ...bankForm
      }
    } else {
      // Add new
      currentAccounts.push({
        ...bankForm
      })
    }

    setIsBankModalOpen(false)
    await saveBankAccounts(currentAccounts)
  }

  // Load data on mount or company change
  useEffect(() => {
    fetchCompanyConfig()
    fetchAvailableBanks()
    if (activeTab === 'quotas') fetchLimits()
  }, [selectedCompanyId, activeTab])

  // User form state
  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    role: 'agent' as string,
    password: '',
    confirmPassword: ''
  })

  // Fetch admin users with pagination
  const fetchAdminUsers = async (page: number, limit: number, search?: string) => {
    try {
      const response = await adminApi.getAdminUsers(page, limit, search)
      if (!response.data.success) {
        throw new Error('Error loading admin users')
      }

      const { users, pagination } = response.data.data

      return {
        data: users,
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        pages: pagination.pages
      }
    } catch (error) {

      throw error
    }
  }

  const usersPagination = useServerPagination({
    fetchData: fetchAdminUsers,
    dependencies: [],
    initialLimit: 5
  })

  const handleSaveCompanyInfo = async () => {
    if (!selectedCompanyId) return
    setIsSaving(true)
    try {
      await adminApi.updateCompany(selectedCompanyId, {
        name: tenantConfig.name,
        nit: tenantConfig.nit,
        address: tenantConfig.address,
        phone: tenantConfig.phone,
        email: tenantConfig.email,
        bankInfo: tenantConfig.bankInfo,
        logo: tenantConfig.logo,
        projectLogo: tenantConfig.projectLogo
      })
      toast.success('Información de la empresa guardada exitosamente')
      fetchCompanyConfig() // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar la información')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveIntegrations = async () => {
    if (!selectedCompanyId) return
    setIsSaving(true)
    try {
      await adminApi.updateCompany(selectedCompanyId, {
        integrations: tenantConfig.integrations
      })
      toast.success('Configuración de integraciones guardada exitosamente')
      fetchCompanyConfig() // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar las integraciones')
    } finally {
      setIsSaving(false)
    }
  }

  const copyAccountsLink = () => {
    if (!tenantConfig.slug) {
      toast.error('No se pudo generar el enlace. Falta el identificador de la empresa.')
      return
    }
    const link = `${window.location.origin}/p/${tenantConfig.slug}/accounts`
    navigator.clipboard.writeText(link)
    toast.success('¡Enlace de cuentas copiado al portapapeles!')
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
      setIsSaving(true)
      if (selectedUser) {
        // Update user
        await adminApi.updateAdminUser(selectedUser.id, {
          fullName: userForm.fullName,
          role: userForm.role
        })

        // Update password if provided
        if (userForm.password) {
          await adminApi.changeAdminPassword(selectedUser.id, userForm.password)
        }

        toast.success('Usuario actualizado exitosamente')
      } else {
        // Create user
        if (!userForm.password) {
          toast.error('La contraseña es requerida para nuevos usuarios')
          return
        }
        await adminApi.createAdminUser({
          fullName: userForm.fullName,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role
        })
        toast.success('Usuario creado exitosamente')
      }

      setIsUserModalOpen(false)
      usersPagination.refresh()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el usuario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: 'active' | 'inactive') => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await adminApi.updateAdminUser(userId, { status: newStatus })
      toast.success(`Usuario ${newStatus === 'inactive' ? 'desactivado' : 'activado'} exitosamente`)
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
    { key: 'integrations', label: 'Integraciones', icon: Settings },
    { key: 'quotas', label: 'Límites y Cuotas', icon: Shield }
  ]

  return (
    <div className="space-y-4 md:space-y-6 px-1 py-2 md:p-6">
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

              {/* Logos de la Empresa y del Proyecto */}
              <Card variant="elevated" className="animate-fade-in-up mt-6">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-accent-blue animate-pulse" />
                        Logos de Identidad de Marca
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Sube y configura los logos que aparecerán en los encabezados del Plan de Pagos (PDF) y de los recibos de caja.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Empresa */}
                    <div className="space-y-4 p-4 rounded-xl bg-glass-primary/5 border border-glass-border/30">
                      <div>
                        <span className="text-sm font-semibold text-text-primary block">Logo de la Empresa (Lado Izquierdo)</span>
                        <span className="text-xs text-text-secondary block mt-1">Se muestra en la esquina superior izquierda del plan de pagos.</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {tenantConfig.logo ? (
                          <div className="relative w-28 h-16 border border-glass-border bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                            <img src={tenantConfig.logo} alt="Logo Empresa" className="max-w-full max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                setTenantConfig(prev => ({ ...prev, logo: '' }))
                                toast.success('Logo de la empresa removido. Guarda los cambios para aplicar.')
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="w-28 h-16 border-2 border-dashed border-glass-border rounded-lg flex items-center justify-center text-[10px] text-text-muted italic text-center px-2 leading-tight">
                            Ningún logo configurado
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id="company-logo-settings-input"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string
                                setTenantConfig(prev => ({ ...prev, logo: base64 }))
                                toast.success('Logo de la empresa cargado en caliente. Recuerda guardar los cambios.')
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                          <label
                            htmlFor="company-logo-settings-input"
                            className="px-4 py-2 rounded-lg bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue text-xs font-bold cursor-pointer transition-colors inline-block text-center w-full"
                          >
                            Cargar Logo
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Logo Proyecto */}
                    <div className="space-y-4 p-4 rounded-xl bg-glass-primary/5 border border-glass-border/30">
                      <div>
                        <span className="text-sm font-semibold text-text-primary block">Logo del Proyecto (Lado Derecho)</span>
                        <span className="text-xs text-text-secondary block mt-1">Se muestra en la esquina superior derecha del plan de pagos.</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {tenantConfig.projectLogo ? (
                          <div className="relative w-28 h-16 border border-glass-border bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                            <img src={tenantConfig.projectLogo} alt="Logo Proyecto" className="max-w-full max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                setTenantConfig(prev => ({ ...prev, projectLogo: '' }))
                                toast.success('Logo del proyecto removido. Guarda los cambios para aplicar.')
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                            >
                              Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="w-28 h-16 border-2 border-dashed border-glass-border rounded-lg flex items-center justify-center text-[10px] text-text-muted italic text-center px-2 leading-tight">
                            Ningún logo configurado
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id="project-logo-settings-input"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string
                                setTenantConfig(prev => ({ ...prev, projectLogo: base64 }))
                                toast.success('Logo del proyecto cargado en caliente. Recuerda guardar los cambios.')
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                          <label
                            htmlFor="project-logo-settings-input"
                            className="px-4 py-2 rounded-lg bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue text-xs font-bold cursor-pointer transition-colors inline-block text-center w-full"
                          >
                            Cargar Logo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cuentas Bancarias de la Empresa */}
              <Card variant="elevated" className="animate-fade-in-up mt-6">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-accent-blue" />
                        Cuentas Bancarias Autorizadas
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Configura las cuentas que verán tus clientes en su portal público para transferencias y pagos.
                      </p>
                    </div>
                    <Button
                      onClick={handleCreateBankAccount}
                      className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Cuenta
                    </Button>
                  </div>

                  {/* Enlace de compartir */}
                  {tenantConfig.slug && (
                    <div className="p-4 rounded-xl border border-glass-border bg-glass-primary/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-text-primary">Enlace de Pago para Clientes</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          Comparte este enlace independiente para que tus clientes seleccionen una cuenta, escaneen el QR y paguen:
                        </p>
                        <p className="text-xs font-mono text-accent-blue truncate">
                          {window.location.origin}/p/{tenantConfig.slug}/accounts
                        </p>
                      </div>
                      <Button
                        onClick={copyAccountsLink}
                        size="sm"
                        className="glass-button bg-accent-blue/15 border-accent-blue/20 text-accent-blue shrink-0 min-h-[38px]"
                      >
                        Copiar Enlace
                      </Button>
                    </div>
                  )}

                  {/* List of accounts */}
                  <div className="space-y-4">
                    {!tenantConfig.bankAccounts || tenantConfig.bankAccounts.length === 0 ? (
                      <div className="text-center py-8 rounded-xl border border-dashed border-glass-border bg-glass-primary/5">
                        <CreditCard className="w-12 h-12 text-text-disabled mx-auto mb-3" />
                        <p className="text-text-secondary font-medium">No has configurado ninguna cuenta bancaria aún.</p>
                        <p className="text-text-muted text-xs mt-1">Presiona "Agregar Cuenta" para registrar tu primera cuenta con su código QR.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tenantConfig.bankAccounts.map((acc, index) => (
                          <div 
                            key={index}
                            className={`p-4 rounded-xl border transition-all flex justify-between items-start gap-4 
                              ${acc.isActive 
                                ? 'bg-glass-primary/15 border-glass-border' 
                                : 'bg-glass-primary/5 border-glass-border/30 opacity-70'
                              }
                            `}
                          >
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-text-primary text-base truncate">{acc.banco}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                                  ${acc.tipoCuenta === 'Ahorros' 
                                    ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' 
                                    : 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                                  }
                                `}>
                                  {acc.tipoCuenta}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-text-primary select-all">No. {acc.numeroCuenta}</p>
                              {acc.titular && (
                                <p className="text-xs text-text-secondary truncate">
                                  <span className="font-medium text-text-muted">Titular:</span> {acc.titular}
                                </p>
                              )}
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-text-secondary">Visibilidad:</span>
                                <button
                                  onClick={() => handleToggleBankAccountStatus(index)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm transition-all
                                    ${acc.isActive 
                                      ? 'text-accent-green bg-accent-green/10 border-accent-green/20 hover:bg-accent-green/20' 
                                      : 'text-accent-red bg-accent-red/10 border-accent-red/20 hover:bg-accent-red/20'
                                    }
                                  `}
                                >
                                  {acc.isActive ? 'Mostrado a Clientes' : 'Oculto'}
                                </button>
                              </div>
                            </div>

                            {/* QR code thumbnail */}
                            <div className="flex flex-col items-end gap-3 shrink-0">
                              {acc.qrCode ? (
                                <div className="w-16 h-16 bg-white p-1 rounded-lg border border-glass-border overflow-hidden relative group/qr">
                                  <img 
                                    src={acc.qrCode} 
                                    alt="QR de Pago" 
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-[9px] text-white font-bold uppercase tracking-wider">Preview</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-glass-primary/10 rounded-lg border border-dashed border-glass-border flex flex-col items-center justify-center text-text-disabled">
                                  <span className="text-[10px] text-center px-1">Sin QR</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1">
                                <Button
                                  variant="glass"
                                  size="sm"
                                  onClick={() => handleEditBankAccount(index)}
                                  className="glass-button p-2 min-h-[32px] min-w-[32px]"
                                >
                                  <Edit className="w-3.5 h-3.5 text-text-secondary" />
                                </Button>
                                <Button
                                  variant="glass"
                                  size="sm"
                                  onClick={() => handleDeleteBankAccount(index)}
                                  className="glass-button p-2 min-h-[32px] min-w-[32px] text-accent-red hover:text-accent-red hover:bg-accent-red/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Modal de Agregar / Editar Cuenta Bancaria */}
              <Modal 
                isOpen={isBankModalOpen} 
                onClose={() => setIsBankModalOpen(false)}
                title={selectedBankIndex !== null ? "Editar Cuenta Bancaria" : "Agregar Cuenta Bancaria"}
                size="lg"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Banco *</label>
                      <select
                        value={bankForm.banco}
                        onChange={(e) => setBankForm(prev => ({ ...prev, banco: e.target.value }))}
                        className="glass-input w-full min-h-[44px] px-3 py-2 bg-background-dark text-text-primary border border-glass-border focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue rounded-lg"
                      >
                        <option value="">Selecciona un banco...</option>
                        {availableBanks.map(b => (
                          <option key={b._id} value={b.acronym}>{b.acronym} - {b.socialDenomination}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Tipo de Cuenta *</label>
                      <select
                        value={bankForm.tipoCuenta}
                        onChange={(e) => setBankForm(prev => ({ ...prev, tipoCuenta: e.target.value }))}
                        className="glass-input w-full min-h-[44px] px-3 py-2 bg-background-dark text-text-primary border border-glass-border focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue rounded-lg"
                      >
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Número de Cuenta *"
                      value={bankForm.numeroCuenta}
                      onChange={(e) => setBankForm(prev => ({ ...prev, numeroCuenta: e.target.value }))}
                      placeholder="Ej. 123456789"
                    />

                    <Input
                      label="Titular de la Cuenta"
                      value={bankForm.titular}
                      onChange={(e) => setBankForm(prev => ({ ...prev, titular: e.target.value }))}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  {/* QR Image Dropzone / Base64 upload */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent-blue" />
                      Código QR para la Cuenta (Imagen)
                    </label>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-glass-border bg-glass-primary/5">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="glass-input w-full min-h-[44px] pt-2 file:bg-glass-primary/30 file:border-0 file:rounded-md file:px-2 file:py-1 file:text-xs file:text-text-primary cursor-pointer"
                        />
                        <p className="text-[10px] text-text-muted mt-1">Carga el código QR oficial de tu banco en formato JPG, PNG o WebP. Máx 2MB.</p>
                      </div>

                      {bankForm.qrCode && (
                        <div className="shrink-0 flex flex-col items-center gap-2">
                          <div className="w-20 h-20 bg-white p-1 rounded-lg border border-glass-border overflow-hidden">
                            <img 
                              src={bankForm.qrCode} 
                              alt="Previsualización" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setBankForm(prev => ({ ...prev, qrCode: '' }))}
                            className="text-[10px] text-accent-red font-bold hover:underline"
                          >
                            Remover QR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-glass-primary/10 border border-glass-border">
                    <div>
                      <span className="text-sm font-medium text-text-primary block">Mostrar en el Portal de Clientes</span>
                      <span className="text-[10px] text-text-secondary">Si se desactiva, los clientes no verán esta cuenta como opción de pago.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBankForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-all shrink-0 border
                        ${bankForm.isActive 
                          ? 'border-blue-600' 
                          : 'bg-gray-300 dark:bg-glass-primary/30 border-gray-400 dark:border-glass-border/40'
                        }
                      `}
                      style={{
                        backgroundColor: bankForm.isActive ? '#2563eb' : undefined
                      }}
                    >
                      <span className={`
                        inline-block h-4 w-4 transform rounded-full transition-all shadow-md
                        ${bankForm.isActive 
                          ? 'translate-x-6 bg-white' 
                          : 'translate-x-1 bg-gray-500 dark:bg-white'
                        }
                      `} />
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                    <Button
                      variant="outline"
                      onClick={() => setIsBankModalOpen(false)}
                      className="glass-button border-glass-border text-text-secondary"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveBankAccount}
                      loading={isSaving}
                      className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30"
                    >
                      Guardar Cuenta
                    </Button>
                  </div>
                </div>
              </Modal>
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
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${user.role === 'ADMIN'
                              ? 'text-accent-purple bg-accent-purple/20 border-accent-purple/30'
                              : 'text-accent-blue bg-accent-blue/20 border-accent-blue/30'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 md:px-6">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm ${user.status === 'active'
                              ? 'text-accent-green bg-accent-green/20 border-accent-green/30'
                              : 'text-accent-red bg-accent-red/20 border-accent-red/30'
                              }`}>
                              {user.status === 'active' ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-4 px-4 md:px-6">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="glass"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="glass-button min-h-[44px] min-w-[44px]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="glass"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                                className={`glass-button min-h-[44px] min-w-[44px] ${user.status === 'active'
                                  ? 'text-accent-red hover:text-accent-red hover:bg-accent-red/20'
                                  : 'text-accent-green hover:text-accent-green hover:bg-accent-green/20'
                                  }`}
                              >
                                {user.status === 'active' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
                onPageChange={usersPagination.goToPage}
                onLimitChange={usersPagination.changeLimit}
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
              <WhatsAppConfigCard tenantConfig={tenantConfig} setTenantConfig={setTenantConfig} />

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

      {/* Quotas Tab */}
      {activeTab === 'quotas' && (
        <div className="space-y-4 md:space-y-6 animate-fade-in-up">
          <Card variant="elevated" className="overflow-hidden">
            <div className="bg-accent-blue/10 p-6 border-b border-glass-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center border border-accent-blue/30">
                  <Shield className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-primary">Planes y Límites de Uso</h3>
                  <p className="text-sm text-text-secondary">Monitorea el consumo de recursos de inteligencia artificial y servicios del sistema</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              {limitsLoading ? (
                <div className="space-y-8 py-4">
                  <StatsCardSkeleton className="h-32" />
                  <StatsCardSkeleton className="h-32" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* AI Chat Limit Card */}
                  <div className="glass-card p-6 border border-glass-border relative overflow-hidden group hover:border-accent-purple/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <MessageSquare className="w-24 h-24 text-accent-purple" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 bg-accent-purple/20 rounded-lg flex items-center justify-center border border-accent-purple/30">
                        <MessageSquare className="w-5 h-5 text-accent-purple" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary">Chat con Inteligencia Artificial</h4>
                        <p className="text-xs text-text-secondary">Mensajes mensuales asignados</p>
                      </div>
                    </div>

                    {(() => {
                      const monthlyLimit = limits.find(l => l.feature === 'ai_chat' && l.period === 'monthly')?.limit || 0;
                      const monthlyUsage = usage.find(u => u.periodType === 'monthly')?.count || 0;
                      const percentage = monthlyLimit > 0 ? Math.min(Math.round((monthlyUsage / monthlyLimit) * 100), 100) : 0;
                      const status = percentage > 90 ? 'critical' : percentage > 70 ? 'warning' : 'normal';
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <span className="text-3xl font-bold text-text-primary">{monthlyUsage}</span>
                              <span className="text-text-secondary ml-2">/ {monthlyLimit || '∞'}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                              status === 'critical' ? 'bg-accent-red/20 text-accent-red' :
                              status === 'warning' ? 'bg-accent-yellow/20 text-accent-yellow' :
                              'bg-accent-green/20 text-accent-green'
                            }`}>
                              {status === 'critical' ? 'Límite Crítico' : status === 'warning' ? 'Uso Elevado' : 'Consumo Normal'}
                            </span>
                          </div>

                          <div className="w-full h-3 bg-glass-primary/30 rounded-full overflow-hidden border border-glass-border">
                            <div 
                              className={`h-full transition-all duration-1000 ease-out ${
                                status === 'critical' ? 'bg-gradient-to-r from-accent-red to-orange-500' :
                                status === 'warning' ? 'bg-gradient-to-r from-accent-yellow to-accent-orange' :
                                'bg-gradient-to-r from-accent-blue to-accent-purple'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-text-muted">
                            <span>0%</span>
                            <span>{percentage}% utilizado</span>
                            <span>100%</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Daily Limit Info Card */}
                  <div className="glass-card p-6 border border-glass-border bg-glass-primary/10">
                    <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent-yellow" />
                      Información del Plan
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-glass-primary/20 border border-glass-border">
                        <span className="text-sm text-text-secondary">Límite Diario (IA)</span>
                        <span className="font-bold text-text-primary">
                          {limits.find(l => l.feature === 'ai_chat' && l.period === 'daily')?.limit || 'Sin límite'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded-lg bg-glass-primary/20 border border-glass-border">
                        <span className="text-sm text-text-secondary">Renovación de Cuota</span>
                        <span className="font-bold text-accent-blue">Mensual</span>
                      </div>

                      <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20 mt-4">
                        <p className="text-xs text-text-secondary leading-relaxed">
                          <span className="font-bold text-accent-blue block mb-1">¿Necesitas más capacidad?</span>
                          Los límites son establecidos por el administrador de la plataforma según tu plan de suscripción actual.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-3 glass-button border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10"
                          onClick={() => window.open('mailto:soporte@tuplataforma.com')}
                        >
                          Solicitar Ampliación
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-accent-purple/20">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="p-2 bg-accent-purple/20 rounded-lg">
                <Shield className="w-5 h-5 text-accent-purple" />
              </div>
              <div>
                <h5 className="font-semibold text-text-primary text-sm">Política de Uso Justo</h5>
                <p className="text-xs text-text-secondary mt-1">
                  Para garantizar la estabilidad del sistema, se aplican límites de tasa (rate-limiting) adicionales en todas nuestras APIs de IA.
                </p>
              </div>
            </CardContent>
          </Card>
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

            <label className="block text-sm font-medium text-text-primary mb-2">
              Rol
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
              className="glass-input w-full min-h-[44px] px-3 py-2 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue"
            >
              <option value="agent">Agente (Cobros)</option>
              <option value="vendedor">Vendedor</option>
              <option value="cliente">Cliente (Portal del Cliente)</option>
              <option value="company_admin">Admin de Empresa</option>
              <option value="tenant_admin">Dueño de Empresa (Tenant Admin)</option>
              <option value="superadmin">Superadmin (Plataforma)</option>
            </select>

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

function WhatsAppConfigCard({ tenantConfig, setTenantConfig }: any) {
  const [connecting, setConnecting] = useState(false)
  const [metaAppId, setMetaAppId] = useState('')

  useEffect(() => {
    adminApi.getWhatsAppConfig().then((res: any) => {
      if (res.data?.data?.appId) setMetaAppId(res.data.data.appId)
    }).catch(console.error)
  }, [])

  const handleConnect = () => {
    if (!metaAppId) {
      toast.error('META_APP_ID no configurado en el servidor')
      return
    }

    setConnecting(true)

    const loadFBSDK = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).FB) {
          resolve()
          return
        }

        (window as any).fbAsyncInit = () => {
          (window as any).FB.init({
            appId: metaAppId,
            cookie: true,
            xfbml: true,
            version: 'v21.0',
          })
          resolve()
        }

        const script = document.createElement('script')
        script.src = 'https://connect.facebook.net/es_LA/sdk.js'
        script.async = true
        script.defer = true
        document.body.appendChild(script)
      })
    }

    let signupInfo: { waba_id?: string; phone_number_id?: string } = {}

    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && 
          event.origin !== 'https://web.facebook.com') return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH' && data.data) {
            signupInfo.waba_id = data.data.waba_id
            signupInfo.phone_number_id = data.data.phone_number_id
          }
        }
      } catch {}
    }
    window.addEventListener('message', messageHandler)

    loadFBSDK().then(() => {
      const FB = (window as any).FB
      FB.login(
        (response: any) => {
          window.removeEventListener('message', messageHandler)
          const code = response.authResponse?.code || response.authResponse?.accessToken
          if (code) {
            adminApi.connectWhatsApp({ code, wabaId: signupInfo.waba_id, phoneNumberId: signupInfo.phone_number_id })
              .then((result: any) => {
                toast.success(`WhatsApp conectado: ${result.data?.data?.displayPhoneNumber || 'OK'}`)
                // Update local config
                setTenantConfig((prev: any) => ({
                  ...prev,
                  integrations: {
                    ...prev.integrations,
                    whatsappEnabled: true,
                    whatsappWabaId: result.data?.data?.wabaId,
                    whatsappPhoneId: result.data?.data?.phoneNumberId,
                    whatsappDisplayPhone: result.data?.data?.displayPhoneNumber,
                    whatsappVerifiedName: result.data?.data?.verifiedName,
                    whatsappConnectedAt: new Date().toISOString()
                  }
                }))
              })
              .catch((err: any) => {
                toast.error(err.response?.data?.message || 'Error al conectar WhatsApp')
              })
              .finally(() => setConnecting(false))
          } else {
            toast.error('Conexión cancelada')
            setConnecting(false)
          }
        },
        {
          config_id: '1656706408671794',
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            version: 'v3',
            setup: {},
            featureType: 'whatsapp_business_app_onboarding',
            sessionInfoVersion: '3',
          },
        }
      )
    }).catch(() => {
      window.removeEventListener('message', messageHandler)
      toast.error('Error al cargar Facebook SDK')
      setConnecting(false)
    })
  }

  const handleDisconnect = async () => {
    if (confirm('¿Desconectar WhatsApp? Los mensajes dejarán de llegar al sistema.')) {
      try {
        await adminApi.disconnectWhatsApp()
        toast.success('WhatsApp desconectado')
        setTenantConfig((prev: any) => ({
          ...prev,
          integrations: {
            ...prev.integrations,
            whatsappEnabled: false,
            whatsappWabaId: undefined,
            whatsappPhoneId: undefined,
            whatsappDisplayPhone: undefined,
            whatsappVerifiedName: undefined,
            whatsappConnectedAt: undefined
          }
        }))
      } catch (err: any) {
        toast.error('Error al desconectar WhatsApp')
      }
    }
  }

  const isConnected = !!tenantConfig.integrations.whatsappConnectedAt

  return (
    <Card variant="elevated" className="animate-fade-in-up">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-accent-green/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4 border border-glass-border">
              <MessageSquare className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">WhatsApp Business API</h3>
              <p className="text-sm text-text-secondary">Conexión oficial de WhatsApp (Coexistencia)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-accent-green' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-text-primary">
              {isConnected ? 'Conectado' : 'No conectado'}
            </span>
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-glass-border bg-glass-primary/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-text-secondary">Número Activo</span>
                <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold bg-accent-green/20 text-accent-green">EN USO</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-glass-primary/30 rounded-md border border-glass-border">
                  <Smartphone className="h-4 w-4 text-accent-green" />
                </div>
                <div>
                  <p className="text-sm font-bold font-mono text-text-primary">{tenantConfig.integrations.whatsappDisplayPhone || tenantConfig.integrations.whatsappPhoneId}</p>
                  <p className="text-[10px] text-text-secondary">{tenantConfig.integrations.whatsappVerifiedName || 'Nombre no verificado'}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-glass-border flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 rounded text-[10px] bg-glass-primary/30 text-text-secondary border border-glass-border">
                  WABA ID: {tenantConfig.integrations.whatsappWabaId}
                </span>
                {tenantConfig.integrations.whatsappConnectedAt && (
                  <span className="text-[10px] text-text-muted">
                    Conectado el {new Date(tenantConfig.integrations.whatsappConnectedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <Button
                variant="glass"
                size="sm"
                className="w-full text-accent-red hover:bg-accent-red/10 border-accent-red/20"
                onClick={handleDisconnect}
              >
                Desconectar cuenta de WhatsApp
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-glass-border p-6 text-center bg-glass-primary/5">
              <MessageSquare className="mx-auto h-10 w-10 text-accent-green mb-3 opacity-80" />
              <h4 className="text-sm font-semibold text-text-primary">Conexión de WhatsApp</h4>
              <p className="text-xs text-text-secondary mt-2 max-w-[300px] mx-auto">
                Conecta tu cuenta usando el flujo integrado de Facebook para gestionar mensajes.
              </p>
              <div className="mt-5">
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white border-none shadow-md"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {connecting ? 'Conectando...' : 'Conectar con Facebook'}
                </Button>
              </div>
              <p className="text-[10px] text-text-muted mt-4">
                Compatible con Cloud API y modo Coexistencia.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}