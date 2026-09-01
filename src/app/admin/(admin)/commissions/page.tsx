'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BadgeDollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  RefreshCw,
  Upload,
  FileText,
  ShieldCheck,
  Building,
  CreditCard,
  Eye,
  Stamp,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { usePermissions } from '@/hooks/usePermissions'
import { PERMISSIONS } from '@/lib/permissions'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'

interface FilingSeal {
  radNumber?: string
  stampedAt?: string
  sellerName?: string
  sellerDocument?: string
  amount?: number
  milestoneLabel?: string
  statusText?: string
}

interface Installment {
  milestoneKey: string
  quotaNumber?: number
  amount: number
  status: string
  billingNumber?: number
  attachmentUrl?: string
  invoiceUrl?: string
  socialSecurityUrl?: string
  rutUrl?: string
  bankCertUrl?: string
  stampedAt?: string
  filedAt?: string
  filingSeal?: FilingSeal
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
  AVAILABLE: 'Disponible para cobro',
  FILED: 'Radicada',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  REJECTED: 'Rechazada',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-glass-primary/20 text-text-muted',
  AVAILABLE: 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30',
  FILED: 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30',
  APPROVED: 'bg-accent-purple/15 text-accent-purple border border-accent-purple/30',
  PAID: 'bg-accent-green/15 text-accent-green border border-accent-green/30',
  REJECTED: 'bg-accent-red/15 text-accent-red border border-accent-red/30',
}

