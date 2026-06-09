'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ShieldCheck, Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiPublic } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ClientValidationPage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [clientInfo, setClientInfo] = useState({
    name: '',
    idNumber: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (token) {
      fetchClientDetails()
    } else {
      setLoading(false)
      toast.error('Token de validación no suministrado')
    }
  }, [token])

  const fetchClientDetails = async () => {
    try {
      const response = await apiPublic.getClientByValidationToken(slug as string, token as string)
      if (response.data.success) {
        setClientInfo(response.data.data)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Token inválido o enlace expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientInfo.email || !clientInfo.phone) {
      toast.error('Tanto el correo como el teléfono son obligatorios para validar la información.')
      return
    }

    setSubmitting(true)
    try {
      const response = await apiPublic.confirmClientValidation(
        slug as string,
        token as string,
        clientInfo.email,
        clientInfo.phone
      )
      if (response.data.success) {
        setSuccess(true)
        toast.success(response.data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al validar tus datos')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-accent-blue" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {success ? (
          <Card variant="elevated" className="border-glass-border glass-effect p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center mb-6 border border-accent-green/30 animate-scale-in">
              <CheckCircle2 className="w-12 h-12 text-accent-green" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">¡Datos Verificados!</h2>
            <p className="text-text-secondary text-sm mb-6">
              Tus datos han sido validados exitosamente en nuestro sistema. A partir de ahora podrás recibir notificaciones oficiales de tus cuotas, recibos de pago y códigos de ingreso.
            </p>
          </Card>
        ) : (
          <Card variant="elevated" className="border-glass-border glass-effect">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-accent-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-blue/30">
                <ShieldCheck className="w-8 h-8 text-accent-blue" />
              </div>
              <CardTitle className="text-xl font-bold text-text-primary">Validación de Datos</CardTitle>
              <p className="text-text-secondary text-xs mt-2">
                Hola, <strong>{clientInfo.name}</strong> (C.C. {clientInfo.idNumber}). Verifica tus datos de contacto registrados para habilitar tu portal de forma segura. Corrige cualquier error si es necesario:
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-accent-blue" />
                    Correo Electrónico
                  </label>
                  <Input
                    type="email"
                    placeholder="ejemplo@correo.com"
                    className="glass-input h-11"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-accent-purple" />
                    Número Celular (SMS / WhatsApp)
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ej. 3101234567"
                    className="glass-input h-11"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !token}
                  className="w-full h-12 text-sm font-semibold glass-button bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30 shadow-lg shadow-accent-green/10 mt-6"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Datos'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
