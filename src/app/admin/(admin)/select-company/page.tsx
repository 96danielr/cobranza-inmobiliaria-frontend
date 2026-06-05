'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Building2, ChevronRight, RefreshCw, Plus, Edit2, Calendar, Shield, CreditCard } from 'lucide-react'

import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { adminApi } from '@/lib/adminApi'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

interface Company {
  _id: string
  name: string
  rfc?: string
  status: string
  plan?: string
  subscriptionStart?: string
  subscriptionEnd?: string
  activeModules?: string[]
}

export default function SelectCompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Create Tenant Form
  const [form, setForm] = useState({
    tenantName: '',
    fullName: '',
    email: '',
    password: '',
    nit: '',
    documentoIdentidad: '',
    tenantAddress: '',
    tenantPhone: '',
    tenantEmail: ''
  })

  // Create Company Form
  const [companyForm, setCompanyForm] = useState({
    name: '',
    rfc: '',
    nit: '',
    address: '',
    phone: '',
    email: ''
  })

  // Edit Tenant Form
  const [selectedTenant, setSelectedTenant] = useState<Company | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    nit: '',
    address: '',
    phone: '',
    email: '',
    plan: 'basic',
    status: 'active',
    subscriptionStart: '',
    subscriptionEnd: '',
    activeModules: ['cobranzas'],
    aiChatLimitMonthly: 0,
    aiChatLimitDaily: 0
  })

  const router = useRouter()
  const { admin, selectedCompanyId, setSelectedCompany, isAuthenticated } = useAdminAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login')
      return
    }
    fetchCompanies()
  }, [isAuthenticated, admin?.role])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = admin?.role === 'superadmin'
        ? await adminApi.getAllTenants()
        : await adminApi.getCompanies()

      if (response.data.success) {
        const data = admin?.role === 'superadmin' ? response.data.data.tenants : response.data.data.companies
        setCompanies(data)

        // Auto-select if only one company (and not superadmin)
        const activeCompanies = data.filter(
          (c: Company) => c.status === 'active'
        )
        if (activeCompanies.length === 1 && !selectedCompanyId && admin?.role !== 'superadmin') {
          handleSelectCompany(activeCompanies[0])
        }
      }
    } catch (error) {
      toast.error('Error al cargar empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company._id, company.name)
    toast.success(`Proyecto seleccionado: ${company.name}`)
    router.push('/admin/dashboard')
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const response = await adminApi.createTenantWithAdmin(form)
      if (response.data.success) {
        toast.success('Empresa y administrador creados exitosamente')
        setIsModalOpen(false)
        setForm({ 
          tenantName: '', 
          fullName: '', 
          email: '', 
          password: '', 
          nit: '', 
          documentoIdentidad: '',
          tenantAddress: '',
          tenantPhone: '',
          tenantEmail: ''
        })
        fetchCompanies()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear empresa')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const response = await adminApi.createCompany(companyForm)
      if (response.data.success) {
        toast.success('Proyecto creado exitosamente')
        setIsCompanyModalOpen(false)
        setCompanyForm({ name: '', rfc: '', nit: '', address: '', phone: '', email: '' })
        fetchCompanies()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear proyecto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = async (tenant: Company, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTenant(tenant)
    
    // Default values
    const newForm = {
      name: tenant.name || '',
      nit: (tenant as any).nit || '',
      address: (tenant as any).address || '',
      phone: (tenant as any).phone || '',
      email: (tenant as any).email || '',
      plan: tenant.plan || 'basic',
      status: tenant.status || 'active',
      subscriptionStart: tenant.subscriptionStart ? new Date(tenant.subscriptionStart).toISOString().split('T')[0] : '',
      subscriptionEnd: tenant.subscriptionEnd ? new Date(tenant.subscriptionEnd).toISOString().split('T')[0] : '',
      activeModules: tenant.activeModules || ['cobranzas'],
      aiChatLimitMonthly: 0,
      aiChatLimitDaily: 0
    }

    try {
      // Fetch limits for this tenant
      const limitsRes = await adminApi.getLimits({ targetId: tenant._id, targetType: 'tenant' })
      if (limitsRes.data.success) {
        const limits = limitsRes.data.data
        const monthly = limits.find((l: any) => l.feature === 'ai_chat' && l.period === 'monthly')
        const daily = limits.find((l: any) => l.feature === 'ai_chat' && l.period === 'daily')
        if (monthly) newForm.aiChatLimitMonthly = monthly.limit
        if (daily) newForm.aiChatLimitDaily = daily.limit
      }
    } catch (error) {
      console.error('Error fetching tenant limits:', error)
    }

    setEditForm(newForm)
    setIsEditModalOpen(true)
  }

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenant) return
    try {
      setIsSubmitting(true)
      
      // Update tenant subscription info
      const tenantUpdate = adminApi.updateTenant(selectedTenant._id, {
        name: editForm.name,
        nit: editForm.nit,
        address: editForm.address,
        phone: editForm.phone,
        email: editForm.email,
        plan: editForm.plan,
        status: editForm.status,
        subscriptionStart: editForm.subscriptionStart,
        subscriptionEnd: editForm.subscriptionEnd,
        activeModules: editForm.activeModules
      })

      // Update AI Chat limits
      const monthlyLimitUpdate = adminApi.setLimit({
        targetType: 'tenant',
        targetId: selectedTenant._id,
        feature: 'ai_chat',
        limit: editForm.aiChatLimitMonthly,
        period: 'monthly'
      })

      const dailyLimitUpdate = adminApi.setLimit({
        targetType: 'tenant',
        targetId: selectedTenant._id,
        feature: 'ai_chat',
        limit: editForm.aiChatLimitDaily,
        period: 'daily'
      })

      await Promise.all([tenantUpdate, monthlyLimitUpdate, dailyLimitUpdate])

      toast.success('Configuración y límites actualizados correctamente')
      setIsEditModalOpen(false)
      fetchCompanies()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar configuración')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-2 py-3 md:py-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-4 md:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 glass-card mb-2 md:mb-4 shadow-glow border-accent-blue/30 rounded-2xl">
          <Building2 className="w-6 h-6 md:w-8 md:h-8 text-accent-blue" />
        </div>
        <div className="flex flex-col items-center justify-center gap-1.5 md:gap-2">
          <h1 className="text-xl md:text-2xl font-bold text-text-primary">
            {admin?.role === 'superadmin' 
              ? 'Administrar Proyectos Clientes' 
              : `¡Bienvenido, ${admin?.tenantName || admin?.fullName || 'Usuario'}!`}
          </h1>
          {admin?.role !== 'superadmin' && (
            <span className="text-xs md:text-sm font-semibold text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-0.5 md:px-3 md:py-1 rounded-full">
              Selecciona un proyecto para empezar
            </span>
          )}
          {admin?.role === 'superadmin' ? (
            <Button
              variant="glass"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-1 md:mt-2 bg-accent-blue/20 text-accent-blue border-accent-blue/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto / Admin
            </Button>
          ) : admin?.role === 'tenant_admin' ? (
            <Button
              variant="glass"
              size="sm"
              onClick={() => setIsCompanyModalOpen(true)}
              className="mt-1 md:mt-2 bg-accent-blue/20 text-accent-blue border-accent-blue/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          ) : null}
        </div>
        <p className="text-xs md:text-sm text-text-secondary mt-2 md:mt-4 hidden sm:block">
          {admin?.role === 'superadmin'
            ? 'Gestiona aquí los planes, suscripciones y módulos de tus clientes.'
            : 'Aquí tienes los proyectos inmobiliarios asociados a tu cuenta. Elige uno para ingresar al panel de control.'}
        </p>
      </div>

      {/* Company/Tenant List */}
      <div className="space-y-4">
        {admin?.role === 'superadmin' ? (
          /* Table View for Superadmin */
          <div className="overflow-x-auto glass-card rounded-2xl border border-glass-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border bg-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Empresa / Tenant</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">Plan</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-center">Expiración</th>
                  <th className="px-6 py-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company._id}
                    className="border-b border-glass-border/50 hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-text-primary text-sm">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-full font-bold uppercase border border-accent-blue/20">
                        {company.plan || 'basic'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${company.status === 'active'
                        ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                        : 'bg-accent-red/10 text-accent-red border-accent-red/20'
                        }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-text-secondary font-medium">
                        {company.subscriptionEnd
                          ? new Date(company.subscriptionEnd).toLocaleDateString()
                          : 'Ilimitado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleOpenEdit(company, e)}
                          className="p-2 glass-button hover:bg-accent-blue/20 hover:text-accent-blue rounded-lg transition-all"
                          title="Gestionar Suscripción"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSelectCompany(company)}
                          className="p-2 glass-button hover:bg-white/10 rounded-lg transition-all"
                          title="Administrar Empresa"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Company Selection */
          companies
            .filter((c) => c.status === 'active')
            .map((company) => (
              <Card
                key={company._id}
                variant="default"
                className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${selectedCompanyId === company._id
                  ? 'ring-2 ring-accent-blue shadow-glow'
                  : ''
                  }`}
                onClick={() => handleSelectCompany(company)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">
                        {company.name}
                      </h3>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {companies.length === 0 && (
        <Card variant="default">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No hay proyectos disponibles
            </h3>
            <p className="text-text-secondary mb-4">
              Comienza creando tu primer proyecto inmobiliario.
            </p>
            <Button
              variant="glass"
              onClick={fetchCompanies}
              className="inline-flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal for Superadmin to create Tenant + Admin */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Empresa y Administrador"
      >
        <form onSubmit={handleCreateTenant} className="space-y-4 pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-accent-blue uppercase tracking-wider">Datos de la Empresa</h3>
            <Input
              label="Nombre de la Empresa (Enterprise)"
              placeholder="Ej: Inmobiliaria Horizonte"
              value={form.tenantName}
              onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
              required
            />
            <Input
              label="NIT de la Empresa (Opcional)"
              placeholder="Ej: 900.123.456-1"
              value={form.nit}
              onChange={(e) => setForm({ ...form, nit: e.target.value })}
            />
            <Input
              label="Dirección Comercial (Opcional)"
              placeholder="Dirección fiscal/comercial"
              value={form.tenantAddress}
              onChange={(e) => setForm({ ...form, tenantAddress: e.target.value })}
            />
            <Input
              label="Teléfono Corporativo (Opcional)"
              placeholder="+57 300 123 4567"
              value={form.tenantPhone}
              onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })}
            />
            <Input
              label="Correo Corporativo (Opcional)"
              type="email"
              placeholder="facturacion@empresa.com"
              value={form.tenantEmail}
              onChange={(e) => setForm({ ...form, tenantEmail: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-glass-border">
            <h3 className="text-sm font-semibold text-accent-blue uppercase tracking-wider">Datos del Administrador</h3>
            <Input
              label="Nombre Completo"
              placeholder="Ej: Carlos Rodriguez"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <Input
              label="Documento de Identidad (Opcional)"
              placeholder="Ej: 1.023.456.789"
              value={form.documentoIdentidad}
              onChange={(e) => setForm({ ...form, documentoIdentidad: e.target.value })}
            />
            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="admin@empresa.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Contraseña Temporal"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="glass" type="button" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Crear Enterprise
            </Button>
          </div>
        </form>
      </Modal>
 
      {/* Modal for Tenant Admin to create Company */}
      <Modal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        title="Crear Nuevo Proyecto"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4 pt-4">
          <Input
            label="Nombre del Proyecto"
            placeholder="Ej: Proyecto Bosques del Este"
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
          />
          <Input
            label="NIT del Proyecto (Opcional)"
            placeholder="Ej: 900.123.456-1"
            value={companyForm.nit}
            onChange={(e) => setCompanyForm({ ...companyForm, nit: e.target.value })}
          />
          <Input
            label="RFC / Identificador (Opcional)"
            placeholder="RFC del proyecto"
            value={companyForm.rfc}
            onChange={(e) => setCompanyForm({ ...companyForm, rfc: e.target.value })}
          />
          <Input
            label="Dirección del Proyecto (Opcional)"
            placeholder="Ej: Calle 10 # 5-20, Bogotá"
            value={companyForm.address}
            onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
          />
          <Input
            label="Teléfono de Contacto (Opcional)"
            placeholder="Ej: 3101234567"
            value={companyForm.phone}
            onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
          />
          <Input
            label="Correo Electrónico (Opcional)"
            type="email"
            placeholder="contacto@proyecto.com"
            value={companyForm.email}
            onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="glass" type="button" onClick={() => setIsCompanyModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Crear Proyecto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal for Superadmin to edit Subscription */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Gestionar Suscripción: ${selectedTenant?.name}`}
      >
        <form onSubmit={handleUpdateTenant} className="space-y-6 pt-4">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-accent-blue uppercase tracking-wider">Datos de Identidad de la Empresa</h4>
            <Input
              label="Nombre de la Empresa"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <Input
              label="NIT"
              value={editForm.nit}
              onChange={(e) => setEditForm({ ...editForm, nit: e.target.value })}
              placeholder="NIT"
            />
            <Input
              label="Dirección"
              value={editForm.address}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              placeholder="Dirección"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Teléfono"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                placeholder="Teléfono"
              />
              <Input
                label="Correo de la Empresa"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Correo corporativo"
              />
            </div>
          </div>

          <div className="border-t border-glass-border pt-4">
            <h4 className="text-xs font-bold text-accent-blue uppercase tracking-wider mb-4">Suscripción y Módulos</h4>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Plan Contratado</label>
              <select
                value={editForm.plan}
                onChange={(e: any) => setEditForm({ ...editForm, plan: e.target.value })}
                className="w-full bg-dark-secondary border border-glass-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none text-white"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Estado Equipo</label>
              <select
                value={editForm.status}
                onChange={(e: any) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-dark-secondary border border-glass-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-blue outline-none text-white"
              >
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
                <option value="trial">Prueba (Trial)</option>
              </select>
            </div>
          </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Inicio de Suscripción"
              type="date"
              value={editForm.subscriptionStart}
              onChange={(e) => setEditForm({ ...editForm, subscriptionStart: e.target.value })}
            />
            <Input
              label="Fin de Suscripción"
              type="date"
              value={editForm.subscriptionEnd}
              onChange={(e) => setEditForm({ ...editForm, subscriptionEnd: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-glass-border">
            <h3 className="text-sm font-semibold text-accent-purple uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Límites y Recursos (IA)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Chat IA - Mensual"
                type="number"
                value={editForm.aiChatLimitMonthly}
                onChange={(e) => setEditForm({ ...editForm, aiChatLimitMonthly: parseInt(e.target.value) })}
                placeholder="Ej: 1000"
              />
              <Input
                label="Chat IA - Diario"
                type="number"
                value={editForm.aiChatLimitDaily}
                onChange={(e) => setEditForm({ ...editForm, aiChatLimitDaily: parseInt(e.target.value) })}
                placeholder="Ej: 50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent-blue" />
              Módulos Activos
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['cobranzas', 'contabilidad'].map((mod) => (
                <label key={mod} className="flex items-center gap-3 p-3 glass-card border-glass-border rounded-xl cursor-pointer hover:bg-glass-secondary transition-colors">
                  <input
                    type="checkbox"
                    checked={editForm.activeModules.includes(mod)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...editForm.activeModules, mod]
                        : editForm.activeModules.filter(m => m !== mod)
                      setEditForm({ ...editForm, activeModules: next })
                    }}
                    className="w-4 h-4 accent-accent-blue"
                  />
                  <span className="text-sm font-medium capitalize">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
            <Button variant="glass" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