export default function CommissionsPage() {
  const { can } = usePermissions()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  
  // Action Modal (Aprobar / Rechazar / Pagar)
  const [actionTarget, setActionTarget] = useState<{ commission: Commission, installmentIndex: number, action: 'aprobar' | 'rechazar' | 'pagar' } | null>(null)
  const [observation, setObservation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Filing Modal (Radicación con 4 soportes)
  const [filingTarget, setFilingTarget] = useState<{ commission: Commission, installmentIndex: number } | null>(null)
  const [files, setFiles] = useState<{
    invoice: File | null
    socialSecurity: File | null
    rut: File | null
    bankCert: File | null
  }>({
    invoice: null,
    socialSecurity: null,
    rut: null,
    bankCert: null,
  })
  const [filingLoading, setFilingLoading] = useState(false)

  // View Details & Seal Modal
  const [viewDetailTarget, setViewDetailTarget] = useState<{ commission: Commission, installment: Installment } | null>(null)

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
      maximumFractionDigits: 0,
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

  const handleFilingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filingTarget) return

    const missing = [
      !files.invoice && 'la Cuenta de Cobro o Factura Electrónica',
      !files.socialSecurity && 'la Planilla de Seguridad Social',
      !files.rut && 'el RUT vigente',
      !files.bankCert && 'la Certificación Bancaria',
    ].filter(Boolean)

    if (missing.length > 0) {
      toast.error(`Los 4 soportes son obligatorios. Faltan: ${missing.join(', ')}`)
      return
    }

    setFilingLoading(true)
    try {
      const urls: { invoiceUrl?: string; socialSecurityUrl?: string; rutUrl?: string; bankCertUrl?: string } = {}

      if (files.invoice) {
        const res = await adminApi.uploadCommissionSupport(files.invoice, 'invoice')
        urls.invoiceUrl = res.data.data.url
      }
      if (files.socialSecurity) {
        const res = await adminApi.uploadCommissionSupport(files.socialSecurity, 'social_security')
        urls.socialSecurityUrl = res.data.data.url
      }
      if (files.rut) {
        const res = await adminApi.uploadCommissionSupport(files.rut, 'rut')
        urls.rutUrl = res.data.data.url
      }
      if (files.bankCert) {
        const res = await adminApi.uploadCommissionSupport(files.bankCert, 'bank_cert')
        urls.bankCertUrl = res.data.data.url
      }

      await adminApi.radicarComision(filingTarget.commission._id, filingTarget.installmentIndex, urls)
      toast.success('¡Cuenta de cobro radicada exitosamente con sello digital!')
      setFilingTarget(null)
      setFiles({ invoice: null, socialSecurity: null, rut: null, bankCert: null })
      fetchCommissions()
    } catch (error: any) {
      console.error('Error filing commission:', error)
      toast.error(error.response?.data?.message || 'Error al radicar los soportes')
    } finally {
      setFilingLoading(false)
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
            Radicación de cuentas de cobro con soportes, estampación de radicado y aprobación contable.
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
            <p className="text-sm text-text-secondary font-medium mb-1">Cuentas de cobro radicadas pendientes de revisión</p>
            <p className="text-3xl font-bold text-text-primary">{pendingCount}</p>
          </div>
          <div className="glass-card p-3 border-accent-blue/20">
            <BadgeDollarSign className="w-6 h-6 text-accent-blue" />
          </div>
        </CardContent>
      </Card>

      {/* Commissions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-glass-border">
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
                    const isInitialQuota = i.milestoneKey === 'INITIAL_QUOTA'
                    const milestoneButtonLabel = isInitialQuota
                      ? 'Cobrar comisión - Cuota Inicial'
                      : `Cobrar comisión - 6ta Cuota`
                    const milestoneBadgeLabel = isInitialQuota
                      ? 'Logro: Cuota Inicial'
                      : `Logro: Cuota #${i.quotaNumber || 6}`

                    return (
                      <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-glass-border/50 bg-glass-primary/10">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-glass-border text-text-secondary">
                            {milestoneBadgeLabel}
                          </span>
                          <span className="font-black text-text-primary text-base">{formatCurrency(i.amount)}</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[i.status] || STATUS_COLOR.PENDING}`}>
                            {STATUS_LABEL[i.status] || i.status}
                          </span>
                          {i.billingNumber && (
                            <span className="text-xs font-mono font-bold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded border border-accent-blue/20">
                              #RAD-{String(i.billingNumber).padStart(4, '0')}
                            </span>
                          )}
                          {i.status === 'REJECTED' && i.rejectedReason && (
                            <span className="text-xs text-accent-red italic">Motivo de rechazo: {i.rejectedReason}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {(i.status === 'AVAILABLE' || i.status === 'REJECTED') && can(PERMISSIONS.COMISIONES_RADICAR) && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setFiles({ invoice: null, socialSecurity: null, rut: null, bankCert: null })
                                setFilingTarget({ commission: c, installmentIndex: idx })
                              }}
                              className="flex items-center gap-1.5 font-bold shadow-lg shadow-accent-blue/20 bg-accent-blue hover:bg-accent-blue/90"
                            >
                              <Upload className="w-4 h-4" /> {milestoneButtonLabel}
                            </Button>
                          )}
                          {(i.status === 'FILED' || i.status === 'APPROVED' || i.status === 'PAID') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewDetailTarget({ commission: c, installment: i })}
                              className="flex items-center gap-1.5 text-xs text-text-primary border-glass-border hover:bg-white/5"
                            >
                              <Eye className="w-3.5 h-3.5 text-accent-blue" /> Ver Soportes y Sello
                            </Button>
                          )}
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
                              className="flex items-center gap-1.5 bg-accent-green hover:bg-accent-green/90"
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

      {/* Modal: Radicar Cuenta de Cobro (Carga de 4 soportes) */}
      <Modal
        isOpen={!!filingTarget}
        onClose={() => setFilingTarget(null)}
        title="Radicación de Cuenta de Cobro"
      >
        {filingTarget && (
          <form onSubmit={handleFilingSubmit} className="space-y-5 p-4 md:p-6">
            <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-xl text-xs text-text-secondary space-y-1">
              <p>
                <strong>Cliente:</strong> {filingTarget.commission.contractId?.client?.name}
              </p>
              <p>
                <strong>Logro:</strong> {filingTarget.commission.installments[filingTarget.installmentIndex]?.milestoneKey === 'INITIAL_QUOTA' ? 'Cuota Inicial' : 'Sexta Cuota'}
              </p>
              <p>
                <strong>Monto a Radicar:</strong>{' '}
                <span className="font-bold text-accent-blue text-sm">
                  {formatCurrency(filingTarget.commission.installments[filingTarget.installmentIndex]?.amount || 0)}
                </span>
              </p>
            </div>

            <p className="text-xs text-text-secondary font-medium">
              Por favor adjunta los 4 documentos requeridos por el departamento contable:
            </p>

            <div className="space-y-4">
              <div className="p-3 border border-glass-border rounded-xl bg-white/2">
                <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-accent-blue" />
                  1. Cuenta de Cobro o Factura Electrónica *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFiles((prev) => ({ ...prev, invoice: e.target.files?.[0] || null }))}
                  className="glass-input text-xs w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-accent-blue/20 file:text-accent-blue cursor-pointer"
                />
              </div>
              <div className="p-3 border border-glass-border rounded-xl bg-white/2">
                <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-accent-green" />
                  2. Planilla de Seguridad Social (Mes en curso) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setFiles((prev) => ({ ...prev, socialSecurity: e.target.files?.[0] || null }))}
                  className="glass-input text-xs w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-accent-green/20 file:text-accent-green cursor-pointer"
                />
              </div>
              <div className="p-3 border border-glass-border rounded-xl bg-white/2">
                <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-accent-yellow" />
                  3. RUT con fecha de generación actual *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setFiles((prev) => ({ ...prev, rut: e.target.files?.[0] || null }))}
                  className="glass-input text-xs w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-accent-yellow/20 file:text-accent-yellow cursor-pointer"
                />
              </div>
              <div className="p-3 border border-glass-border rounded-xl bg-white/2">
                <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-accent-purple" />
                  4. Certificación Bancaria *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setFiles((prev) => ({ ...prev, bankCert: e.target.files?.[0] || null }))}
                  className="glass-input text-xs w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-accent-purple/20 file:text-accent-purple cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilingTarget(null)}
                disabled={filingLoading}
                className="glass-button text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={filingLoading || !files.invoice || !files.socialSecurity || !files.rut || !files.bankCert}
                className="glass-button bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-xs flex items-center gap-2"
              >
                {filingLoading ? 'Subiendo soportes y radicando...' : 'Radicar Cuenta de Cobro'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Visor de Soportes y Sello Digital */}
      <Modal
        isOpen={!!viewDetailTarget}
        onClose={() => setViewDetailTarget(null)}
        title="Detalle de Radicación y Soportes"
      >
        {viewDetailTarget && (
          <div className="space-y-5 p-4 md:p-6">
            <div className="relative overflow-hidden border-2 border-accent-blue/40 bg-gradient-to-br from-accent-blue/10 to-transparent p-5 rounded-2xl shadow-inner">
              <div className="flex items-center justify-between border-b border-accent-blue/20 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-accent-blue" />
                  <span className="font-extrabold text-sm tracking-wider text-accent-blue uppercase">Sello de Radicado Oficial</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                  {viewDetailTarget.installment.filingSeal?.statusText || 'RECIBIDO'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-text-secondary">No. Radicado:</p>
                  <p className="font-mono font-black text-text-primary text-sm">
                    {viewDetailTarget.installment.filingSeal?.radNumber || `#RAD-${String(viewDetailTarget.installment.billingNumber || 0).padStart(4, '0')}`}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Fecha y Hora:</p>
                  <p className="font-medium text-text-primary">
                    {viewDetailTarget.installment.stampedAt || viewDetailTarget.installment.filedAt
                      ? new Date(viewDetailTarget.installment.stampedAt || viewDetailTarget.installment.filedAt || '').toLocaleString('es-CO')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Asesor Comercial:</p>
                  <p className="font-semibold text-text-primary">
                    {viewDetailTarget.installment.filingSeal?.sellerName || viewDetailTarget.commission.sellerId?.accountId?.fullName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Monto Radicado:</p>
                  <p className="font-black text-accent-green text-sm">
                    {formatCurrency(viewDetailTarget.installment.amount)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-3">Documentos Adjuntos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {viewDetailTarget.installment.invoiceUrl || viewDetailTarget.installment.attachmentUrl ? (
                  <a
                    href={viewDetailTarget.installment.invoiceUrl || viewDetailTarget.installment.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/10 transition-colors text-xs text-text-primary font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent-blue" /> Factura / Cuenta de Cobro
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-glass-border/40 bg-white/2 text-xs text-text-muted">
                    Sin factura adjunta
                  </div>
                )}
                {viewDetailTarget.installment.socialSecurityUrl ? (
                  <a
                    href={viewDetailTarget.installment.socialSecurityUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/10 transition-colors text-xs text-text-primary font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent-green" /> Seguridad Social
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-glass-border/40 bg-white/2 text-xs text-text-muted">
                    Sin seguridad social
                  </div>
                )}
                {viewDetailTarget.installment.rutUrl ? (
                  <a
                    href={viewDetailTarget.installment.rutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/10 transition-colors text-xs text-text-primary font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-accent-yellow" /> RUT Actualizado
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-glass-border/40 bg-white/2 text-xs text-text-muted">
                    Sin RUT
                  </div>
                )}
                {viewDetailTarget.installment.bankCertUrl ? (
                  <a
                    href={viewDetailTarget.installment.bankCertUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-glass-border bg-white/5 hover:bg-white/10 transition-colors text-xs text-text-primary font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-accent-purple" /> Certificación Bancaria
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-text-secondary" />
                  </a>
                ) : (
                  <div className="p-3 rounded-xl border border-glass-border/40 bg-white/2 text-xs text-text-muted">
                    Sin certificación bancaria
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-glass-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewDetailTarget(null)}
                className="glass-button text-xs"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Aprobación / Rechazo / Pago */}
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
                className="glass-input w-full p-3 h-24 text-sm"
                placeholder="Explica el motivo del rechazo (se notifica al asesor para corregir)..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          )}
          {actionTarget?.action === 'aprobar' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Observación de aprobación (opcional)
              </label>
              <textarea
                className="glass-input w-full p-3 h-24 text-sm"
                placeholder="Nota interna de aprobación contable..."
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
              className="glass-button text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAction}
              disabled={submitting}
              className={`glass-button text-xs ${
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
