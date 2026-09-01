'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AlertTriangle, CheckCircle, Calculator, Info, RefreshCw } from 'lucide-react'
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

  // Reset when opening
  useEffect(() => {
    if (isOpen && quotas.length > 0) {
      const firstPending = quotas.find(q => q.type === 'normal' && q.status !== 'pagado')
      if (firstPending) {
        setSelectedQuotaNumber(firstPending.number)
        setNewValueInput(String(firstPending.value || 0))
        setNewDueDateInput(dayjs(firstPending.dueDate).format('YYYY-MM-DD'))
      }
      setStep(1)
      setSimulationData(null)
    }
  }, [isOpen, quotas])

  // Run simulation call
  const handleSimulate = async () => {
    if (!selectedQuotaNumber) {
      toast.error('Selecciona una cuota para modificar')
      return
    }

    setIsSimulating(true)
    try {
      const changes = [
        {
          targetNumber: selectedQuotaNumber,
          newValue: Number(newValueInput),
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

    setIsApplying(true)
    try {
      const res = await adminApi.applyPaymentSchedule({
        contractId,
        updatedQuotas: simulationData.simulatedQuotas
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

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reestructuración de Plan de Pagos ${clientName ? `- ${clientName}` : ''}`}
      size="xl"
    >
      <div className="space-y-4 text-xs">

        {/* STEP HEADER */}
        <div className="flex items-center justify-between border-b border-glass-border/40 pb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${step === 1 ? 'bg-accent-blue text-white' : 'bg-glass-primary text-text-secondary'}`}>
              1. Seleccionar & Simular
            </span>
            <span className="text-text-muted">→</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${step === 2 ? 'bg-accent-blue text-white' : 'bg-glass-primary text-text-secondary'}`}>
              2. Revisión Previa & Confirmar
            </span>
          </div>

          <div className="text-right">
            <span className="text-text-secondary">Valor Total Contrato:</span>
            <span className="ml-2 font-bold text-text-primary text-sm">{formatMoney(totalValue)}</span>
          </div>
        </div>

        {/* STEP 1: SELECT & CONFIGURE */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div>
                <label className="block text-text-secondary font-medium mb-1">Cuota a Modificar</label>
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
                  className="w-full bg-glass-primary/30 border border-glass-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent-blue"
                >
                  {quotas.filter(q => q.type === 'normal').map((q) => (
                    <option key={q._id || q.number} value={q.number}>
                      Cuota #{q.number} - Current: {formatMoney(q.value)} ({q.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Nuevo Valor Pactado</label>
                <Input
                  type="number"
                  value={newValueInput}
                  onChange={(e) => setNewValueInput(e.target.value)}
                  placeholder="Ej: 1500000"
                />
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">Nueva Fecha Vencimiento</label>
                <Input
                  type="date"
                  value={newDueDateInput}
                  onChange={(e) => setNewDueDateInput(e.target.value)}
                />
              </div>

            </div>

            <div className="bg-glass-primary/20 border border-glass-border/30 rounded-lg p-3 space-y-2.5">
              <div>
                <label className="block font-semibold text-text-primary text-xs">
                  ¿Cómo deseas compensar la diferencia de saldo?
                </label>
                <p className="text-[11px] text-text-muted">
                  Al cambiar el valor de esta cuota, el valor total del contrato se mantiene balanceado ajustando las cuotas restantes:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${strategy === 'REPARTIR_PENDIENTES' ? 'bg-accent-blue/10 border-accent-blue/70 shadow-sm' : 'border-glass-border/40 hover:bg-glass-primary/10'}`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'REPARTIR_PENDIENTES'}
                    onChange={() => setStrategy('REPARTIR_PENDIENTES')}
                    className="mt-0.5 mr-2.5 accent-accent-blue"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-text-primary text-xs block">Distribuir en cuotas pendientes</span>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Divide la diferencia en partes iguales entre todas las cuotas futuras por pagar (todas suben o bajan equitativamente).
                    </p>
                  </div>
                </label>

                <label className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${strategy === 'AJUSTAR_ULTIMAS' ? 'bg-accent-blue/10 border-accent-blue/70 shadow-sm' : 'border-glass-border/40 hover:bg-glass-primary/10'}`}>
                  <input
                    type="radio"
                    name="strategy"
                    checked={strategy === 'AJUSTAR_ULTIMAS'}
                    onChange={() => setStrategy('AJUSTAR_ULTIMAS')}
                    className="mt-0.5 mr-2.5 accent-accent-blue"
                  />
                  <div className="space-y-0.5">
                    <span className="font-semibold text-text-primary text-xs block">Ajustar en las cuotas finales</span>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Aplica la diferencia a la última cuota (o las últimas), manteniendo intactas las demás cuotas intermedias.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSimulate} loading={isSimulating}>
                <Calculator className="w-4 h-4 mr-1.5" />
                Calcular Proyección
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW SIMULATION & CONFIRM */}
        {step === 2 && simulationData && (
          <div className="space-y-4 animate-fade-in-up">

            {/* BALANCE BAR */}
            <div className={`p-3 rounded-lg border flex items-center justify-between ${
              simulationData.isBalanced 
                ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' 
                : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
            }`}>
              <div className="flex items-center space-x-2">
                {simulationData.isBalanced ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <div>
                  <span className="font-bold text-sm block">
                    {simulationData.isBalanced ? ' Plan Balanceado Correctamente (100%)' : ' Descuadre Detectado en la Proyección'}
                  </span>
                  <span className="text-xs opacity-90">
                    Suma Proyectada: {formatMoney(simulationData.grandTotalAllocated)} | Esperado: {formatMoney(simulationData.totalValue)}
                  </span>
                </div>
              </div>
              {!simulationData.isBalanced && (
                <span className="font-bold text-xs bg-accent-red/20 px-2 py-1 rounded">
                  Diferencia: {formatMoney(simulationData.difference)}
                </span>
              )}
            </div>

            {/* WARNINGS */}
            {simulationData.warnings && simulationData.warnings.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 space-y-1">
                <div className="flex items-center font-bold">
                  <Info className="w-4 h-4 mr-1" /> Advertencias del Asistente:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {simulationData.warnings.map((w: string, idx: number) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* PROJECTION TABLE */}
            <div className="space-y-1">
              <h5 className="font-semibold text-text-primary text-xs uppercase tracking-wider">Vista Previa del Nuevo Plan de Pagos</h5>
              <div className="max-h-[220px] overflow-y-auto border border-glass-border/40 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-glass-primary/80 sticky top-0 border-b border-glass-border/40">
                    <tr className="text-text-secondary">
                      <th className="py-2 px-3">Cuota</th>
                      <th className="py-2 px-3">Vencimiento</th>
                      <th className="py-2 px-3">Nuevo Valor</th>
                      <th className="py-2 px-3">Abonado</th>
                      <th className="py-2 px-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationData.simulatedQuotas.map((sq: any, idx: number) => {
                      const isModifiedTarget = sq.number === selectedQuotaNumber;
                      return (
                        <tr key={`${sq.type || 'q'}-${sq.number}-${idx}`} className={`border-b border-glass-border/20 ${isModifiedTarget ? 'bg-accent-blue/15 font-semibold' : 'hover:bg-glass-primary/10'}`}>
                          <td className="py-1.5 px-3">#{sq.number} ({sq.type}) {isModifiedTarget ? '✏️ Modificada' : ''}</td>
                          <td className="py-1.5 px-3">{dayjs(sq.dueDate).format('DD/MM/YYYY')}</td>
                          <td className="py-1.5 px-3 font-bold text-text-primary">{formatMoney(sq.value)}</td>
                          <td className="py-1.5 px-3 text-text-secondary">{formatMoney(sq.amountPaid)}</td>
                          <td className="py-1.5 px-3 text-right uppercase text-[10px]">
                            <span className={`px-2 py-0.5 rounded ${sq.status === 'pagado' ? 'bg-green-500/20 text-green-600' : 'bg-gray-500/20 text-gray-400'}`}>
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

            <div className="flex justify-between items-center pt-2 border-t border-glass-border/40">
              <Button variant="outline" onClick={() => setStep(1)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Volver a Editar
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button 
                  onClick={handleApply} 
                  loading={isApplying} 
                  disabled={!simulationData.isBalanced}
                >
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
