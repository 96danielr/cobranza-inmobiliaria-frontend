'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Building2, ChevronRight, RefreshCw, Plus } from 'lucide-react'

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
}

export default function SelectCompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    tenantName: '',
    fullName: '',
    email: '',
    password: ''
  })
  const [companyForm, setCompanyForm] = useState({
    name: '',
    rfc: ''
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
      const response = await adminApi.getCompanies()
      if (response.data.success) {
        setCompanies(response.data.data.companies)
        
        // Auto-select if only one company (and not superadmin)
        const activeCompanies = response.data.data.companies.filter(
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
    setSelectedCompany(company._id)
    toast.success(`Empresa seleccionada: ${company.name}`)
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
        setForm({ tenantName: '', fullName: '', email: '', password: '' })
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
        toast.success('Empresa creada exitosamente')
        setIsCompanyModalOpen(false)
        setCompanyForm({ name: '', rfc: '' })
        fetchCompanies()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear empresa')
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
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 glass-card mb-4 shadow-glow border-accent-blue/30 rounded-2xl">
          <Building2 className="w-8 h-8 text-accent-blue" />
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-2xl font-bold text-text-primary">
            {admin?.role === 'superadmin' ? 'Administrar empresas' : 'Seleccionar Empresa'}
          </h1>
          {admin?.role === 'superadmin' ? (
            <Button 
              variant="glass" 
              size="sm" 
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-accent-blue/20 text-accent-blue border-accent-blue/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Empresa / Admin
            </Button>
          ) : admin?.role === 'tenant_admin' ? (
            <Button 
              variant="glass" 
              size="sm" 
              onClick={() => setIsCompanyModalOpen(true)}
              className="mt-2 bg-accent-blue/20 text-accent-blue border-accent-blue/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Empresa
            </Button>
          ) : null}
        </div>
        <p className="text-text-secondary mt-4">
          {admin?.role === 'superadmin' 
            ? 'Selecciona el equipo o empresa para gestionar sus administradores' 
            : 'Selecciona la empresa con la que deseas trabajar'}
        </p>
      </div>

      {/* Company List */}
      <div className="space-y-3">
        {companies
          .filter((c) => c.status === 'active')
          .map((company) => (
          <Card
            key={company._id}
            variant="default"
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              selectedCompanyId === company._id
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
                  {company.rfc && (
                    <p className="text-sm text-text-muted">{company.rfc}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.filter((c) => c.status === 'active').length === 0 && (
        <Card variant="default">
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No hay empresas disponibles
            </h3>
            <p className="text-text-secondary mb-4">
              {admin?.role === 'superadmin' 
                ? 'Comienza creando tu primera empresa cliente.'
                : admin?.role === 'tenant_admin'
                ? 'Comienza creando tu primera empresa para este equipo.'
                : 'Contacta al administrador para que te asigne una empresa.'}
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

      {/* Current selection info */}
      {selectedCompanyId && (
        <div className="mt-6 text-center">
          <p className="text-sm text-text-muted">
            {admin?.role === 'superadmin' ? 'Empresa gestionada actualmente:' : 'Empresa actual:'}{' '}
            <span className="text-accent-blue font-medium">
              {companies.find((c) => c._id === selectedCompanyId)?.name || 'Desconocida'}
            </span>
          </p>
        </div>
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
        title="Crear Nueva Empresa"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4 pt-4">
          <Input
            label="Nombre de la Empresa"
            placeholder="Ej: Sede Norte"
            value={companyForm.name}
            onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
          />
          <Input
            label="RFC (Opcional)"
            placeholder="RFC de la empresa"
            value={companyForm.rfc}
            onChange={(e) => setCompanyForm({ ...companyForm, rfc: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="glass" type="button" onClick={() => setIsCompanyModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Crear Empresa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
