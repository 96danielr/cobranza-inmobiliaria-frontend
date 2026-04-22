'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Home, ShieldCheck } from 'lucide-react'

import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(6, 'Contraseña requerida')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, admin, isLoading } = useAdminAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const emailValue = watch('email', '')
  const passwordValue = watch('password', '')

  useEffect(() => {
    if (isAuthenticated && admin) {
      if (admin.role === 'cliente') {
        router.push('/portal/dashboard')
      } else {
        router.push('/admin/dashboard')
      }
    }
  }, [isAuthenticated, admin, router])

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.email, data.password)

    if (result.success) {
      toast.success('¡Bienvenido a tu portal!')
    } else {
      toast.error(result.message || 'Error de autenticación')
    }
  }

  if (isAuthenticated && admin) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin shadow-glow" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-purple/10" />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(59,130,246,0.15)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 glass-card mb-6 shadow-glow border-accent-blue/30">
            <Home className="w-10 h-10 text-accent-blue" />
          </div>
          <h1 className="text-responsive-xl font-bold text-text-primary mb-3">
            <span className="gradient-text">Portal Cliente</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Bienvenido. Gestiona tus lotes y pagos de forma segura.
          </p>
        </div>

        <Card variant="elevated" className="border-t-4 border-accent-blue">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2 glass-button px-4 py-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-accent-green" />
                <span className="text-text-secondary font-medium">Acceso Seguro</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Correo Electrónico"
                  placeholder="tu@email.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    error={errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-glass-secondary transition-all duration-300 flex items-center justify-center"
                    style={{ marginTop: '12px' }}
                  >
                    {showPassword ? <EyeOff size={16} className="text-text-secondary" /> : <Eye size={16} className="text-text-secondary" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                loading={isLoading}
                disabled={!emailValue || !passwordValue}
                glow
              >
                Ingresar al Portal
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                ¿No tienes una cuenta? <br />
                <span className="text-xs">Contacta a tu asesor para activar tu acceso.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-text-muted">
          © 2026 Sistema de Cobranza Inmobiliaria
        </div>
      </div>
    </div>
  )
}