'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Key,
  Shield,
  CheckCircle2,
  XCircle,
  TrendingUp,
  UserCheck,
  Briefcase,
  User,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import toast from 'react-hot-toast'
import { StatsCardSkeleton } from '@/components/ui/LoadingSpinner'

export type UserTab = 'administrativos' | 'comerciales' | 'clientes'

export type Role =
  | 'superadmin'
  | 'tenant_admin'
  | 'company_admin'
  | 'administrador'
  | 'gerente'
  | 'jefe_cartera'
  | 'auxiliar_cartera'
  | 'contador'
  | 'auxiliar_contable'
  | 'ejecutivo_comercial'
  | 'vendedor'
  | 'agent'
  | 'cliente'
  | 'cobrador'

const roleLabels: Record<Role, string> = {
  superadmin: 'Super Admin',
  tenant_admin: 'Admin Tenant',
  company_admin: 'Admin Empresa',
  administrador: 'Administrador',
  gerente: 'Gerente',
  jefe_cartera: 'Jefe de Cartera',
  auxiliar_cartera: 'Auxiliar de Cartera',
  contador: 'Contador',
  auxiliar_contable: 'Auxiliar Contable',
  cobrador: 'Cobrador',
  ejecutivo_comercial: 'Ejecutivo Comercial',
  vendedor: 'Asesor Comercial',
  agent: 'Agente Comercial',
  cliente: 'Cliente',
}

const roleBadgeVariant: Record<Role, 'purple' | 'info' | 'default' | 'success' | 'warning'> = {
  superadmin: 'purple',
  tenant_admin: 'purple',
  administrador: 'purple',
  gerente: 'purple',
  company_admin: 'info',
  jefe_cartera: 'info',
  auxiliar_cartera: 'info',
  contador: 'info',
  auxiliar_contable: 'default',
  cobrador: 'info',
  ejecutivo_comercial: 'info',
  vendedor: 'default',
  agent: 'default',
  cliente: 'success',
}

export const CATEGORY_ROLES: Record<UserTab, Role[]> = {
  administrativos: [
    'superadmin',
    'tenant_admin',
    'company_admin',
    'administrador',
    'gerente',
    'jefe_cartera',
    'auxiliar_cartera',
    'contador',
    'auxiliar_contable',
    'cobrador'
  ],
  comerciales: [
    'ejecutivo_comercial',
    'vendedor',
    'agent'
  ],
  clientes: [
    'cliente'
  ]
}

interface AdminUser {
  id: string
  accountId: string
  fullName: string
  email: string
  role: Role
  status: string
  accountStatus: string
  lastLogin?: string
  createdAt: string
}

