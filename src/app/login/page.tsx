'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { useThemeStore } from '@/stores/themeStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'

const loginSchema = z.object({
  email: z.string().min(1, 'Email o Documento requerido'),
  password: z.string().min(4, 'Contraseña requerida')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showOtpScreen, setShowOtpScreen] = useState(false)
  const [otpData, setOtpData] = useState<any>(null)
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''))
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const router = useRouter()
  const { theme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && theme === 'light'
    ? '/PERFIL FONDO BLANCO.jpeg'
    : '/PERFIL FONDO AZUL OSCURO.jpeg'

  const { login, verifyOtp, isAuthenticated, admin, isLoading } = useAdminAuthStore()

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
      if (result.requiresOtp) {
        setOtpData(result.otpData)
        setShowOtpScreen(true)
        setOtpDigits(Array(6).fill(''))
        toast.success('Código de verificación enviado a tu celular')
      } else {
        toast.success('¡Bienvenido a tu portal!')
      }
    } else {
      toast.error(result.message || 'Error de autenticación')
    }
  }

  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '')
    if (!digit) return
    const next = [...otpDigits]
    next[index] = digit.slice(0, 1)
    setOtpDigits(next)
    if (index < 5) otpRefs.current[index + 1]?.focus()
  }, [otpDigits])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const next = [...otpDigits]
        next[index] = ''
        setOtpDigits(next)
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus()
      }
    }
  }, [otpDigits])

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otpDigits]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setOtpDigits(next)
    const nextIdx = next.findIndex(d => !d)
    otpRefs.current[nextIdx === -1 ? 5 : nextIdx]?.focus()
  }, [otpDigits])

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otpDigits.join('')
    if (otpCode.length < 6) {
      toast.error('Ingrese el código de verificación de 6 dígitos completo')
      return
    }

    const result = await verifyOtp(otpData, otpCode)
    if (result.success) {
      toast.success('¡Bienvenido a tu portal!')
    } else {
      toast.error(result.message || 'Código incorrecto o expirado')
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
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl overflow-hidden glass-card mb-6 shadow-glow border-glass-border p-1">
            <img 
              src={logoSrc} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-2xl" 
            />
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

            {showOtpScreen ? (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                <div className="text-center space-y-2 bg-glass-primary/5 p-4 rounded-xl border border-glass-border/30">
                  <p className="text-sm text-text-secondary">
                    Hemos enviado un código de verificación OTP de 6 dígitos a tu celular:
                  </p>
                  <p className="text-base font-bold text-accent-blue tracking-wide">
                    {otpData?.phone ? `+${otpData.phone.slice(0, 2)} *****${otpData.phone.slice(-4)}` : 'celular registrado'}
                  </p>
                </div>

                <div className="flex gap-2 justify-center py-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpDigits[i]}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 border-glass-border bg-white/5 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 outline-none transition-all text-text-primary"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  loading={isLoading}
                  disabled={otpDigits.join('').length < 6}
                  glow
                >
                  Verificar Código
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-glass-border text-text-secondary"
                  onClick={() => setShowOtpScreen(false)}
                >
                  Volver al Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Input
                    label="Usuario (Email o Documento)"
                    placeholder="Ej: 1023456789 o correo@ejemplo.com"
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
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-text-muted">
                ¿No tienes una cuenta? <br />
                <span className="text-xs">Contacta a tu asesor para activar tu acceso.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-text-muted">
          © 2026 Operix - Sistema de Cobranza Inmobiliaria
        </div>
      </div>
    </div>
  )
}