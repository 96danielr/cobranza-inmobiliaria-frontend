'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

import { useAdminAuthStore } from '@/stores/adminAuthStore'
import AuthShell, { AuthField } from '@/components/auth/AuthShell'

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

  const shell = {
    eyebrow: 'Portal cliente',
    quote: ['Tu lote, cuota a cuota,', 'más cerca de tu casa.'] as [string, string],
    quoteNote: 'Consulta tu plan de pagos, reporta tus pagos con el comprobante y descarga tus recibos cuando quieras.',
    variant: 'client' as const,
    switchTo: { text: '¿Trabajas en una inmobiliaria?', label: 'Ingresa al portal empresa', href: '/admin/login' },
  }

  if (isAuthenticated && admin) {
    return (
      <AuthShell {...shell} title="Entrando…" subtitle="Preparando tu portal.">
        <span className="spin" aria-label="Cargando" />
      </AuthShell>
    )
  }

  if (showOtpScreen) {
    return (
      <AuthShell {...shell} title="Verifica tu acceso" subtitle="Escribe el código de 6 dígitos que enviamos a tu celular.">
        <form onSubmit={handleVerifyOtpSubmit} noValidate>
          <p className="auth-note">Código enviado a <b>{otpData?.phone ? `+${otpData.phone.slice(0, 2)} *****${otpData.phone.slice(-4)}` : 'tu celular registrado'}</b></p>
          <div className="auth-otp">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Dígito ${i + 1}`}
                maxLength={1}
                value={otpDigits[i]}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                onPaste={i === 0 ? handleOtpPaste : undefined}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <button type="submit" className="auth-btn" disabled={otpDigits.join('').length < 6 || isLoading}>{isLoading ? <span className="spin" /> : 'Verificar código'}</button>
          <button type="button" className="auth-btn ghost" onClick={() => setShowOtpScreen(false)}>Volver</button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell {...shell} title="Inicia sesión" subtitle="Bienvenido. Entra con tu correo o tu número de documento.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthField label="Correo o documento" autoComplete="username" placeholder="1023456789 o correo@ejemplo.com" {...register('email')} error={errors.email?.message} />
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
          {isLoading ? <span className="spin" /> : 'Entrar a mi portal'}
        </button>
        <p className="auth-note">¿Aún no tienes acceso? Pídeselo al asesor de tu inmobiliaria.</p>
      </form>
    </AuthShell>
  )
}