export default function UsersPage() {
  const { admin: currentAdmin } = useAdminAuthStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<UserTab>('administrativos')

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Selected user for editing/deleting
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'administrador' as Role,
    status: 'active'
  })

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await adminApi.getAdminUsers(1, 200)
      if (response.data.success) {
        setUsers(response.data.data.users || [])
      }
    } catch (error: any) {
      toast.error('Error al cargar la lista de usuarios del equipo')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // User counts per tab
  const counts = useMemo(() => {
    return {
      administrativos: users.filter(u => CATEGORY_ROLES.administrativos.includes(u.role)).length,
      comerciales: users.filter(u => CATEGORY_ROLES.comerciales.includes(u.role)).length,
      clientes: users.filter(u => CATEGORY_ROLES.clientes.includes(u.role)).length,
    }
  }, [users])

  // Filtered users by active tab and search
  const filteredUsers = useMemo(() => {
    const rolesInTab = CATEGORY_ROLES[activeTab] || []
    return users
      .filter((user) => rolesInTab.includes(user.role))
      .filter((user) =>
        (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [users, activeTab, searchQuery])

  const openAddModalForTab = () => {
    let defaultRole: Role = 'administrador'
    if (activeTab === 'comerciales') defaultRole = 'ejecutivo_comercial'
    if (activeTab === 'clientes') defaultRole = 'cliente'

    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: defaultRole,
      status: 'active'
    })
    setIsAddModalOpen(true)
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await adminApi.createAdminUser(formData)
      if (response.data.success) {
        toast.success('Usuario creado exitosamente')
        setIsAddModalOpen(false)
        fetchUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear usuario')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const response = await adminApi.updateAdminUser(selectedUser.id, {
        fullName: formData.fullName,
        role: formData.role,
        status: formData.status
      })
      if (response.data.success) {
        toast.success('Información actualizada')
        setIsEditModalOpen(false)
        fetchUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar información')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const response = await adminApi.changeAdminPassword(selectedUser.id, formData.password)
      if (response.data.success) {
        toast.success('Contraseña actualizada correctamente')
        setIsPasswordModalOpen(false)
        setFormData(prev => ({ ...prev, password: '' }))
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await adminApi.deleteAdminUser(selectedUser.id)
      if (response.data.success) {
        toast.success('Usuario eliminado del equipo')
        setIsDeleteModalOpen(false)
        fetchUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar usuario')
    }
  }

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      password: ''
    })
    setIsEditModalOpen(true)
  }

  const openPasswordModal = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData(prev => ({ ...prev, password: '' }))
    setIsPasswordModalOpen(true)
  }

  const openDeleteModal = (user: AdminUser) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
  }

  return (
    <div className="space-y-6 px-1 py-2 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Equipo y Usuarios</h1>
          <p className="text-text-secondary mt-1">
            Gestión y control de accesos para administrativos, equipo comercial y clientes
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openAddModalForTab}
          className="shadow-glow"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* 3 TABS EXACTAMENTE: ADMINISTRATIVOS | COMERCIALES | CLIENTES */}
      <div className="flex flex-wrap bg-glass-primary/30 p-1.5 rounded-2xl border border-glass-border gap-1.5">
        <button
          onClick={() => setActiveTab('administrativos')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'administrativos'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'text-text-secondary hover:text-text-primary hover:bg-glass-primary/10'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Administrativos</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'administrativos' ? 'bg-white/20 text-white' : 'bg-glass-primary text-text-secondary'
          }`}>
            {counts.administrativos}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('comerciales')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'comerciales'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'text-text-secondary hover:text-text-primary hover:bg-glass-primary/10'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Comerciales</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'comerciales' ? 'bg-white/20 text-white' : 'bg-glass-primary text-text-secondary'
          }`}>
            {counts.comerciales}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('clientes')}
          className={`flex-1 min-w-[160px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'clientes'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'text-text-secondary hover:text-text-primary hover:bg-glass-primary/10'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Clientes</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'clientes' ? 'bg-white/20 text-white' : 'bg-glass-primary text-text-secondary'
          }`}>
            {counts.clientes}
          </span>
        </button>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder={`Buscar en ${activeTab} por nombre o correo...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <StatsCardSkeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const isManagerOrAdmin = ['superadmin', 'tenant_admin', 'administrador', 'gerente'].includes(user.role)
            const isCommercial = CATEGORY_ROLES.comerciales.includes(user.role)
            const isClient = user.role === 'cliente'

            const borderClass = isManagerOrAdmin 
              ? 'border-l-accent-purple' 
              : isCommercial 
                ? 'border-l-accent-blue' 
                : 'border-l-accent-green'

            const avatarBg = isManagerOrAdmin
              ? 'bg-gradient-purple'
              : isCommercial
                ? 'bg-gradient-primary'
                : 'bg-emerald-600'

            return (
              <Card
                key={user.id}
                className={`hover:shadow-glow transition-all duration-300 border-l-4 ${borderClass}`}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${avatarBg}`}>
                        {isClient ? (
                          <User className="w-6 h-6" />
                        ) : isCommercial ? (
                          <TrendingUp className="w-6 h-6" />
                        ) : (
                          <Briefcase className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary truncate max-w-[150px] sm:max-w-[180px]">
                          {user.fullName || 'Sin nombre'}
                        </h3>
                        <p className="text-xs text-text-secondary truncate max-w-[150px] sm:max-w-[180px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={roleBadgeVariant[user.role] || 'default'}>
                        {roleLabels[user.role] || user.role}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {user.status === 'active' ? (
                          <CheckCircle2 className="w-4 h-4 text-accent-green" />
                        ) : (
                          <XCircle className="w-4 h-4 text-accent-red" />
                        )}
                        <span className={`text-[10px] uppercase font-bold ${
                          user.status === 'active' ? 'text-accent-green' : 'text-accent-red'
                        }`}>
                          {user.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-glass-border grid grid-cols-3 gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => openEditModal(user)}
                      className="flex-1 text-[11px] h-9"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => openPasswordModal(user)}
                      className="flex-1 text-[11px] h-9"
                    >
                      <Key className="w-3 h-3 mr-1" />
                      Clave
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => openDeleteModal(user)}
                      className="flex-1 text-[11px] h-9 text-accent-red hover:bg-accent-red/10"
                      disabled={user.id === currentAdmin?.id}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Borrar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-medium text-text-primary">
            No se encontraron {activeTab}
          </h3>
          <p className="text-text-secondary mt-2">
            {searchQuery ? 'Intenta ajustar tu búsqueda o limpiar los filtros.' : `Aún no hay usuarios registrados en la categoría de ${activeTab}.`}
          </p>
          <Button
            variant="outline"
            onClick={openAddModalForTab}
            className="mt-4"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Crear Usuario en {activeTab}
          </Button>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Nuevo Usuario - ${activeTab.toUpperCase()}`}
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Nombre Completo</label>
            <Input
              required
              placeholder="Ej. Carlos Rodríguez"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Correo Electrónico</label>
            <Input
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Contraseña Inicial</label>
            <Input
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Rol del Usuario</label>
            <select
              className="w-full h-10 px-3 rounded-lg bg-glass-primary border border-glass-border text-text-primary focus:ring-2 focus:ring-accent-blue outline-none transition-all cursor-pointer"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <optgroup label="Administrativos y Gestión">
                <option value="administrador">Administrador</option>
                <option value="gerente">Gerente</option>
                <option value="jefe_cartera">Jefe de Cartera</option>
                <option value="auxiliar_cartera">Auxiliar de Cartera</option>
                <option value="contador">Contador</option>
                <option value="auxiliar_contable">Auxiliar Contable</option>
                <option value="cobrador">Cobrador</option>
                <option value="company_admin">Admin Empresa</option>
                <option value="tenant_admin">Admin Tenant</option>
              </optgroup>
              <optgroup label="Comerciales y Ventas">
                <option value="ejecutivo_comercial">Ejecutivo Comercial</option>
                <option value="vendedor">Asesor Comercial</option>
                <option value="agent">Agente Comercial</option>
              </optgroup>
              <optgroup label="Clientes">
                <option value="cliente">Cliente (Portal)</option>
              </optgroup>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Usuario"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Nombre Completo</label>
            <Input
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Correo Electrónico</label>
            <Input
              type="email"
              required
              disabled
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Rol del Usuario</label>
            <select
              className="w-full h-10 px-3 rounded-lg bg-glass-primary border border-glass-border text-text-primary focus:ring-2 focus:ring-accent-blue outline-none transition-all cursor-pointer"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <optgroup label="Administrativos y Gestión">
                <option value="administrador">Administrador</option>
                <option value="gerente">Gerente</option>
                <option value="jefe_cartera">Jefe de Cartera</option>
                <option value="auxiliar_cartera">Auxiliar de Cartera</option>
                <option value="contador">Contador</option>
                <option value="auxiliar_contable">Auxiliar Contable</option>
                <option value="cobrador">Cobrador</option>
                <option value="company_admin">Admin Empresa</option>
                <option value="tenant_admin">Admin Tenant</option>
              </optgroup>
              <optgroup label="Comerciales y Ventas">
                <option value="ejecutivo_comercial">Ejecutivo Comercial</option>
                <option value="vendedor">Asesor Comercial</option>
                <option value="agent">Agente Comercial</option>
              </optgroup>
              <optgroup label="Clientes">
                <option value="cliente">Cliente (Portal)</option>
              </optgroup>
            </select>
          </div>
          <div className="flex items-center gap-3 p-3 bg-glass-primary rounded-lg border border-glass-border">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 rounded border-glass-border text-accent-blue focus:ring-accent-blue bg-dark-primary cursor-pointer"
              checked={formData.status === 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
            />
            <label htmlFor="isActive" className="text-sm font-medium text-text-primary cursor-pointer">
              Cuenta Activa (Permite el acceso al sistema)
            </label>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Cambiar Contraseña"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-lg flex gap-3 text-sm text-accent-blue">
            <Shield className="w-5 h-5 flex-shrink-0" />
            <p>Estás cambiando la contraseña de <strong>{selectedUser?.fullName}</strong>.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Nueva Contraseña</label>
            <Input
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              autoFocus
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Usuario del Equipo"
      >
        <div className="space-y-4">
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-lg flex gap-3 text-sm text-accent-red">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold">¿Estás seguro de eliminar este usuario?</p>
              <p className="mt-1">Esta acción no se puede deshacer y el usuario perderá acceso inmediato.</p>
            </div>
          </div>
          <div className="p-4 glass-card rounded-lg">
            <p className="text-sm text-text-secondary">Usuario a eliminar:</p>
            <p className="text-lg font-bold text-text-primary mt-1">{selectedUser?.fullName}</p>
            <p className="text-sm text-text-muted">{selectedUser?.email}</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="bg-accent-red hover:bg-accent-red/80 text-white border-none"
              onClick={handleDeleteUser}
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
