'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BadgeDollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { usePermissions } from '@/hooks/usePermissions'
import { PERMISSIONS } from '@/lib/permissions'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'

interface Installment {
  milestoneKey: string
  quotaNumber?: number
  amount: number
  status: string
  billingNumber?: number
  approvedBy?: string
  approvedAt?: string
  paidBy?: string
  paidAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectedReason?: string
}

interface Commission {
  _id: string
  totalAmount: number
  initialQuotaPercentage?: number
  installments: Installment[]
  contractId: {
    client?: { name: string; idNumber: string }
    lot?: { nomenclature?: string; stage?: string; manzana?: string; lotNumber?: string }
  }
  sellerId?: {
    accountId?: { fullName: string; email?: string }
  }
  createdAt: string
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  AVAILABLE: 'Disponible',
  FILED: 'Radicada',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  REJECTED: 'Rechazada'
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-glass-primary/20 text-text-muted',
  AVAILABLE: 'bg-accent-yellow/15 text-accent-yellow',
  FILED: 'bg-accent-blue/15 text-accent-blue',
  APPROVED: 'bg-accent-purple/15 text-accent-purple',
  PAID: 'bg-accent-green/15 text-accent-green',
  REJECTED: 'bg-accent-red/15 text-accent-red'
}

export default function CommissionsPage() {
  const { can } = usePermissions()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionTarget, setActionTarget] = useState<{ commission: Commission, installmentIndex: number, action: 'aprobar' | 'rechazar' | 'pagar' } | null>(null)
  const [observation, setObservation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCommissions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await adminApi.getCommissions()
      if (response.data.success) {
        setCommissions(response.data.data.commissions || [])
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
      toast.error('Error al cargar las comisiones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCommissions()
  }, [fetchCommissions])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value)
  }

  const handleAction = async () => {
    if (!actionTarget) return
    const { commission, installmentIndex, action } = actionTarget

    if (action === 'rechazar' && !observation.trim()) {
      toast.error('La observación de rechazo es obligatoria')
      return
    }

    setSubmitting(true)
    try {
      if (action === 'aprobar') {
        await adminApi.aprobarComision(commission._id, installmentIndex, observation.trim() || undefined)
        toast.success('Cuenta de cobro aprobada')
      } else if (action === 'rechazar') {
        await adminApi.rechazarComision(commission._id, installmentIndex, observation.trim())
        toast.success('Cuenta de cobro rechazada')
      } else {
        await adminApi.pagarComision(commission._id, installmentIndex)
        toast.success('Comisión marcada como pagada')
      }
      setActionTarget(null)
      setObservation('')
      fetchCommissions()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al procesar la cuenta de cobro')
    } finally {
      setSubmitting(false)
    }
  }

  const openAction = (commission: Commission, installmentIndex: number, action: 'aprobar' | 'rechazar' | 'pagar') => {
    setObservation('')
    setActionTarget({ commission, installmentIndex, action })
  }

  const lotLabel = (c: Commission) => {
    const lot = c.contractId?.lot
    if (!lot) return 'Sin lote'
    return lot.nomenclature
      ? `${lot.nomenclature} - E: ${lot.stage || '-'} Mz: ${lot.manzana || '-'} L: ${lot.lotNumber || '-'}`
      : `Lote ${lot.lotNumber || '-'}`
  }

  const pendingCount = commissions.reduce((acc, c) => {
    return acc + (c.installments || []).filter((i) => i.status === 'FILED').length
  }, 0)

  return (
    <div className="space-y-6 md:space-y-8 px-1 py-2 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-text-primary mb-2">
            Módulo de <span className="gradient-text">Comisiones</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Cuentas de cobro radicadas por los asesores: aprobar, rechazar o marcar como pagadas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="glass" size="sm" onClick={fetchCommissions} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Pending summary */}
      <Card variant="interactive" className="stats-card stats-blue">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">Cuentas de cobro por revisar</p>
            <p className="text-3xl font-bold text-text-primary">{pendingCount}</p>
          </div>
          <div className="glass-card p-3 border-accent-blue/20">
            <BadgeDollarSign className="w-6 h-6 text-accent-blue" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl">
          <BadgeDollarSign className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-20" />
          <p className="text-text-secondary">No hay comisiones registradas</p>
          <p className="text-xs text-text-muted mt-1">Las comisiones se generan automáticamente al vender un lote con un plan activo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {commissions.map((c) => (
            <Card key={c._id} className="glass-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-5 border-b border-glass-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-text-primary text-base">
                      {c.contractId?.client?.name || 'Cliente'} 
                      <span className="text-xs text-text-muted font-normal ml-2">
                        {c.contractId?.client?.idNumber || ''}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {lotLabel(c)} · Asesor: {c.sellerId?.accountId?.fullName || 'N/A'}
                      {c.initialQuotaPercentage ? ` · CI ${c.initialQuotaPercentage}%` : ''}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-text-secondary">Comisión Total</p>
                    <p className="text-lg font-black text-text-primary">{formatCurrency(c.totalAmount)}</p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {(c.installments || []).map((i, idx) => {
                    const milestoneLabel = i.milestoneKey === 'QUOTA_NUMBER'
                      ? `Cuota #${i.quotaNumber}`
                      : 'Cuota inicial'
                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-glass-border/50 bg-glass-primary/10">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/5 border border-glass-border text-text-secondary">
                            {milestoneLabel}
                          </span>
                          <span className="font-black text-text-primary">{formatCurrency(i.amount)}</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[i.status] || STATUS_COLOR.PENDING}`}>
                            {STATUS_LABEL[i.status] || i.status}
                          </span>
                          {i.billingNumber && (
                            <span className="text-xs text-text-muted">Radicado #{i.billingNumber}</span>
                          )}
                          {i.status === 'REJECTED' && i.rejectedReason && (
                            <span className="text-xs text-accent-red italic">Motivo: {i.rejectedReason}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {i.status === 'FILED' && can(PERMISSIONS.COMISIONES_APPROVE) && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => openAction(c, idx, 'aprobar')}
                                className="flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Aprobar
                              </Button>
                              {can(PERMISSIONS.COMISIONES_REJECT) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAction(c, idx, 'rechazar')}
                                  className="flex items-center gap-1.5 text-accent-red border-accent-red/30"
                                >
                                  <XCircle className="w-4 h-4" /> Rechazar
                                </Button>
                              )}
                            </>
                          )}
                          {i.status === 'APPROVED' && can(PERMISSIONS.COMISIONES_PAY) && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => openAction(c, idx, 'pagar')}
                              className="flex items-center gap-1.5"
                            >
                              <Wallet className="w-4 h-4" /> Marcar como pagada
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={
          actionTarget?.action === 'aprobar' ? 'Aprobar cuenta de cobro'
          : actionTarget?.action === 'rechazar' ? 'Rechazar cuenta de cobro'
          : 'Marcar comisión como pagada'
        }
      >
        <div className="space-y-4 p-4 md:p-6">
          {actionTarget && (
            <div className="text-sm text-text-secondary">
              <p>
                {actionTarget.action === 'pagar' ? 'Comisión por' : 'Cuenta de cobro por'}{' '}
                <strong className="text-text-primary">
                  {formatCurrency(actionTarget.commission.installments[actionTarget.installmentIndex]?.amount || 0)}
                </strong>{' '}
                — {actionTarget.commission.contractId?.client?.name || 'Cliente'} · Asesor:{' '}
                {actionTarget.commission.sellerId?.accountId?.fullName || 'N/A'}
              </p>
            </div>
          )}

          {actionTarget?.action === 'rechazar' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Observación de rechazo *
              </label>
              <textarea
                className="glass-input w-full p-3 h-24"
                placeholder="Explica el motivo del rechazo (se notifica al asesor)..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          )}

          {actionTarget?.action === 'aprobar' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Observación (opcional)
              </label>
              <textarea
                className="glass-input w-full p-3 h-24"
                placeholder="Nota interna de aprobación..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionTarget(null)}
              className="glass-button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAction}
              disabled={submitting}
              className={`glass-button ${
                actionTarget?.action === 'rechazar'
                  ? 'bg-accent-red/20 text-accent-red border-accent-red/30'
                  : 'bg-accent-green/20 text-accent-green border-accent-green/30'
              }`}
            >
              {submitting ? 'Procesando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
