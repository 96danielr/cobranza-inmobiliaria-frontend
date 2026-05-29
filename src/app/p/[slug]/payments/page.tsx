'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Combobox } from '@/components/ui/Combobox'
import { apiPublic } from '@/lib/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function PublicPaymentPage() {
  const { slug } = useParams()
  const [step, setStep] = useState(1) // 1: Cedula, 2: Selection, 3: Form, 4: Success
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientData, setClientData] = useState<any>(null)

  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [selectedQuota, setSelectedQuota] = useState<any>(null)
  const [activeContractId, setActiveContractId] = useState<string>('')
  const [expandedContracts, setExpandedContracts] = useState<string[]>([])

  // Payment Form
  const [amount, setAmount] = useState('')
  const [bank, setBank] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [observations, setObservations] = useState('')
  const [capture, setCapture] = useState<File | null>(null)
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

  const handleSearchClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!idNumber.trim()) return

    setLoading(true)
    try {
      const response = await apiPublic.getClientInfo(slug as string, idNumber)
      if (response.data.success) {
        setClientData(response.data.data)
        if (response.data.data.contracts?.length > 0) {
          setActiveContractId(response.data.data.contracts[0]._id)
        }
        setStep(2)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'No se encontró información para esta cédula')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContract = (contract: any) => {
    setSelectedContract(contract)
    // If only one quota pending, select it? Or just let them pick
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

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('quotaId', selectedQuota._id)
      formData.append('amount', amount)
      formData.append('bank', bank)
      formData.append('phone', phone)
      formData.append('email', email)
      formData.append('observations', observations)
      formData.append('capture', capture)
      formData.append('paymentDate', new Date().toISOString())

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
              <p className="text-text-secondary mt-2">Ingresa tu cédula para ver tus cuotas pendientes</p>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSearchClient} className="space-y-4">
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
                        // Reset expansion on switch
                        setExpandedContracts([]);
                      }}
                      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700/80'
                      }`}
                    >
                      Mz {contract.lot?.lotNumber} - Lote {contract.lot?.nomenclature}
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

                const isExpanded = expandedContracts.includes(contract._id);
                const visibleQuotas = isExpanded ? pendingQuotas : pendingQuotas.slice(0, 3);

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
                              {contract.lot?.stage} - Mz {contract.lot?.lotNumber} Lote {contract.lot?.nomenclature}
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
              onClick={() => setStep(1)}
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
                        <DollarSign className="w-4 h-4 text-accent-blue" />
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

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-accent-purple" />
                        ¿Desde qué banco?
                      </label>
                      <Combobox
                        options={banks.map((b: any) => ({ value: b.acronym, label: b.acronym }))}
                        value={bank}
                        onChange={setBank}
                        placeholder="Selecciona tu banco..."
                        searchPlaceholder="Escribir nombre del banco..."
                        className="h-12"
                      />
                      {loadingBanks && <p className="text-[10px] text-text-muted mt-1 animate-pulse">Cargando bancos...</p>}
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
                      Captura del comprobante
                    </label>
                    <div className="relative">
                      <Input
                        type="file"
                        onChange={(e) => setCapture(e.target.files?.[0] || null)}
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Comentarios (Opcional)</label>
                    <textarea
                      className="glass-input w-full p-3 h-24"
                      placeholder="Cuota de marzo, pago parcial, etc."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
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
            <Button
              className="w-full h-12 glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30"
              onClick={() => {
                setStep(1)
                setIdNumber('')
                setCapture(null)
                setBank('')
                setAmount('')
              }}
            >
              Realizar otro pago
            </Button>
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
