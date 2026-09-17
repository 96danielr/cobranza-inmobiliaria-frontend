'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Search,
  User,
  MapPin,
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Calendar,
  DollarSign,
  Mail,
  Phone,
  ShieldCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Combobox } from '@/components/ui/Combobox'
import { Select } from '@/components/ui/Select'
import { apiPublic } from '@/lib/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/authStore'
import { formatPropertyUnit } from '@/lib/propertyTypes'

const rotateImageFile = (file: File, rotationDegrees: number): Promise<File> => {
  return new Promise((resolve) => {
    if (rotationDegrees === 0) {
      resolve(file)
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        if (rotationDegrees % 180 === 90) {
          canvas.width = img.height
          canvas.height = img.width
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotationDegrees * Math.PI) / 180)
        ctx.drawImage(img, -img.width / 2, -img.height / 2)

        canvas.toBlob((blob) => {
          if (blob) {
            const rotatedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(rotatedFile)
          } else {
            resolve(file)
          }
        }, file.type)
      }
      img.onerror = () => resolve(file)
      img.src = event.target?.result as string
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}

export default function PublicPaymentPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/report-payment')
    }
  }, [isAuthenticated, router])

  // steps: 1 (ID), 1.5 (Select OTP channel), 1.7 (Input OTP code), 2 (Quotas), 3 (Form), 4 (Success)
  const [step, setStep] = useState<number>(1) 
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState<any>(null)
  const [maskedContact, setMaskedContact] = useState({ email: '', phone: '' })
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'phone' | ''>('')
  const [otpToken, setOtpToken] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''))
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [selectedQuota, setSelectedQuota] = useState<any>(null)
  const [activeContractId, setActiveContractId] = useState<string>('')
  const [expandedContracts, setExpandedContracts] = useState<string[]>([])

  // Payment Form
  const [amount, setAmount] = useState('')
  const [bank, setBank] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Transferencia bancaria')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [observations, setObservations] = useState('')
  const [capture, setCapture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [clientRotationAngle, setClientRotationAngle] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [banks, setBanks] = useState<any[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [paymentOption, setPaymentOption] = useState<'minimo' | 'total' | 'otro'>('minimo')

  useEffect(() => {
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    try {
      setLoadingBanks(true)
      const response = await apiPublic.getBanks(slug as string)
      if (response.data.success) {
        setBanks(response.data.data.banks)
      }
    } catch (error) {

    } finally {
      setLoadingBanks(false)
    }
  }

  // Step 1: Search Client & mask contact details
  const handleQueryClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!idNumber.trim()) return

    setLoading(true)
    try {
      const response = await apiPublic.getClientInfo(slug as string, idNumber)
      if (response.data.success) {
        const client = response.data.data.client
        if (client) {
          // Mask email: j****@domain.com
          let maskedEmail = ''
          if (client.email && client.email.includes('@')) {
            const [local, domain] = client.email.split('@')
            maskedEmail = local.length > 2 
              ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
              : `${local[0]}*@${domain}`
          }
          // Mask phone: *******123
          let maskedPhone = ''
          if (client.phone) {
            const phStr = client.phone.toString()
            maskedPhone = phStr.length > 4
              ? '*'.repeat(phStr.length - 4) + phStr.slice(-4)
              : phStr
          }
          setMaskedContact({ email: maskedEmail, phone: maskedPhone })
        }
        setStep(1.5)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se encontró información para esta cédula')
    } finally {
      setLoading(false)
    }
  }

  // Step 1.5: Send OTP Code
  const handleSendOTP = async (channel: 'email' | 'phone') => {
    setSelectedChannel(channel)
    setLoading(true)
    try {
      const response = await apiPublic.sendOTPCode(slug as string, idNumber, channel)
      if (response.data.success) {
        setOtpToken(response.data.data.token)
        setOtpDigits(Array(6).fill(''))
        setVerificationCode('')
        toast.success(response.data.message)
        setStep(1.7)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar el código OTP')
    } finally {
      setLoading(false)
    }
  }

  // OTP digit box handlers
  const handleOtpChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '')
    if (!digit) return
    const next = [...otpDigits]
    next[index] = digit.slice(0, 1)
    setOtpDigits(next)
    setVerificationCode(next.join(''))
    if (index < 5) otpRefs.current[index + 1]?.focus()
  }, [otpDigits])

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        const next = [...otpDigits]
        next[index] = ''
        setOtpDigits(next)
        setVerificationCode(next.join(''))
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
    setVerificationCode(next.join(''))
    const nextIdx = next.findIndex(d => !d)
    otpRefs.current[nextIdx === -1 ? 5 : nextIdx]?.focus()
  }, [otpDigits])

  // Step 1.7: Verify OTP Code
  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!verificationCode.trim()) return

    setLoading(true)
    try {
      const response = await apiPublic.verifyOTPCode(slug as string, otpToken, verificationCode)
      if (response.data.success) {
        setClientData(response.data.data)
        const client = response.data.data.client
        if (client) {
          if (client.phone) setPhone(client.phone)
          if (client.email) setEmail(client.email)
        }
        if (response.data.data.contracts?.length > 0) {
          setActiveContractId(response.data.data.contracts[0]._id)
        }
        toast.success(response.data.message)
        setStep(2)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código de verificación incorrecto o expirado')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (file: File | null) => {
    setCapture(file)
    setClientRotationAngle(0)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSelectContract = (contract: any) => {
    setSelectedContract(contract)
  }

  const handleSelectQuota = (quota: any) => {
    setSelectedQuota(quota)
    setAmount(quota.value.toString())
    setStep(3)
  }

  const toggleContractExpanded = (contractId: string) => {
    setExpandedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId) 
        : [...prev, contractId]
    )
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!capture) {
      toast.error('Por favor sube una captura del comprobante')
      return
    }
    if (paymentMethod !== 'Efectivo' && !bank) {
      toast.error('Por favor selecciona el banco receptor de la consignación')
      return
    }

    setSubmitting(true)
    try {
      let finalCapture = capture
      if (clientRotationAngle > 0) {
        finalCapture = await rotateImageFile(capture, clientRotationAngle)
      }

      const formData = new FormData()
      formData.append('quotaId', selectedQuota._id)
      formData.append('amount', amount)
      formData.append('bank', paymentMethod === 'Efectivo' ? 'EFECTIVO' : bank)
      formData.append('paymentMethod', paymentMethod)
      formData.append('phone', phone)
      formData.append('email', email)
      formData.append('observations', observations)
      formData.append('capture', finalCapture)
      formData.append('paymentDate', new Date().toISOString())
      formData.append('otpToken', otpToken)

      const response = await apiPublic.reportPayment(formData)
      if (response.data.success) {
        setStep(4)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al reportar el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4 md:p-8">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-accent-blue/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="w-full max-w-xl animate-fade-in-up">
        {/* Step 1: ID Entry */}
        {step === 1 && (
          <Card variant="elevated" className="border-glass-border glass-effect">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-accent-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-blue/30">
                <CreditCard className="w-8 h-8 text-accent-blue" />
              </div>
              <CardTitle className="text-responsive-2xl font-bold text-text-primary">Reportar mi Pago</CardTitle>
              <p className="text-text-secondary mt-2">Ingresa tu cédula para iniciar el proceso seguro de pago</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleQueryClient} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <Input
                    placeholder="Número de cédula"
                    className="glass-input pl-10 h-12 text-lg"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Consultar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 1.5: Select OTP Destination */}
        {step === 1.5 && (
          <Card variant="elevated" className="border-glass-border glass-effect">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-accent-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-purple/30">
                <ShieldCheck className="w-8 h-8 text-accent-purple" />
              </div>
              <CardTitle className="text-xl font-bold text-text-primary">Verificación de Identidad</CardTitle>
              <p className="text-text-secondary mt-2">Para proteger tus datos, selecciona dónde deseas recibir tu código de seguridad OTP de 6 dígitos:</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {!maskedContact.email && !maskedContact.phone ? (
                <div className="text-center p-6 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red space-y-3">
                  <AlertCircle className="w-10 h-10 mx-auto" />
                  <p className="font-bold text-base">Sin métodos de contacto registrados</p>
                  <p className="text-sm text-text-secondary">
                    No posees un correo electrónico ni un número de celular registrados en nuestro sistema. Por favor, comunícate con la administración de la constructora/inmobiliaria para registrar tus datos de contacto y poder habilitar tu acceso seguro.
                  </p>
                </div>
              ) : (
                <>
                  {maskedContact.email && (
                    <button
                      onClick={() => handleSendOTP('email')}
                      disabled={loading}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-glass-border bg-glass-primary/10 hover:bg-accent-blue/15 hover:border-accent-blue/40 transition-all text-left group"
                    >
                      <div className="p-3 bg-accent-blue/20 rounded-xl border border-accent-blue/30 text-accent-blue">
                        <Mail className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">Enviar por Correo Electrónico</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{maskedContact.email}</p>
                      </div>
                    </button>
                  )}

                  {maskedContact.phone && (
                    <button
                      onClick={() => handleSendOTP('phone')}
                      disabled={loading}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-glass-border bg-glass-primary/10 hover:bg-accent-purple/15 hover:border-accent-purple/40 transition-all text-left group"
                    >
                      <div className="p-3 bg-accent-purple/20 rounded-xl border border-accent-purple/30 text-accent-purple">
                        <Phone className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-text-primary text-sm">Enviar por Celular (SMS / WhatsApp)</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{maskedContact.phone}</p>
                      </div>
                    </button>
                  )}
                </>
              )}

              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="w-full h-12 glass-button border-glass-border text-text-secondary mt-4"
              >
                Volver
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1.7: Enter Verification Code */}
        {step === 1.7 && (
          <Card variant="elevated" className="border-glass-border glass-effect">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-accent-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-blue/30">
                <ShieldCheck className="w-8 h-8 text-accent-blue" />
              </div>
              <CardTitle className="text-xl font-bold text-text-primary">Código de Seguridad</CardTitle>
              <p className="text-text-secondary mt-2">Hemos enviado un código OTP de 6 dígitos. Ingrésalo a continuación:</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex gap-2 justify-center">
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
                      className="w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 border-glass-border bg-white/5 focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30 outline-none transition-all"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verificar y Continuar'}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setStep(1.5)}
                  className="w-full h-12 glass-button border-glass-border text-text-secondary"
                >
                  Cambiar método de envío
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contract & Quota Selection */}
        {step === 2 && clientData && (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-text-primary">Hola, {clientData.client.name}</h1>
              <p className="text-text-secondary">Selecciona la cuota que deseas pagar</p>
            </div>

            {/* Lote Switcher tabs for multiple lots */}
            {clientData.contracts.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/80 max-w-max mx-auto mb-2">
                {clientData.contracts.map((contract: any) => {
                  const isActive = activeContractId === contract._id;
                  return (
                    <button
                      key={contract._id}
                      type="button"
                      onClick={() => {
                        setActiveContractId(contract._id);
                        setExpandedContracts([]);
                      }}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700/80'
                      }`}
                    >
                      {formatPropertyUnit(contract.lot || {})}
                    </button>
                  );
                })}
              </div>
            )}

            {clientData.contracts
              .filter((c: any) => c._id === activeContractId)
              .map((contract: any) => {
                const pendingQuotas = contract.quotas
                  .filter((q: any) => q.status !== 'pagado')
                  .sort((a: any, b: any) => {
                    if (a.type === 'inicial' && b.type !== 'inicial') return -1;
                    if (a.type !== 'inicial' && b.type === 'inicial') return 1;
                    return a.number - b.number;
                  });

                return (
                  <Card key={contract._id} variant="elevated" className="border-glass-border glass-effect">
                    <CardHeader className="pb-2 border-b border-glass-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-green/20 rounded-full flex items-center justify-center border border-accent-green/30">
                            <MapPin className="w-5 h-5 text-accent-green" />
                          </div>
                          <div>
                            <CardTitle className="text-lg text-text-primary">
                              {contract.lot?.stage ? `${contract.lot.stage} - ` : ''}{formatPropertyUnit(contract.lot || {})}
                            </CardTitle>
                            <p className="text-xs text-text-muted italic">{contract.negotiation}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4 pt-2">
                        {pendingQuotas.length > 0 ? (
                          <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                              ¿Cuánto deseas pagar hoy?
                            </p>
                            
                            {/* Pago Mínimo */}
                            <div
                              onClick={() => {
                                const nextQuota = pendingQuotas[0]
                                setSelectedQuota(nextQuota)
                                setPaymentOption('minimo')
                                setAmount(nextQuota.value.toString())
                                setStep(3)
                              }}
                              className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-glass-primary/10 hover:bg-accent-blue/15 hover:border-accent-blue/40 transition-all cursor-pointer group active:scale-[0.99]"
                            >
                              <div>
                                <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                                  Pago Mínimo
                                </p>
                                <p className="text-[11px] text-text-secondary mt-1">Pagar la cuota #{pendingQuotas[0].number} pendiente</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-text-primary text-base">
                                  {formatCurrency(pendingQuotas[0].value)}
                                </span>
                                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent-blue transition-colors" />
                              </div>
                            </div>

                            {/* Pago Total */}
                            <div
                              onClick={() => {
                                const nextQuota = pendingQuotas[0]
                                const totalDebt = pendingQuotas.reduce((sum: number, q: any) => sum + q.value, 0)
                                setSelectedQuota(nextQuota)
                                setPaymentOption('total')
                                setAmount(totalDebt.toString())
                                setStep(3)
                              }}
                              className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-glass-primary/10 hover:bg-accent-green/15 hover:border-accent-green/40 transition-all cursor-pointer group active:scale-[0.99]"
                            >
                              <div>
                                <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                                  Pago Total de la Deuda
                                </p>
                                <p className="text-[11px] text-text-secondary mt-1">Pagar saldo total acumulado de tu lote</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-extrabold text-text-primary text-base">
                                  {formatCurrency(pendingQuotas.reduce((sum: number, q: any) => sum + q.value, 0))}
                                </span>
                                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent-green transition-colors" />
                              </div>
                            </div>

                            {/* Abonar a tu deuda */}
                            <div
                              onClick={() => {
                                const nextQuota = pendingQuotas[0]
                                setSelectedQuota(nextQuota)
                                setPaymentOption('otro')
                                setAmount('')
                                setStep(3)
                              }}
                              className="flex items-center justify-between p-4 rounded-xl border border-glass-border bg-glass-primary/10 hover:bg-accent-purple/15 hover:border-accent-purple/40 transition-all cursor-pointer group active:scale-[0.99]"
                            >
                              <div>
                                <p className="font-bold text-text-primary text-sm flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-accent-purple" />
                                  Otro Valor (Abonar)
                                </p>
                                <p className="text-[11px] text-text-secondary mt-1">Abonar un monto personalizado libre</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-text-secondary italic">
                                  Ingresar monto...
                                </span>
                                <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-accent-purple transition-colors" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-text-muted">
                            <p>No tienes cuotas pendientes para este contrato.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

            <Button
              variant="outline"
              onClick={() => {
                setStep(1)
                setIdNumber('')
                setVerificationCode('')
              }}
              className="w-full h-12 glass-button border-glass-border text-text-secondary"
            >
              Volver
            </Button>
          </div>
        )}

        {/* Step 3: Payment Form */}
        {step === 3 && selectedQuota && (
          <Card variant="elevated" className="border-glass-border glass-effect">
            <CardHeader>
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="p-2"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </Button>
                <div>
                  <CardTitle className="text-xl text-text-primary">Detalles del Pago</CardTitle>
                  <p className="text-sm text-text-muted">Cuota #{selectedQuota.number} - {formatCurrency(selectedQuota.value)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-accent-blue" />
                        Forma de Pago
                      </label>
                      <Select
                        value={paymentMethod}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value)
                          if (e.target.value === 'Efectivo') {
                            setBank('')
                          }
                        }}
                        placeholder="Selecciona la forma de pago"
                        options={[
                          { value: 'Transferencia bancaria', label: 'Transferencia bancaria' },
                          { value: 'Efectivo', label: 'Efectivo' },
                          { value: 'Consignación en corresponsal', label: 'Consignación en corresponsal' },
                          { value: 'Consignación en banco', label: 'Consignación en banco' },
                          { value: 'Transferencia interbancaria', label: 'Transferencia interbancaria' }
                        ]}
                        className="h-12"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-accent-green" />
                        Monto Pagado
                      </label>
                      {paymentOption === 'otro' ? (
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="glass-input h-12 text-lg"
                          required
                          placeholder="Monto a pagar"
                        />
                      ) : (
                        <div className="h-12 px-4 rounded-xl border border-glass-border bg-glass-primary/10 flex items-center justify-between">
                          <span className="font-bold text-text-primary text-base">
                            {formatCurrency(parseFloat(amount) || 0)}
                          </span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                            paymentOption === 'minimo' ? 'bg-accent-blue/15 text-accent-blue' : 'bg-accent-green/15 text-accent-green'
                          }`}>
                            {paymentOption === 'minimo' ? 'Mínimo' : 'Total'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {paymentMethod === 'Efectivo' ? (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-accent-purple" /> Banco
                          </label>
                          <div className="h-12 px-4 rounded-xl border border-glass-border/30 bg-glass-primary/20 flex items-center text-text-disabled select-none">
                            Recibido en Efectivo (Caja)
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-accent-purple" />
                            ¿A qué banco consignas? *
                          </label>
                          <Combobox
                            options={banks.map((b: any) => ({ value: b.acronym, label: b.acronym }))}
                            value={bank}
                            onChange={setBank}
                            placeholder="selecciona el banco"
                            searchPlaceholder="Escribir nombre del banco..."
                            className="h-12 animate-fade-in-up"
                          />
                          {loadingBanks && <p className="text-[10px] text-text-muted mt-1 animate-pulse">Cargando bancos...</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Teléfono de contacto *</label>
                      <Input
                        type="tel"
                        placeholder="Ej. 310 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="glass-input h-12"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Correo electrónico</label>
                      <Input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="glass-input h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-accent-green" />
                      Captura del comprobante *
                    </label>
                    <div className="relative">
                      <Input
                        type="file"
                        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        className="glass-input h-12 pt-2 file:hidden cursor-pointer"
                        accept="image/*"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {capture ? (
                          <div className="flex items-center gap-2 bg-accent-green/20 text-accent-green px-2 py-1 rounded text-xs font-medium border border-accent-green/30">
                            <CheckCircle className="w-3 h-3" />
                            {capture.name.length > 15 ? capture.name.substring(0, 15) + '...' : capture.name}
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted">Seleccionar archivo</span>
                        )}
                      </div>
                    </div>

                    {previewUrl && capture?.type.startsWith('image/') && (
                      <div className="mt-3 p-4 border border-glass-border bg-glass-primary/20 backdrop-blur-glass rounded-xl flex flex-col items-center justify-center space-y-3">
                        <div className="flex justify-between items-center w-full mb-1">
                          <span className="text-xs text-text-secondary font-medium">Vista Previa:</span>
                          <Button
                            type="button"
                            variant="glass"
                            size="sm"
                            className="glass-button text-xs h-8 px-3 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/10"
                            onClick={() => setClientRotationAngle(prev => (prev + 90) % 360)}
                          >
                            Girar Imagen 90°
                          </Button>
                        </div>
                        <div className="relative max-w-full rounded-lg flex items-center justify-center p-4">
                          <img
                            src={previewUrl}
                            alt="Vista previa"
                            style={{ transform: `rotate(${clientRotationAngle}deg) scale(${clientRotationAngle % 180 !== 0 ? 0.65 : 1})` }}
                            className="max-h-60 w-auto rounded shadow-md transition-all duration-300 origin-center object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Comentarios (Opcional)</label>
                    <textarea
                      className="glass-input w-full p-3 h-24"
                      placeholder="Cuota de marzo, pago parcial, etc."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                    <p className="text-xs text-text-muted mt-1 italic">Recuerda que si pagas más de lo que informas puedes escribirlo aquí</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 text-lg font-bold glass-button bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30 shadow-lg shadow-accent-green/10"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Reporte'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card variant="elevated" className="border-glass-border glass-effect p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center mb-6 border border-accent-green/30 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-accent-green" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">¡Pago Reportado!</h2>
            <p className="text-text-secondary text-lg mb-8">
              Tu reporte ha sido enviado exitosamente. El tiempo de respuesta para la validación y aprobación de tu pago es de 1 a 2 días hábiles. Una vez procesado, te enviaremos un correo y un mensaje de confirmación.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                className="w-full sm:w-1/2 h-12 glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30"
                onClick={() => {
                  // Report another payment for the same client (reset payment fields, keep ID/cédula, and ask for a new OTP code)
                  setCapture(null)
                  setPreviewUrl(null)
                  setAmount('')
                  setObservations('')
                  setVerificationCode('')
                  setOtpToken('')
                  setSelectedChannel('')
                  setStep(1.5)
                }}
              >
                Reportar otro pago para esta misma cédula
              </Button>
              <Button
                className="w-full sm:w-1/2 h-12 glass-button bg-accent-purple/20 text-accent-purple border-accent-purple/30"
                onClick={() => {
                  // Report another person
                  setStep(1)
                  setIdNumber('')
                  setCapture(null)
                  setPreviewUrl(null)
                  setBank('')
                  setAmount('')
                  setVerificationCode('')
                  setOtpToken('')
                  setObservations('')
                  setSelectedChannel('')
                  setClientData(null)
                }}
              >
                Reportar pago de otra persona
              </Button>
            </div>
          </Card>
        )}
      </div>

      <footer className="mt-auto pt-8 text-text-muted text-sm flex items-center gap-2 italic">
        <CreditCard className="w-4 h-4" />
        Sistema de Pagos Seguro
      </footer>
    </div>
  )
}
