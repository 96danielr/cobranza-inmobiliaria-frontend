'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Building2, Shield } from 'lucide-react'

import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

const adminLoginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email requerido'),
  password: z.string()
    .min(6, 'La contraseña debe tener mínimo 6 caracteres')
    .min(1, 'Contraseña requerida')
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAdminAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema)
  })

  const emailValue = watch('email', '')
  const passwordValue = watch('password', '')

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: AdminLoginFormData) => {
    const result = await login(data.email, data.password)
    
    if (result.success) {
      toast.success('¡Bienvenido al panel administrativo!')
      router.push('/admin/dashboard')
    } else {
      toast.error(result.message || 'Error de autenticación')
    }
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/15 via-transparent to-accent-blue/15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.1)_0%,transparent_50%)] opacity-60" />
      
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 glass-card mb-6 shadow-glow border-accent-purple/30">
            <Building2 className="w-12 h-12 text-accent-purple" />
          </div>
          <h1 className="text-responsive-xl font-bold text-text-primary mb-3">
            <span className="gradient-text">Panel Administrativo</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Sistema de Cobranza Inmobiliaria
          </p>
        </div>

        <Card variant="elevated">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2 glass-button px-4 py-2">
                <Shield className="w-5 h-5 text-accent-purple" />
                <span className="text-text-primary font-medium">Acceso Administrativo</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Input */}
              <div>
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="admin@inmobiliaria.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              {/* Password Input */}
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
                    style={{marginTop: '12px'}}
                  >
                    {showPassword ? <EyeOff size={16} className="text-text-secondary" /> : <Eye size={16} className="text-text-secondary" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                loading={isLoading}
                disabled={!emailValue || !passwordValue}
                glow
              >
                Iniciar Sesión
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                Solo personal autorizado puede acceder al panel administrativo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-text-muted">
          © 2024 Sistema de Cobranza Inmobiliaria - Panel Administrativo
        </div>
      </div>
    </div>
  )
}