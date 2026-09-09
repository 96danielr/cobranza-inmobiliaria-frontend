'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  DollarSign, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Info,
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface GeneratePlanPagosModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  clientName?: string
  lotInfo?: string
  currentTotalValue?: number
  currentInstallmentsCount?: number
  currentInstallmentValue?: number
  onSuccess?: () => void
}

export function GeneratePlanPagosModal({
  isOpen,
  onClose,
  contractId,
  clientName,
  lotInfo,
  currentTotalValue = 0,
  currentInstallmentsCount = 36,
  currentInstallmentValue = 0,
  onSuccess
}: GeneratePlanPagosModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  
  // Base fields
  const [totalValue, setTotalValue] = useState<string>('')
  const [installmentsCount, setInstallmentsCount] = useState<string>('36')
  const [installmentValue, setInstallmentValue] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [paymentDay, setPaymentDay] = useState<number>(15)
  
  // Balloon / Extraordinary Payments
  const [hasBalloon, setHasBalloon] = useState<boolean>(false)
  const [balloonInterval, setBalloonInterval] = useState<string>('6')
  const [balloonValue, setBalloonValue] = useState<string>('')

  // Initial Quotas
  const [hasInitials, setHasInitials] = useState<boolean>(false)
  const [initialQuotasCount, setInitialQuotasCount] = useState<string>('1')
  const [initialQuotaValue, setInitialQuotaValue] = useState<string>('')

  const [preservePayments, setPreservePayments] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [adjustmentNote, setAdjustmentNote] = useState<string>('')

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setAdjustmentNote('')
      const baseTotal = currentTotalValue > 0 ? String(currentTotalValue) : ''
      const baseCount = currentInstallmentsCount > 0 ? String(currentInstallmentsCount) : '36'
      setTotalValue(baseTotal)
      setInstallmentsCount(baseCount)
      
      if (currentInstallmentValue > 0) {
        setInstallmentValue(String(currentInstallmentValue))
      } else if (currentTotalValue > 0 && currentInstallmentsCount > 0) {
        setInstallmentValue(String(Math.round(currentTotalValue / currentInstallmentsCount)))
      } else {
        setInstallmentValue('')
      }

      setStartDate(dayjs().format('YYYY-MM-DD'))
      setPaymentDay(15)
      setHasBalloon(false)
      setBalloonInterval('6')
      setBalloonValue('')
      setHasInitials(false)
      setInitialQuotasCount('1')
      setInitialQuotaValue('')
      setPreservePayments(true)
    }
  }, [isOpen, currentTotalValue, currentInstallmentsCount, currentInstallmentValue])

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
  }

  // Numbers parsed
  const numInstallments = Number(installmentsCount) || 0
  const valInstallment = Number(installmentValue) || 0
  const numInitials = hasInitials ? (Number(initialQuotasCount) || 0) : 0
  const valInitial = hasInitials ? (Number(initialQuotaValue) || 0) : 0
  const numBalloons = (hasBalloon && Number(balloonInterval) > 0 && numInstallments > 0) 
    ? Math.floor(numInstallments / Number(balloonInterval)) 
    : 0
  const valBalloon = hasBalloon ? (Number(balloonValue) || 0) : 0

  const normalInstallmentsCount = Math.max(0, numInstallments - numBalloons)
  const totalInitials = numInitials * valInitial
  const totalBalloons = numBalloons * valBalloon
  const totalNormals = normalInstallmentsCount * valInstallment
  const projectedTotal = totalInitials + totalNormals + totalBalloons
  const expectedTotal = Number(totalValue) || 0
  const difference = projectedTotal - expectedTotal
  const isBalanced = expectedTotal > 0 && Math.abs(difference) < 100

  // Smart Auto-Calculation helper
  const handleAutoCalculateRegular = () => {
    if (!expectedTotal || expectedTotal <= 0) {
      toast.error('Primero ingresa el Valor Total del Contrato')
      return
    }
    if (!numInstallments || numInstallments <= 0) {
      toast.error('Primero ingresa el número total de cuotas')
      return
    }

    const remainingToCover = expectedTotal - totalInitials - totalBalloons
    if (remainingToCover < 0) {
      toast.error('Las cuotas iniciales o extraordinarias ya superan el valor total')
      return
    }

    if (normalInstallmentsCount <= 0) {
      toast.error('No quedan cuotas regulares para distribuir')
      return
    }

    const suggested = Math.round(remainingToCover / normalInstallmentsCount)
    setInstallmentValue(String(suggested))
    toast.success(`Cuota calculada: ${formatMoney(suggested)}`)
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!expectedTotal || expectedTotal <= 0) {
        toast.error('Por favor ingresa el Valor Total del Contrato')
        return
      }
      if (!numInstallments || numInstallments <= 0) {
        toast.error('Por favor ingresa el número de cuotas')
        return
      }
      if (!valInstallment || valInstallment <= 0) {
        toast.error('Por favor ingresa o autocalcula el valor de la cuota mensual')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (hasInitials && (!numInitials || !valInitial)) {
        toast.error('Indica la cantidad y valor de las cuotas iniciales')
        return
      }
      if (hasBalloon && (!valBalloon || Number(balloonInterval) <= 0)) {
        toast.error('Indica el valor y periodicidad de las cuotas extraordinarias')
        return
      }
      setStep(3)
    }
  }

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!expectedTotal || expectedTotal <= 0) {
      toast.error('Ingrese un valor total de contrato válido')
      return
    }
    if (!numInstallments || numInstallments <= 0) {
      toast.error('Ingrese un número de cuotas válido')
      return
    }
    if (!valInstallment || valInstallment <= 0) {
      toast.error('Ingrese el valor de la cuota mensual')
      return
    }

    if (!adjustmentNote || !adjustmentNote.trim()) {
      toast.error('La NOTA DE AJUSTE es obligatoria. Explica el motivo de la estructuración del plan.')
      return
    }

    try {
      setIsLoading(true)
      const res = await adminApi.generateContractSchedule({
        contractId,
        totalValue: expectedTotal,
        installmentsCount: numInstallments,
        installmentValue: valInstallment,
        startDate,
        paymentDay,
        balloonInterval: hasBalloon ? Number(balloonInterval) : undefined,
        balloonValue: hasBalloon ? Number(balloonValue) : undefined,
        initialQuotasCount: hasInitials ? numInitials : undefined,
        initialQuotaValue: hasInitials ? valInitial : undefined,
        preserveExistingPayments: preservePayments,
        reason: adjustmentNote.trim()
      })

      if (res.data.success) {
        toast.success('¡Plan de financiación estructurado con éxito!')
        if (onSuccess) onSuccess()
        onClose()
      } else {
        toast.error(res.data.message || 'Error al generar el plan')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || err.message || 'Error en el servidor al generar el plan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estructurar Plan de Financiación"
      size="xl"
    >
      <div className="space-y-4 text-xs">
        
        {/* CONTEXT BANNER */}
        <div className="bg-gradient-to-r from-accent-blue/10 via-accent-purple/10 to-transparent p-3 rounded-xl border border-accent-blue/20 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-text-secondary text-[11px] block font-medium">Cliente & Lote:</span>
            <span className="text-text-primary font-bold text-sm">
              {clientName || 'Cliente'} {lotInfo ? `• ${lotInfo}` : ''}
            </span>
          </div>
          <div className="text-right">
            <span className="text-text-secondary text-[11px] block font-medium">Objetivo del Asistente:</span>
            <span className="inline-flex items-center gap-1 text-xs text-accent-blue font-semibold bg-accent-blue/10 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> Crear cronograma completo de pagos
            </span>
          </div>
        </div>

        {/* STEPPER WIZARD HEADER */}
        <div className="grid grid-cols-3 gap-2 border-b border-glass-border/40 pb-3">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
              step === 1 
                ? 'bg-accent-blue/15 border border-accent-blue/40 text-accent-blue font-bold shadow-sm' 
                : 'hover:bg-glass-primary/20 text-text-secondary'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 1 ? 'bg-accent-blue text-white' : 'bg-glass-primary text-text-muted'
            }`}>
              1
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-[11px] font-semibold">Paso 1</span>
              <span className="text-[10px] text-text-muted">Condiciones Base</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (expectedTotal > 0 && numInstallments > 0) setStep(2)
            }}
            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
              step === 2 
                ? 'bg-accent-blue/15 border border-accent-blue/40 text-accent-blue font-bold shadow-sm' 
                : 'hover:bg-glass-primary/20 text-text-secondary'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 2 ? 'bg-accent-blue text-white' : 'bg-glass-primary text-text-muted'
            }`}>
              2
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-[11px] font-semibold">Paso 2</span>
              <span className="text-[10px] text-text-muted">Iniciales & Balón</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (expectedTotal > 0 && numInstallments > 0 && valInstallment > 0) setStep(3)
            }}
            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
              step === 3 
                ? 'bg-accent-blue/15 border border-accent-blue/40 text-accent-blue font-bold shadow-sm' 
                : 'hover:bg-glass-primary/20 text-text-secondary'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 3 ? 'bg-accent-blue text-white' : 'bg-glass-primary text-text-muted'
            }`}>
              3
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="block text-[11px] font-semibold">Paso 3</span>
              <span className="text-[10px] text-text-muted">Resumen & Cuadre</span>
            </div>
          </button>
        </div>

        {/* STEP 1: CONDICIONES BASE */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg flex items-start gap-2 text-text-secondary">
              <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Define los valores principales de la venta. Si ya conoces el total y las cuotas, puedes pulsar <strong>"Autocalcular Cuota Regular"</strong> para que el sistema sugiera el monto exacto sin desfases.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-accent-blue" /> Valor Total Contrato ($ COP) *
                </label>
                <Input
                  type="number"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="Ej: 36000000"
                  className="font-bold text-sm"
                  required
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  {expectedTotal > 0 ? formatMoney(expectedTotal) : 'Precio total del lote'}
                </span>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-accent-blue" /> Plazo Total (N° de Cuotas) *
                </label>
                <Input
                  type="number"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(e.target.value)}
                  placeholder="Ej: 36, 48, 60"
                  required
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  {numInstallments > 0 ? `${numInstallments} meses (${(numInstallments / 12).toFixed(1)} años)` : 'Meses de pago'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-text-secondary font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-blue" /> Cuota Regular ($ COP) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculateRegular}
                    className="text-[10px] text-accent-blue hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Calculator className="w-3 h-3" /> Autocalcular
                  </button>
                </div>
                <Input
                  type="number"
                  value={installmentValue}
                  onChange={(e) => setInstallmentValue(e.target.value)}
                  placeholder="Ej: 1000000"
                  className="font-bold text-sm"
                  required
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  {valInstallment > 0 ? formatMoney(valInstallment) : 'Pago regular mensual'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-accent-blue" /> Fecha Inicio de Cobro
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Fecha desde la cual empezará a computar la primera cuota
                </span>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Día de Pago del Mes</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                  {[1, 5, 10, 15, 20, 25, 28, 30].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setPaymentDay(day)}
                      className={`py-2 text-center rounded border transition-all ${
                        paymentDay === day
                          ? 'bg-accent-blue text-white border-accent-blue font-bold shadow-sm'
                          : 'bg-glass-primary/30 border-glass-border/40 text-text-secondary hover:bg-glass-primary/60'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-text-muted mt-1 block">
                  Los vencimientos se programarán los días {paymentDay} de cada mes.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-glass-border/40">
              <Button type="button" onClick={handleNextStep} className="bg-accent-blue text-white">
                Siguiente: Cuotas Especiales <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: CUOTAS INICIALES Y EXTRAORDINARIAS */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg flex items-start gap-2 text-text-secondary">
              <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Personaliza la negociación si el cliente acordó pagar una cuota inicial fraccionada o abonos extraordinarios (como primas de junio y diciembre). Si no aplican, puedes dejarlos desactivados.
              </p>
            </div>

            {/* SECCIÓN CUOTA INICIAL */}
            <div className={`p-3.5 rounded-xl border transition-all ${hasInitials ? 'bg-accent-blue/5 border-accent-blue/40 shadow-sm' : 'bg-glass-primary/20 border-glass-border/40'}`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasInitials}
                    onChange={(e) => setHasInitials(e.target.checked)}
                    className="w-4 h-4 rounded border-glass-border text-accent-blue focus:ring-accent-blue"
                  />
                  <div>
                    <span className="font-bold text-text-primary text-xs block">
                      Incluir Cuota Inicial Fraccionada (Separación/Inicial)
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Cuotas que se pagan al inicio de la compra antes o junto con la financiación
                    </span>
                  </div>
                </label>
                {hasInitials && (
                  <span className="text-xs font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">
                    Total Inicial: {formatMoney(totalInitials)}
                  </span>
                )}
              </div>

              {hasInitials && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-3 border-t border-glass-border/30 animate-fade-in">
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">N° de Cuotas Iniciales</label>
                    <Input
                      type="number"
                      value={initialQuotasCount}
                      onChange={(e) => setInitialQuotasCount(e.target.value)}
                      placeholder="Ej: 1, 2 o 3 cuotas"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Valor de Cada Cuota Inicial ($ COP)</label>
                    <Input
                      type="number"
                      value={initialQuotaValue}
                      onChange={(e) => setInitialQuotaValue(e.target.value)}
                      placeholder="Ej: 5000000"
                      className="font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN CUOTAS BALÓN */}
            <div className={`p-3.5 rounded-xl border transition-all ${hasBalloon ? 'bg-accent-yellow/5 border-accent-yellow/40 shadow-sm' : 'bg-glass-primary/20 border-glass-border/40'}`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasBalloon}
                    onChange={(e) => setHasBalloon(e.target.checked)}
                    className="w-4 h-4 rounded border-glass-border text-accent-yellow focus:ring-accent-yellow"
                  />
                  <div>
                    <span className="font-bold text-text-primary text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-accent-yellow" /> Programar Cuotas Extraordinarias / Balón
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Abonos programados cada N meses (e.g. primas semestrales o pagos de fin de año)
                    </span>
                  </div>
                </label>
                {hasBalloon && (
                  <span className="text-xs font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-0.5 rounded">
                    {numBalloons} cuota(s) • Total: {formatMoney(totalBalloons)}
                  </span>
                )}
              </div>

              {hasBalloon && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-3 border-t border-glass-border/30 animate-fade-in">
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Periodicidad del Balón</label>
                    <select
                      value={balloonInterval}
                      onChange={(e) => setBalloonInterval(e.target.value)}
                      className="w-full bg-glass-primary/40 border border-glass-border rounded-md px-3 py-2 text-text-primary focus:outline-none"
                    >
                      <option value="6">Cada 6 meses (Semestral - Junio / Diciembre)</option>
                      <option value="7">Cada 7 meses</option>
                      <option value="12">Cada 12 meses (Anual)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Valor de Cada Balón ($ COP)</label>
                    <Input
                      type="number"
                      value={balloonValue}
                      onChange={(e) => setBalloonValue(e.target.value)}
                      placeholder="Ej: 2000000"
                      className="font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* OPCIÓN PRESERVAR PAGOS HISTÓRICOS */}
            <div className="p-3 bg-glass-primary/10 rounded-xl border border-glass-border/30 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="preservePaymentsCheck"
                checked={preservePayments}
                onChange={(e) => setPreservePayments(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-glass-border text-accent-blue focus:ring-accent-blue"
              />
              <label htmlFor="preservePaymentsCheck" className="cursor-pointer select-none">
                <span className="font-semibold text-text-primary text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-green" /> Protección de Pagos Realizados (Recomendado)
                </span>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Si el cliente ya realizó abonos o cuotas pagadas previamente en este contrato, se mantendrán intactas y no se perderán con el nuevo cronograma.
                </p>
              </label>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-glass-border/40">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver a Condiciones
              </Button>
              <Button type="button" onClick={handleNextStep} className="bg-accent-blue text-white">
                Ver Resumen y Validar <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: RESUMEN Y VALIDACIÓN */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            {/* TARJETA DE SALUD DEL PLAN */}
            <div className={`p-4 rounded-xl border ${
              isBalanced 
                ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  {isBalanced ? (
                    <CheckCircle className="w-6 h-6 text-accent-green shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-sm block">
                      {isBalanced ? '¡Plan Financiero Cuadrado al 100%!' : 'Atención: Hay un desfase en la suma total'}
                    </span>
                    <span className="text-xs text-text-secondary opacity-90">
                      Suma Proyectada: <strong className="text-text-primary">{formatMoney(projectedTotal)}</strong> de un total esperado de <strong className="text-text-primary">{formatMoney(expectedTotal)}</strong>
                    </span>
                  </div>
                </div>

                {!isBalanced && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-amber-500/20 px-2.5 py-1 rounded text-amber-500">
                      Diferencia: {formatMoney(difference)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAutoCalculateRegular}
                      className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold py-1 px-2.5 h-auto"
                    >
                      Ajustar Cuota Regular
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* DESGLOSE POR BLOQUES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-glass-primary/20 border border-glass-border/30 rounded-xl space-y-1">
                <span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold block">
                  1. Cuota Inicial
                </span>
                <span className="text-base font-bold text-text-primary block">
                  {formatMoney(totalInitials)}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {hasInitials ? `${numInitials} cuota(s) de ${formatMoney(valInitial)}` : 'Sin cuota inicial'}
                </span>
              </div>

              <div className="p-3 bg-glass-primary/20 border border-glass-border/30 rounded-xl space-y-1">
                <span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold block">
                  2. Cuotas Ordinarias
                </span>
                <span className="text-base font-bold text-text-primary block">
                  {formatMoney(totalNormals)}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {normalInstallmentsCount} cuotas de {formatMoney(valInstallment)}
                </span>
              </div>

              <div className="p-3 bg-glass-primary/20 border border-glass-border/30 rounded-xl space-y-1">
                <span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold block">
                  3. Cuotas Balón / Extra
                </span>
                <span className="text-base font-bold text-text-primary block">
                  {formatMoney(totalBalloons)}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {hasBalloon ? `${numBalloons} cuota(s) de ${formatMoney(valBalloon)}` : 'Sin extraordinarias'}
                </span>
              </div>
            </div>

            {/* CALENDARIO ESTIMADO */}
            <div className="p-3 bg-glass-primary/10 border border-glass-border/30 rounded-xl flex items-center justify-between text-text-secondary text-[11px]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent-blue" />
                <span>
                  Primera cuota: <strong className="text-text-primary">{dayjs(startDate).format('DD/MM/YYYY')}</strong>
                </span>
              </div>
              <div>
                <span>
                  Día de cobro recurrente: <strong className="text-text-primary">Día {paymentDay} de cada mes</strong>
                </span>
              </div>
            </div>

            {/* NOTA DE AJUSTE OBLIGATORIA */}
            <div className="bg-glass-primary/30 border border-glass-border/40 rounded-xl p-3 space-y-1.5">
              <label className="block text-[11px] font-semibold text-text-primary">
                Nota de Ajuste <span className="text-red-400">* (Obligatorio)</span>
              </label>
              <p className="text-[10px] text-text-secondary">
                Indica el motivo o justificación de esta estructuración de contrato para el historial y control de auditoría.
              </p>
              <textarea
                rows={2}
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="Ej: Reestructuración general acordada con cliente / nuevo plan de financiación inicial..."
                className="w-full text-xs px-3 py-2 rounded-lg bg-glass-primary/50 border border-glass-border focus:border-accent-blue focus:outline-none text-text-primary placeholder:text-text-muted resize-none"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-glass-border/40">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Ajustar Detalles
              </Button>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleGenerate()}
                  loading={isLoading}
                  disabled={!isBalanced}
                  className="bg-accent-blue text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Confirmar y Guardar Plan de Financiación
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
