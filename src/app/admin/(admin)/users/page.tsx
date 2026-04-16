'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Key, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
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

type Role = 'tenant_admin' | 'company_admin' | 'agent' | 'vendedor'

const roleLabels: Record<Role, string> = {
  tenant_admin: 'Admin Tenant',
  company_admin: 'Admin Empresa',
  agent: 'Agente',
  vendedor: 'Vendedor',
}

const roleBadgeVariant: Record<Role, 'purple' | 'info' | 'default'> = {
  tenant_admin: 'purple',
  company_admin: 'info',
  agent: 'default',
  vendedor: 'default',
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
    role: 'agent' as Role,
    status: 'active'
  })

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await adminApi.getAdminUsers()
      if (response.data.success) {
        setUsers(response.data.data.users)
      }
    } catch (error: any) {

      toast.error('Error al cargar la lista de administradores')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await adminApi.createAdminUser(formData)
      if (response.data.success) {
        toast.success('Usuario creado exitosamente')
        setIsAddModalOpen(false)
        setFormData({ fullName: '', email: '', password: '', role: 'agent', status: 'active' })
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
        toast.success('Administrador eliminado')
        setIsDeleteModalOpen(false)
        fetchUsers()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar administrador')
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

  const filteredUsers = users.filter((user) => 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Administradores</h1>
          <p className="text-text-secondary mt-1">
            Gestiona los usuarios con acceso al panel administrativo
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => {
            setFormData({ fullName: '', email: '', password: '', role: 'agent', status: 'active' })
            setIsAddModalOpen(true)
          }}
          className="shadow-glow"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Buscar por nombre o correo electrónico..."
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
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className={`hover:shadow-glow transition-all duration-300 border-l-4 ${
                user.role === 'tenant_admin' ? 'border-l-accent-purple' : 'border-l-accent-blue'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                      user.role === 'tenant_admin' ? 'bg-gradient-purple' : 'bg-gradient-primary'
                    }`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary truncate max-w-[150px]">
                        {user.fullName}
                      </h3>
                      <p className="text-xs text-text-secondary truncate max-w-[150px]">
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
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-medium text-text-primary">No se encontraron administradores</h3>
          <p className="text-text-secondary mt-2">Intenta ajustar tu búsqueda o crea uno nuevo</p>
        </Card>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nuevo Administrador"
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
              <option value="agent">Agente</option>
              <option value="vendedor">Vendedor</option>
              <option value="company_admin">Admin Empresa</option>
              <option value="tenant_admin">Admin Tenant</option>
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
        title="Editar Administrador"
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
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Rol del Usuario</label>
            <select 
              className="w-full h-10 px-3 rounded-lg bg-glass-primary border border-glass-border text-text-primary focus:ring-2 focus:ring-accent-blue outline-none transition-all"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="agent">Agente</option>
              <option value="vendedor">Vendedor</option>
              <option value="company_admin">Admin Empresa</option>
              <option value="tenant_admin">Admin Tenant</option>
            </select>
          </div>
          <div className="flex items-center gap-3 p-3 bg-glass-primary rounded-lg border border-glass-border">
            <input 
              type="checkbox"
              id="isActive"
              className="w-4 h-4 rounded border-glass-border text-accent-blue focus:ring-accent-blue bg-dark-primary"
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
        title="Eliminar Administrador"
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
