'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { adminApi } from '@/lib/adminApi'
import {
  Phone,
  Clock,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CalendarDays,
  BadgeCheck,
  PhoneForwarded,
  FileText,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallLogEntry {
  _id: string
  conversationId?: string
  intent: 'cobro' | 'recordatorio' | 'dudas' | 'soporte' | 'general'
  durationSeconds: number
  status: 'completed' | 'failed' | 'cancelled'
  transcript: { role: 'agent' | 'user'; message: string; timestamp: string }[]
  paymentPromise?: {
    promisedDate?: string
    amount?: number
    notes?: string
  }
  escalated: boolean
  createdAt: string
}

interface CallHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string | null
  clientName?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INTENT_LABELS: Record<string, string> = {
  cobro: 'Cobro',
  recordatorio: 'Recordatorio',
  dudas: 'Dudas',
  soporte: 'Soporte',
  general: 'General',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completada',
  failed: 'Fallida',
  cancelled: 'Cancelada',
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  failed: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  cancelled: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatMoney(amount?: number): string {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CallHistoryModal({ isOpen, onClose, clientId, clientName }: CallHistoryModalProps) {
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async (pageNumber: number = 1) => {
    if (!clientId) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getCallLogs(clientId, pageNumber, 10)
      setCallLogs(res.data.data.callLogs || [])
      setTotalPages(res.data.data.totalPages || 1)
      setPage(pageNumber)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar el historial de llamadas')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (isOpen && clientId) {
      setExpanded(null)
      load(1)
    }
  }, [isOpen, clientId, load])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientName ? `📞 Historial de llamadas - ${clientName}` : '📞 Historial de llamadas'}
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
          </div>
        )}

        {!loading && callLogs.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="w-14 h-14 bg-glass-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">Este cliente no tiene llamadas registradas</p>
          </div>
        )}

        {!loading &&
          callLogs.map((log) => {
            const isExpanded = expanded === log._id
            return (
              <div
                key={log._id}
                className="rounded-2xl border border-glass-border bg-glass-primary/10 overflow-hidden"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpanded(isExpanded ? null : log._id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-glass-primary/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                        log.status === 'completed'
                          ? 'bg-accent-green/15 text-accent-green'
                          : 'bg-accent-red/15 text-accent-red'
                      )}
                    >
                      {log.status === 'completed' ? (
                        <BadgeCheck className="w-4 h-4" />
                      ) : (
                        <PhoneForwarded className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {INTENT_LABELS[log.intent] || 'General'}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            STATUS_STYLES[log.status]
                          )}
                        >
                          {STATUS_LABELS[log.status]}
                        </span>
                        {log.escalated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-purple/15 text-accent-purple border border-accent-purple/30">
                            Escalada a asesor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(log.createdAt)}
                        <span className="inline-block mx-1">·</span>
                        <Clock className="w-3 h-3" />
                        {formatDuration(log.durationSeconds)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-text-muted">
                      {log.transcript.length} mensajes
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </div>
                </button>

                {/* Payment promise */}
                {log.paymentPromise && (log.paymentPromise.promisedDate || log.paymentPromise.amount) && (
                  <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-accent-blue/10 border border-accent-blue/25">
                    <p className="text-[11px] font-medium text-accent-blue uppercase tracking-wider mb-1 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Promesa de pago
                    </p>
                    <p className="text-sm text-text-primary">
                      {log.paymentPromise.promisedDate
                        ? `Fecha prometida: ${new Date(log.paymentPromise.promisedDate).toLocaleDateString('es-CO')}`
                        : 'Fecha prometida: -'}
                      {log.paymentPromise.amount
                        ? ` · Monto: ${formatMoney(log.paymentPromise.amount)}`
                        : ''}
                    </p>
                    {log.paymentPromise.notes && (
                      <p className="text-xs text-text-muted mt-0.5">
                        Notas: {log.paymentPromise.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Expanded transcript */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 max-h-72 overflow-y-auto">
                    <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Transcripción
                    </p>
                    {log.transcript.length === 0 && (
                      <p className="text-xs text-text-muted">
                        Sin transcripción disponible para esta llamada.
                      </p>
                    )}
                    {log.transcript.map((entry, index) => (
                      <div key={index} className={cn('flex', entry.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-3 py-2',
                            entry.role === 'user'
                              ? 'bg-accent-blue/15 text-text-primary rounded-tr-none border border-accent-blue/25'
                              : 'bg-accent-purple/15 text-text-primary rounded-tl-none border border-accent-purple/25'
                          )}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {entry.role === 'agent' ? (
                              <Bot className="w-3 h-3 text-accent-purple" />
                            ) : (
                              <User className="w-3 h-3 text-accent-blue" />
                            )}
                            <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                              {entry.role === 'agent' ? 'Agente IA' : 'Cliente'}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                          {entry.timestamp && (
                            <p className="text-[10px] text-text-muted text-right mt-1">
                              {new Date(entry.timestamp).toLocaleTimeString('es', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="glass"
              size="sm"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-text-muted">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="glass"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
