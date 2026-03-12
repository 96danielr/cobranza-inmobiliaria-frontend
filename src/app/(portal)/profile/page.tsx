'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Shield, LogOut, Eye, EyeOff } from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/lib/auth'
import { formatPin } from '@/lib/utils'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/ui/Modal'

const changePinSchema = z.object({
  currentPin: z.string()
    .length(4, 'El PIN actual debe tener 4 dígitos')
    .regex(/^\d{4}$/, 'El PIN debe ser numérico'),
  newPin: z.string()
    .length(4, 'El nuevo PIN debe tener 4 dígitos')
    .regex(/^\d{4}$/, 'El PIN debe ser numérico'),
  confirmPin: z.string()
    .length(4, 'Debe confirmar el PIN')
    .regex(/^\d{4}$/, 'El PIN debe ser numérico')
}).refine((data) => data.newPin === data.confirmPin, {
  message: 'Los PINs no coinciden',
  path: ['confirmPin']
}).refine((data) => data.currentPin !== data.newPin, {
  message: 'El nuevo PIN debe ser diferente al actual',
  path: ['newPin']
})

type ChangePinFormData = z.infer<typeof changePinSchema>

export default function ProfilePage() {
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [isChangingPin, setIsChangingPin] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const { client, logout } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ChangePinFormData>({
    resolver: zodResolver(changePinSchema)
  })

  const currentPinValue = watch('currentPin', '')
  const newPinValue = watch('newPin', '')
  const confirmPinValue = watch('confirmPin', '')

  const handlePinInput = (
    field: 'currentPin' | 'newPin' | 'confirmPin',
    value: string
  ) => {
    const formatted = formatPin(value)
    setValue(field, formatted)
  }

  const onSubmitPinChange = async (data: ChangePinFormData) => {
    setIsChangingPin(true)
    
    try {
      const result = await authService.changePin({
        currentPin: data.currentPin,
        newPin: data.newPin
      })

      if (result.success) {
        toast.success('PIN actualizado correctamente')
        reset()
      } else {
        toast.error(result.message || 'Error cambiando el PIN')
      }
    } catch (error: any) {
      toast.error('Error de conexión')
    } finally {
      setIsChangingPin(false)
    }
  }

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true)
    
    try {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))
      logout()
    } finally {
      setIsLoggingOut(false)
      setShowLogoutModal(false)
    }
  }

  if (!client) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6 animate-fade-in-up">
        <User className="w-6 h-6 text-accent-blue mr-3" />
        <div>
          <h1 className="text-responsive-lg font-bold text-text-primary">
            Mi Perfil
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Gestiona tu información personal y configuración
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <Card variant="elevated" className="glass-card animate-fade-in-up-delay">
        <CardHeader>
          <h2 className="text-responsive-base font-semibold text-text-primary flex items-center">
            <User className="w-5 h-5 mr-2 text-accent-blue" />
            Datos Personales
          </h2>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Avatar */}
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full flex items-center justify-center mr-6 shadow-glow">
              <span className="text-2xl font-bold text-white">
                {client.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary">
                {client.fullName}
              </h3>
              <p className="text-text-secondary">
                Cliente del portal inmobiliario
              </p>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Nombre Completo
              </label>
              <div className="px-3 py-2 glass-card border border-glass-border rounded-xl">
                <span className="text-text-primary">{client.fullName}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Cédula
              </label>
              <div className="px-3 py-2 glass-card border border-glass-border rounded-xl">
                <span className="text-text-primary">{client.cedula}</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Teléfono
              </label>
              <div className="px-3 py-2 glass-card border border-glass-border rounded-xl">
                <span className="text-text-primary">{client.phone}</span>
              </div>
            </div>
          </div>

          <div className="glass-card border-accent-blue/20 p-4">
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">Nota:</strong> Para actualizar tus datos personales, 
              contacta directamente a la inmobiliaria.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change PIN */}
      <Card variant="elevated" className="glass-card animate-fade-in-up-delay-2">
        <CardHeader>
          <h2 className="text-responsive-base font-semibold text-text-primary flex items-center">
            <Shield className="w-5 h-5 mr-2 text-accent-green" />
            Cambiar PIN
          </h2>
          <p className="text-sm text-text-secondary">
            Actualiza tu PIN de acceso por seguridad
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitPinChange)} className="space-y-6">
            {/* Current PIN */}
            <div>
              <div className="relative">
                <Input
                  label="PIN Actual"
                  type={showCurrentPin ? 'text' : 'password'}
                  placeholder="PIN de 4 dígitos"
                  value={currentPinValue}
                  onChange={(e) => handlePinInput('currentPin', e.target.value)}
                  error={errors.currentPin?.message}
                  maxLength={4}
                  inputMode="numeric"
                  className="glass-input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors min-h-[44px] touch-target"
                >
                  {showCurrentPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New PIN */}
            <div>
              <div className="relative">
                <Input
                  label="Nuevo PIN"
                  type={showNewPin ? 'text' : 'password'}
                  placeholder="PIN de 4 dígitos"
                  value={newPinValue}
                  onChange={(e) => handlePinInput('newPin', e.target.value)}
                  error={errors.newPin?.message}
                  maxLength={4}
                  inputMode="numeric"
                  className="glass-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors min-h-[44px] touch-target"
                >
                  {showNewPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm PIN */}
            <div>
              <div className="relative">
                <Input
                  label="Confirmar Nuevo PIN"
                  type={showConfirmPin ? 'text' : 'password'}
                  placeholder="Confirma el PIN"
                  value={confirmPinValue}
                  onChange={(e) => handlePinInput('confirmPin', e.target.value)}
                  error={errors.confirmPin?.message}
                  maxLength={4}
                  inputMode="numeric"
                  className="glass-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-9 text-text-muted hover:text-text-secondary transition-colors min-h-[44px] touch-target"
                >
                  {showConfirmPin ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full glass-button min-h-[44px] touch-target"
              loading={isChangingPin}
              disabled={!currentPinValue || !newPinValue || !confirmPinValue}
            >
              <Shield className="w-4 h-4 mr-2" />
              Cambiar PIN
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card variant="elevated" className="glass-card animate-fade-in-up-delay-3">
        <CardHeader>
          <h2 className="text-responsive-base font-semibold text-text-primary">
            Gestión de Sesión
          </h2>
          <p className="text-sm text-text-secondary">
            Cierra tu sesión de forma segura
          </p>
        </CardHeader>
        
        <CardContent>
          <Button
            variant="danger"
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-accent-red/15 border-accent-red/20 text-accent-red hover:bg-accent-red/25 min-h-[44px] touch-target"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
        title="Cerrar Sesión"
        message="¿Estás seguro que deseas cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al portal."
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </div>
  )
}