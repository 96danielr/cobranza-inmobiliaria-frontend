'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  Info, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  TrendingDown, 
  TrendingUp, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface EditPlanPagosModalProps {
  isOpen: boolean
  onClose: () => void
  contractId: string
  clientName?: string
  totalValue?: number
  quotas: any[]
  onSuccess?: () => void
}

export function EditPlanPagosModal({
  isOpen,
  onClose,
  contractId,
  clientName,
  totalValue = 0,
  quotas = [],
  onSuccess
}: EditPlanPagosModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedQuotaNumber, setSelectedQuotaNumber] = useState<number | null>(null)
  const [newValueInput, setNewValueInput] = useState<string>('')
  const [newDueDateInput, setNewDueDateInput] = useState<string>('')
  const [strategy, setStrategy] = useState<'REPARTIR_PENDIENTES' | 'AJUSTAR_ULTIMAS' | 'NINGUNA'>('REPARTIR_PENDIENTES')
  
  const [isSimulating, setIsSimulating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [simulationData, setSimulationData] = useState<any>(null)
  const [adjustmentNote, setAdjustmentNote] = useState<string>('')

  // Reset when opening
  useEffect(() => {
    if (isOpen && quotas.length > 0) {
      const firstPending = quotas.find(q => q.type === 'normal' && q.status !== 'pagado')
      if (firstPending) {
        setSelectedQuotaNumber(firstPending.number)
        setNewValueInput(String(firstPending.value || 0))
        setNewDueDateInput(dayjs(firstPending.dueDate).format('YYYY-MM-DD'))
      }
      setStrategy('REPARTIR_PENDIENTES')
      setStep(1)
      setSimulationData(null)
      setAdjustmentNote('')
    }
  }, [isOpen, quotas])

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
  }

  const selectedQuota = quotas.find(q => q.number === selectedQuotaNumber)
  const originalValue = selectedQuota ? Number(selectedQuota.value || 0) : 0
  const parsedNewValue = Number(newValueInput) || 0
  const differenceOnTarget = parsedNewValue - originalValue
  const pendingQuotasCount = quotas.filter(q => q.type === 'normal' && q.status !== 'pagado' && q.number !== selectedQuotaNumber).length

  // Estimar impacto por cuota si se usa repartición equitativa
  const estimatedImpactPerQuota = pendingQuotasCount > 0 ? Math.round(Math.abs(differenceOnTarget) / pendingQuotasCount) : 0

  // Run simulation call
  const handleSimulate = async () => {
    if (!selectedQuotaNumber) {
      toast.error('Selecciona una cuota para modificar')
      return
    }

    if (parsedNewValue < 0) {
      toast.error('El valor de la cuota no puede ser negativo')
      return
    }

    setIsSimulating(true)
    try {
      const changes = [
        {
          targetNumber: selectedQuotaNumber,
          newValue: parsedNewValue,
          newDueDate: newDueDateInput
        }
      ]

      const res = await adminApi.simulatePaymentSchedule({
        contractId,
        changes,
        strategy
      })

      if (res.data.success) {
        setSimulationData(res.data.data)
        setStep(2)
      } else {
        toast.error(res.data.message || 'Error al calcular la simulación')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || err.message || 'Error en el servidor')
    } finally {
      setIsSimulating(false)
    }
  }

  const handleApply = async () => {
    if (!simulationData || !simulationData.simulatedQuotas) return

    if (!simulationData.isBalanced) {
      toast.error('El plan no está balanceado. Ajusta los valores hasta cuadrar al 100%.')
      return
    }

    if (!adjustmentNote || !adjustmentNote.trim()) {
      toast.error('La NOTA DE AJUSTE es obligatoria. Explica el motivo de la reestructuración.')
      return
    }

    setIsApplying(true)
    try {
      const res = await adminApi.applyPaymentSchedule({
        contractId,
        updatedQuotas: simulationData.simulatedQuotas,
        reason: adjustmentNote.trim()
      })

      if (res.data.success) {
        toast.success('¡Plan de pagos reestructurado exitosamente!')
        if (onSuccess) onSuccess()
        onClose()
      } else {
        toast.error(res.data.message || 'Error al guardar los cambios')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || err.message || 'Error en la petición')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reestructuración Inteligente de Cuotas"
      size="xl"
    >
      <div className="space-y-4 text-xs">

        {/* CONTEXT BANNER */}
        <div className="bg-gradient-to-r from-accent-blue/10 via-accent-purple/10 to-transparent p-3 rounded-xl border border-accent-blue/20 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-text-secondary text-[11px] block font-medium">Contrato de:</span>
            <span className="text-text-primary font-bold text-sm">
              {clientName || 'Cliente'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-text-secondary text-[11px] block font-medium">Valor Total Contrato:</span>
            <span className="text-accent-blue font-extrabold text-sm">{formatMoney(totalValue)}</span>
          </div>
        </div>

        {/* STEPPER HEADER */}
        <div className="grid grid-cols-2 gap-2 border-b border-glass-border/40 pb-3">
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
            <div className="leading-tight">
              <span className="block text-[11px] font-semibold">Paso 1: Configurar Cambio</span>
              <span className="text-[10px] text-text-muted">Elige la cuota y cómo compensar</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (simulationData) setStep(2)
            }}
            disabled={!simulationData}
            className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
              step === 2 
                ? 'bg-accent-blue/15 border border-accent-blue/40 text-accent-blue font-bold shadow-sm' 
                : 'hover:bg-glass-primary/20 text-text-secondary disabled:opacity-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              step === 2 ? 'bg-accent-blue text-white' : 'bg-glass-primary text-text-muted'
            }`}>
              2
            </div>
            <div className="leading-tight">
              <span className="block text-[11px] font-semibold">Paso 2: Vista Previa & Confirmación</span>
              <span className="text-[10px] text-text-muted">Revisión antes vs después</span>
            </div>
          </button>
        </div>

        {/* STEP 1: CONFIGURE CHANGE */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-accent-blue/5 border border-accent-blue/20 rounded-lg flex items-start gap-2 text-text-secondary">
              <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Usa esta herramienta cuando un cliente necesite cambiar el monto o la fecha de una cuota puntual. El sistema recalcula las cuotas restantes de forma automática para que el valor del contrato se mantenga 100% exacto.
              </p>
            </div>

            {/* SELECCIÓN Y EDICIÓN DE CUOTA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-glass-primary/20 border border-glass-border/40 rounded-xl">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  1. Cuota que deseas modificar
                </label>
                <select
                  value={selectedQuotaNumber || ''}
                  onChange={(e) => {
                    const num = Number(e.target.value)
                    setSelectedQuotaNumber(num)
                    const found = quotas.find(q => q.number === num)
                    if (found) {
                      setNewValueInput(String(found.value || 0))
                      setNewDueDateInput(dayjs(found.dueDate).format('YYYY-MM-DD'))
                    }
                  }}
                  className="w-full bg-glass-primary/50 border border-glass-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-blue font-medium"
                >
                  {quotas.filter(q => q.type === 'normal').map((q) => (
                    <option key={q._id || q.number} value={q.number}>
                      Cuota #{q.number} ({formatMoney(q.value)}) - {q.status.toUpperCase()}
                    </option>
                  ))}
                </select>
                {selectedQuota && (
                  <span className="text-[10px] text-text-muted mt-1 block">
                    Vencimiento actual: {dayjs(selectedQuota.dueDate).format('DD/MM/YYYY')}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  2. Nuevo valor acordado ($ COP)
                </label>
                <Input
                  type="number"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  placeholder="Ej: 500000"
                  className="font-bold text-sm"
                />
                <span className="text-[10px] text-text-muted mt-1 block">
                  Valor anterior: {formatMoney(originalValue)}
                </span>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  3. Nueva fecha de vencimiento
                </label>
                <Input
                  type="date"
                  value={newDueDateInput}
                  onChange={(e) => setNewDueDateInput(e.target.value)}
                />
                <span className="text-[10px] text-text-muted mt-1 block">
                  Fecha pactada para el pago de esta cuota
                </span>
              </div>
            </div>

            {/* IMPACT NOTIFIER CARD */}
            {differenceOnTarget !== 0 && (
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                differenceOnTarget < 0 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                  : 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue'
              }`}>
                <div className="flex items-center gap-2.5">
                  {differenceOnTarget < 0 ? (
                    <TrendingDown className="w-5 h-5 shrink-0 text-amber-500" />
                  ) : (
                    <TrendingUp className="w-5 h-5 shrink-0 text-accent-blue" />
                  )}
                  <div>
                    <span className="font-bold text-xs block">
                      {differenceOnTarget < 0 
                        ? `Estás reduciendo esta cuota en ${formatMoney(Math.abs(differenceOnTarget))}`
                        : `Estás aumentando esta cuota en ${formatMoney(differenceOnTarget)}`
                      }
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {differenceOnTarget < 0 
                        ? 'Este saldo restante debe compensarse en las otras cuotas para que el contrato no pierda valor.'
                        : 'El excedente amortizará y reducirá el valor de las otras cuotas pendientes.'
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STRATEGY SELECTION CARDS */}
            <div className="space-y-2">
              <label className="block font-semibold text-text-primary text-xs">
                ¿Cómo prefieres compensar la diferencia de saldo?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción 1: Repartir */}
                <div 
                  onClick={() => setStrategy('REPARTIR_PENDIENTES')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    strategy === 'REPARTIR_PENDIENTES' 
                      ? 'bg-accent-blue/15 border-accent-blue shadow-md ring-1 ring-accent-blue' 
                      : 'bg-glass-primary/20 border-glass-border/40 hover:bg-glass-primary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-accent-blue" /> Distribuir entre todas las pendientes
                      </span>
                      <span className="text-[10px] bg-accent-blue/20 text-accent-blue font-bold px-2 py-0.5 rounded-full">
                        Recomendada
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Divide la diferencia en partes iguales entre las {pendingQuotasCount} cuotas restantes.
                    </p>
                  </div>

                  {differenceOnTarget !== 0 && pendingQuotasCount > 0 && (
                    <div className="mt-3 pt-2 border-t border-glass-border/30 text-[11px] text-accent-blue font-semibold">
                      Impacto aprox: {differenceOnTarget < 0 ? '+' : '-'}{formatMoney(estimatedImpactPerQuota)} / cuota
                    </div>
                  )}
                </div>

                {/* Opción 2: Ajustar últimas */}
                <div 
                  onClick={() => setStrategy('AJUSTAR_ULTIMAS')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    strategy === 'AJUSTAR_ULTIMAS' 
                      ? 'bg-accent-blue/15 border-accent-blue shadow-md ring-1 ring-accent-blue' 
                      : 'bg-glass-primary/20 border-glass-border/40 hover:bg-glass-primary/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-accent-yellow" /> Recargar al final del plan
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Mantiene todas las cuotas del cliente exactamente iguales y traslada la diferencia únicamente a la(s) última(s) cuota(s).
                    </p>
                  </div>

                  {differenceOnTarget !== 0 && (
                    <div className="mt-3 pt-2 border-t border-glass-border/30 text-[11px] text-text-secondary">
                      Tus siguientes cuotas se mantienen sin ningún incremento.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-glass-border/40">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSimulate} loading={isSimulating} className="bg-accent-blue text-white">
                <Calculator className="w-4 h-4 mr-1.5" />
                Simular y Ver Impacto <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & CONFIRM */}
        {step === 2 && simulationData && (
          <div className="space-y-4 animate-fade-in">

            {/* BALANCE STATUS BAR */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              simulationData.isBalanced 
                ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' 
                : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
            }`}>
              <div className="flex items-center space-x-2.5">
                {simulationData.isBalanced ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                <div>
                  <span className="font-bold text-xs block">
                    {simulationData.isBalanced ? '✓ Plan Equilibrado Correctamente (100% Cuadrado)' : '⚠ Descuadre Detectado en la Proyección'}
                  </span>
                  <span className="text-[11px] opacity-90 text-text-secondary">
                    Total Proyectado: <strong className="text-text-primary">{formatMoney(simulationData.grandTotalAllocated)}</strong> | Esperado: <strong className="text-text-primary">{formatMoney(simulationData.totalValue)}</strong>
                  </span>
                </div>
              </div>
              {!simulationData.isBalanced && (
                <span className="font-bold text-xs bg-accent-red/20 px-2.5 py-1 rounded text-accent-red">
                  Diferencia: {formatMoney(simulationData.difference)}
                </span>
              )}
            </div>

            {/* ADVERTENCIAS */}
            {simulationData.warnings && simulationData.warnings.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 space-y-1">
                <div className="flex items-center font-bold text-xs">
                  <Info className="w-4 h-4 mr-1.5" /> Observaciones del Asistente:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {simulationData.warnings.map((w: string, idx: number) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* COMPARISON TABLE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-text-primary text-xs uppercase tracking-wider">
                  Comparativa: Plan Actual vs. Plan Reestructurado
                </h5>
                <span className="text-[11px] text-text-muted">
                  Las cuotas modificadas están resaltadas en azul
                </span>
              </div>

              <div className="max-h-[240px] overflow-y-auto border border-glass-border/40 rounded-xl bg-glass-primary/10">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-glass-primary/90 backdrop-blur-sm sticky top-0 border-b border-glass-border/40">
                    <tr className="text-text-secondary font-medium">
                      <th className="py-2.5 px-3">Cuota</th>
                      <th className="py-2.5 px-3">Vencimiento</th>
                      <th className="py-2.5 px-3">Valor Anterior</th>
                      <th className="py-2.5 px-3">Nuevo Valor</th>
                      <th className="py-2.5 px-3">Variación</th>
                      <th className="py-2.5 px-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationData.simulatedQuotas.map((sq: any, idx: number) => {
                      const isModifiedTarget = sq.number === selectedQuotaNumber
                      const originalQuota = quotas.find(q => q.number === sq.number)
                      const origVal = originalQuota ? Number(originalQuota.value || 0) : sq.value
                      const valDiff = Number(sq.value || 0) - origVal
                      const hasChanged = Math.abs(valDiff) > 1 || isModifiedTarget

                      return (
                        <tr 
                          key={`${sq.type || 'q'}-${sq.number}-${idx}`} 
                          className={`border-b border-glass-border/20 transition-colors ${
                            isModifiedTarget 
                              ? 'bg-accent-blue/15 font-semibold' 
                              : hasChanged 
                                ? 'bg-accent-blue/5' 
                                : 'hover:bg-glass-primary/20'
                          }`}
                        >
                          <td className="py-2 px-3">
                            <span className="font-medium">#{sq.number}</span>
                            <span className="text-[10px] text-text-muted ml-1">({sq.type})</span>
                            {isModifiedTarget && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent-blue text-white text-[9px] font-bold">
                                Editada
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">{dayjs(sq.dueDate).format('DD/MM/YYYY')}</td>
                          <td className="py-2 px-3 text-text-secondary">{formatMoney(origVal)}</td>
                          <td className="py-2 px-3 font-bold text-text-primary">{formatMoney(sq.value)}</td>
                          <td className="py-2 px-3 text-[11px]">
                            {valDiff > 1 && (
                              <span className="text-accent-blue font-semibold">+{formatMoney(valDiff)}</span>
                            )}
                            {valDiff < -1 && (
                              <span className="text-accent-green font-semibold">-{formatMoney(Math.abs(valDiff))}</span>
                            )}
                            {Math.abs(valDiff) <= 1 && (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right uppercase text-[10px]">
                            <span className={`px-2 py-0.5 rounded font-semibold ${
                              sq.status === 'pagado' 
                                ? 'bg-green-500/20 text-green-600' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {sq.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NOTA DE AJUSTE OBLIGATORIA */}
            <div className="bg-glass-primary/30 border border-glass-border/40 rounded-xl p-3 space-y-1.5">
              <label className="block text-[11px] font-semibold text-text-primary">
                Nota de Ajuste <span className="text-red-400">* (Obligatorio)</span>
              </label>
              <p className="text-[10px] text-text-secondary">
                Indica el motivo o justificación de este cambio en el sistema para control de auditoría.
              </p>
              <textarea
                rows={2}
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="Ej: Ajuste acordado con el cliente por solicitud de prórroga / cambio de fecha..."
                className="w-full text-xs px-3 py-2 rounded-lg bg-glass-primary/50 border border-glass-border focus:border-accent-blue focus:outline-none text-text-primary placeholder:text-text-muted resize-none"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-glass-border/40">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Editar Parámetros
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button 
                  onClick={handleApply} 
                  loading={isApplying} 
                  disabled={!simulationData.isBalanced}
                  className="bg-accent-blue text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Confirmar y Aplicar Reestructuración
                </Button>
              </div>
            </div>

          </div>
        )}

      </div>
    </Modal>
  )
}
