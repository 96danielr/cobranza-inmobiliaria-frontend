'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Calculator, CheckCircle, AlertTriangle, Sparkles, Calendar, DollarSign, Layers } from 'lucide-react'
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
  const [totalValue, setTotalValue] = useState<string>('')
  const [installmentsCount, setInstallmentsCount] = useState<string>('36')
  const [installmentValue, setInstallmentValue] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [paymentDay, setPaymentDay] = useState<number>(15)
  
  // Balloon / Extraordinary Payments
  const [hasBalloon, setHasBalloon] = useState<boolean>(false)
  const [balloonInterval, setBalloonInterval] = useState<string>('7')
  const [balloonValue, setBalloonValue] = useState<string>('')

  // Initial Quotas
  const [hasInitials, setHasInitials] = useState<boolean>(false)
  const [initialQuotasCount, setInitialQuotasCount] = useState<string>('1')
  const [initialQuotaValue, setInitialQuotaValue] = useState<string>('')

  const [preservePayments, setPreservePayments] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setTotalValue(currentTotalValue > 0 ? String(currentTotalValue) : '')
      setInstallmentsCount(currentInstallmentsCount > 0 ? String(currentInstallmentsCount) : '36')
      setInstallmentValue(currentInstallmentValue > 0 ? String(currentInstallmentValue) : '')
      setStartDate(dayjs().format('YYYY-MM-DD'))
      setPaymentDay(15)
      setHasBalloon(false)
      setBalloonInterval('7')
      setBalloonValue('')
      setHasInitials(false)
      setPreservePayments(true)
    }
  }, [isOpen, currentTotalValue, currentInstallmentsCount, currentInstallmentValue])

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
  }

  // Calculate projection preview
  const numInstallments = Number(installmentsCount) || 0
  const valInstallment = Number(installmentValue) || 0
  const numInitials = hasInitials ? (Number(initialQuotasCount) || 0) : 0
  const valInitial = hasInitials ? (Number(initialQuotaValue) || 0) : 0
  const numBalloons = (hasBalloon && Number(balloonInterval) > 0) ? Math.floor(numInstallments / Number(balloonInterval)) : 0
  const valBalloon = hasBalloon ? (Number(balloonValue) || 0) : 0

  const normalInstallmentsCount = numInstallments - numBalloons
  const projectedTotal = (numInitials * valInitial) + (normalInstallmentsCount * valInstallment) + (numBalloons * valBalloon)
  const expectedTotal = Number(totalValue) || 0
  const difference = projectedTotal - expectedTotal
  const isBalanced = expectedTotal > 0 && Math.abs(difference) < 1

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
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
        preserveExistingPayments: preservePayments
      })

      if (res.data.success) {
        toast.success('¡Plan de financiación generado exitosamente!')
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
      title={`Estructurar Plan de Financiación ${clientName ? `- ${clientName}` : ''}`}
      size="xl"
    >
      <form onSubmit={handleGenerate} className="space-y-4 text-xs">
        {lotInfo && (
          <div className="bg-glass-primary/30 p-3 rounded-lg border border-glass-border/40 flex items-center justify-between">
            <span className="text-text-secondary font-medium">Lote / Inmueble:</span>
            <span className="text-text-primary font-bold">{lotInfo}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-accent-blue" /> Valor Total Contrato ($ COP) *
            </label>
            <Input
              type="number"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="Ej: 36000000"
              required
              className="text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-accent-blue" /> N° Cuotas Financiación *
            </label>
            <Input
              type="number"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
              placeholder="Ej: 36, 48, 60"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-accent-blue" /> Valor Cuota Regular ($ COP) *
            </label>
            <Input
              type="number"
              value={installmentValue}
              onChange={(e) => setInstallmentValue(e.target.value)}
              placeholder="Ej: 600000 o 1000000"
              required
              className="text-sm font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-text-secondary font-medium mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent-blue" /> Fecha Inicio de Financiación
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1">Día de Pago del Mes</label>
            <select
              value={paymentDay}
              onChange={(e) => setPaymentDay(Number(e.target.value))}
              className="w-full bg-glass-primary/30 border border-glass-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent-blue"
            >
              {[1, 5, 10, 15, 20, 25, 28, 30].map(day => (
                <option key={day} value={day}>Día {day} de cada mes</option>
              ))}
            </select>
          </div>
        </div>

        {/* EXTRAORDINARY / BALLOON PAYMENTS SECTION */}
        <div className="p-3 bg-glass-primary/20 border border-glass-border/40 rounded-lg space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasBalloon}
              onChange={(e) => setHasBalloon(e.target.checked)}
              className="rounded border-glass-border text-accent-blue focus:ring-accent-blue"
            />
            <span className="font-semibold text-text-primary flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-yellow" /> Programar Cuotas Extraordinarias / Balón
            </span>
          </label>

          {hasBalloon && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-glass-border/30 animate-fade-in">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Periodicidad (Cada N Meses)</label>
                <select
                  value={balloonInterval}
                  onChange={(e) => setBalloonInterval(e.target.value)}
                  className="w-full bg-glass-primary/30 border border-glass-border rounded-md px-3 py-2 text-text-primary focus:outline-none"
                >
                  <option value="6">Cada 6 meses (Semestral)</option>
                  <option value="7">Cada 7 meses</option>
                  <option value="12">Cada 12 meses (Anual)</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Valor de la Cuota Extraordinaria ($ COP)</label>
                <Input
                  type="number"
                  value={balloonValue}
                  onChange={(e) => setBalloonValue(e.target.value)}
                  placeholder="Ej: 2000000"
                  required={hasBalloon}
                  className="font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* INITIAL QUOTAS SECTION */}
        <div className="p-3 bg-glass-primary/20 border border-glass-border/40 rounded-lg space-y-3">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasInitials}
              onChange={(e) => setHasInitials(e.target.checked)}
              className="rounded border-glass-border text-accent-blue focus:ring-accent-blue"
            />
            <span className="font-semibold text-text-primary">
              Incluir Cuota Inicial Fraccionada (Separación/Inicial)
            </span>
          </label>

          {hasInitials && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-glass-border/30 animate-fade-in">
              <div>
                <label className="block text-text-secondary font-medium mb-1">N° Cuotas Iniciales</label>
                <Input
                  type="number"
                  value={initialQuotasCount}
                  onChange={(e) => setInitialQuotasCount(e.target.value)}
                  placeholder="Ej: 1, 2, 3"
                  required={hasInitials}
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Valor Cuota Inicial ($ COP)</label>
                <Input
                  type="number"
                  value={initialQuotaValue}
                  onChange={(e) => setInitialQuotaValue(e.target.value)}
                  placeholder="Ej: 5000000"
                  required={hasInitials}
                  className="font-bold"
                />
              </div>
            </div>
          )}
        </div>

        {/* PRESERVE PAYMENTS OPTION */}
        <div className="flex items-center justify-between p-2.5 bg-glass-primary/10 rounded-lg border border-glass-border/30">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={preservePayments}
              onChange={(e) => setPreservePayments(e.target.checked)}
              className="rounded border-glass-border text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-text-secondary text-[11px]">
              Preservar pagos y abonos históricos ya realizados en este contrato (no sobreescribir cuotas pagadas)
            </span>
          </label>
        </div>

        {/* PROJECTION BALANCE STATUS */}
        <div className={`p-3 rounded-lg border flex items-center justify-between ${
          isBalanced 
            ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
        }`}>
          <div className="flex items-center space-x-2">
            {isBalanced ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <div>
              <span className="font-bold text-xs block">
                {isBalanced ? ' Plan Cuadrado al 100%' : ' Verificación de Suma de Cuotas'}
              </span>
              <span className="text-[11px] opacity-90">
                Suma Proyectada: {formatMoney(projectedTotal)} | Valor Total Contrato: {formatMoney(expectedTotal)}
              </span>
            </div>
          </div>
          {!isBalanced && expectedTotal > 0 && (
            <span className="font-bold text-[11px] bg-amber-500/20 px-2 py-1 rounded">
              Diferencia: {formatMoney(difference)}
            </span>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-glass-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            className="bg-accent-blue text-white"
          >
            <Calculator className="w-4 h-4 mr-1.5" />
            Generar y Guardar Plan de Financiación
          </Button>
        </div>
      </form>
    </Modal>
  )
}
