'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Home } from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCedula, formatPin } from '@/lib/utils'

const loginSchema = z.object({
  cedula: z.string()
    .min(5, 'La cédula debe tener mínimo 5 dígitos')
    .max(15, 'La cédula debe tener máximo 15 dígitos')
    .regex(/^\d+$/, 'La cédula solo debe contener números'),
  pin: z.string()
    .length(4, 'El PIN debe tener exactamente 4 dígitos')
    .regex(/^\d{4}$/, 'El PIN debe ser numérico')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPin, setShowPin] = useState(false)
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const cedulaValue = watch('cedula', '')
  const pinValue = watch('pin', '')

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/home')
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: LoginFormData) => {
    const result = await login(data.cedula, data.pin)
    
    if (result.success) {
      toast.success('¡Bienvenido!')
      router.push('/home')
    } else {
      toast.error(result.message || 'Error de autenticación')
    }
  }

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCedula(e.target.value)
    setValue('cedula', formatted)
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPin(e.target.value)
    setValue('pin', formatted)
  }

  if (isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-purple/10" />
      
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 glass-card mb-6 shadow-glow">
            <Home className="w-10 h-10 text-accent-blue" />
          </div>
          <h1 className="text-responsive-xl font-bold text-text-primary mb-3 gradient-text">
            Portal Cliente
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Sistema de Cobranza Inmobiliaria
          </p>
        </div>

        <Card variant="elevated">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Cedula Input */}
              <div>
                <Input
                  label="Cédula"
                  placeholder="Ingresa tu número de cédula"
                  value={cedulaValue}
                  onChange={handleCedulaChange}
                  error={errors.cedula?.message}
                  maxLength={15}
                  inputMode="numeric"
                />
              </div>

              {/* PIN Input */}
              <div>
                <div className="relative">
                  <Input
                    label="PIN"
                    type={showPin ? 'text' : 'password'}
                    placeholder="PIN de 4 dígitos"
                    value={pinValue}
                    onChange={handlePinChange}
                    error={errors.pin?.message}
                    maxLength={4}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-glass-secondary transition-all duration-300 flex items-center justify-center"
                    style={{marginTop: '12px'}}
                  >
                    {showPin ? <EyeOff size={16} className="text-text-secondary" /> : <Eye size={16} className="text-text-secondary" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
                disabled={!cedulaValue || !pinValue}
                glow
              >
                Ingresar
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                ¿Problemas para ingresar?{' '}
                <a 
                  href="#" 
                  className="text-accent-blue hover:text-accent-purple font-medium transition-colors"
                >
                  Contacta soporte
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-text-muted">
          © 2024 Sistema de Cobranza Inmobiliaria
        </div>
      </div>
    </div>
  )
}