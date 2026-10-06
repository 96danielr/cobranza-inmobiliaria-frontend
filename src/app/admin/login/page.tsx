'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ChevronRight } from 'lucide-react'

import { useAdminAuthStore, TenantMembership } from '@/stores/adminAuthStore'
import '@/components/landing/landing.css'   // shared 3D mini-scene styles
import AuthShell, { AuthField } from '@/components/auth/AuthShell'

const adminLoginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email requerido'),
  password: z.string()
    .min(6, 'La contraseña debe tener mínimo 6 caracteres')
    .min(1, 'Contraseña requerida'),
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const {
    login,
    selectTenant,
    isAuthenticated,
    admin,
    isLoading,
    requiresTenantSelection,
    pendingAccountId,
    pendingMemberships,
  } = useAdminAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  })

  const emailValue = watch('email', '')
  const passwordValue = watch('password', '')

  useEffect(() => {
    if (isAuthenticated && admin) {
      if (admin.role === 'cliente') {
        router.push('/portal/dashboard')
      } else {
        router.push('/admin/select-company')
      }
    }
  }, [isAuthenticated, admin, router])

  const onSubmit = async (data: AdminLoginFormData) => {
    const result = await login(data.email, data.password)

    if (result.success && !result.requiresTenantSelection) {
      toast.success('Sesión iniciada correctamente')
      // Immediate redirect based on store state
      const currentAdmin = useAdminAuthStore.getState().admin
      if (currentAdmin?.role === 'cliente') {
        router.push('/portal/dashboard')
      } else {
        router.push('/admin/select-company')
      }
    } else if (result.success && result.requiresTenantSelection) {
      toast('Selecciona tu equipo de trabajo', { icon: '🏢' })
    } else {
      toast.error(result.message || 'Error de autenticación')
    }
  }

  const handleSelectTenant = async (membership: TenantMembership) => {
    if (!pendingAccountId) return

    const result = await selectTenant(pendingAccountId, membership.tenantId)

    if (result.success) {
      toast.success(`¡Bienvenido a ${membership.tenantName}!`)
      router.push('/admin/select-company')
    } else {
      toast.error(result.message || 'Error al seleccionar equipo')
    }
  }

  const shell = {
    eyebrow: 'Portal empresa',
    quote: ['Cada cuota de tus lotes,', 'recaudada y en orden.'] as [string, string],
    quoteNote: 'Entra a aprobar pagos, revisar tu cartera y ver los recibos que llegaron mientras no estabas.',
    variant: 'company' as const,
    switchTo: { text: '¿Eres comprador?', label: 'Ingresa al portal cliente', href: '/login' },
  }

  if (isAuthenticated) {
    return (
      <AuthShell {...shell} title="Entrando…" subtitle="Preparando tu panel.">
        <span className="spin" aria-label="Cargando" />
      </AuthShell>
    )
  }

  // Tenant selection view
  if (requiresTenantSelection && pendingMemberships.length > 0) {
    return (
      <AuthShell {...shell} title="Elige tu equipo" subtitle="Tienes acceso a varios equipos. Selecciona con cuál quieres trabajar.">
        <div className="auth-tenants">
          {pendingMemberships.map((membership) => (
            <button type="button" key={membership.tenantId} className="auth-tenant" onClick={() => handleSelectTenant(membership)}>
              <i>{membership.tenantName.slice(0, 2).toUpperCase()}</i>
              <span><b>{membership.tenantName}</b><small>{membership.role.replace('_', ' ')} · {membership.plan}</small></span>
              <span><ChevronRight size={18} /></span>
            </button>
          ))}
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell {...shell} title="Inicia sesión" subtitle="Bienvenido de vuelta. Solo personal autorizado de tu inmobiliaria.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@inmobiliaria.com" {...register('email')} error={errors.email?.message} />
        <AuthField
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
          end={<button type="button" className="auth-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>}
        />
        <button type="submit" className="auth-btn" disabled={!emailValue || !passwordValue || isLoading}>
          {isLoading ? <span className="spin" /> : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  )
}
