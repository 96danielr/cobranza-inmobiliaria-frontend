'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Combobox } from '@/components/ui/Combobox'
import { adminApi } from '@/lib/adminApi'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  PhoneForwarded,
  Loader2,
  AlertCircle,
  Phone,
  User,
  FileText,
  Clock,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Escalation {
  _id: string
  client?: {
    _id: string
    name: string
    idNumber: string
    phone: string
  }
  motivo: string
  estado: 'pendiente' | 'en_proceso' | 'resuelto'
  createdAt: string
}

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto', label: 'Resuelto' },
]

const ESTADO_STYLES: Record<string, string> = {
  pendiente: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  en_proceso: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  resuelto: 'bg-accent-green/15 text-accent-green border-accent-green/30',
}

const ESTADO_ORDER: Record<string, number> = { pendiente: 0, en_proceso: 1, resuelto: 2 }

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estado, setEstado] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const load = useCallback(async (pageNumber: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getEscalations(pageNumber, 20, estado)
      setEscalations(res.data.data.escalations || [])
      setTotalPages(res.data.data.totalPages || 1)
      setTotal(res.data.data.total || 0)
      setPage(pageNumber)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar la cola de llamadas')
    } finally {
      setLoading(false)
    }
  }, [estado])

  useEffect(() => {
    load(1)
  }, [estado, load])

  const handleChangeEstado = async (esc: Escalation, nuevoEstado: string) => {
    setUpdatingId(esc._id)
    try {
      await adminApi.updateEscalationStatus(esc._id, nuevoEstado)
      toast.success('Estado actualizado')
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Ocurrió un error al actualizar')
    } finally {
      setUpdatingId(null)
    }
  }

  const sorted = [...escalations].sort((a, b) => ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <PhoneForwarded className="w-5 h-5 text-accent-purple" />
            Llamadas agendadas para asesores
          </h1>
          <p className="text-sm text-text-muted mt-1">
            El agente IA agenda una llamada aquí cuando el cliente lo necesita (dudas sin respuesta,
            solicitud de contacto, casos complejos). Llámalo tú mismo y marca el avance.
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="max-w-xs">
            <Combobox
              label="Estado"
              options={[{ value: 'ALL', label: 'Todos' }, ...ESTADOS]}
              value={estado}
              onChange={setEstado}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center space-y-3">
                <PhoneForwarded className="w-12 h-12 text-text-disabled" />
                <p className="text-lg font-medium text-text-secondary">No hay llamadas agendadas</p>
                <p className="text-sm text-text-muted">
                  Cuando el agente IA escale un cliente, aparecerá aquí.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {sorted.map((esc) => (
                <div key={esc._id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-3 hover:bg-glass-primary/10 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary">
                        <User className="w-4 h-4 text-accent-blue flex-shrink-0" />
                        {esc.client?.name || 'Cliente'}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          ESTADO_STYLES[esc.estado]
                        )}
                      >
                        {ESTADOS.find((e) => e.value === esc.estado)?.label || esc.estado}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {formatDate(esc.createdAt)}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {esc.client?.idNumber && (
                        <span className="px-2 py-0.5 rounded-lg text-xs bg-glass-primary/20 text-text-secondary border border-glass-border">
                          C.C. {esc.client.idNumber}
                        </span>
                      )}
                      {esc.client?.phone && (
                        <span className="px-2 py-0.5 rounded-lg text-xs bg-glass-primary/20 text-text-secondary border border-glass-border">
                          📞 {esc.client.phone}
                        </span>
                      )}
                    </div>

                    {esc.motivo && (
                      <p className="text-sm text-text-secondary mt-2 flex items-start gap-1.5">
                        <FileText className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                        {esc.motivo}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    {esc.client?.phone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const phone = esc.client?.phone?.replace(/\D/g, '')
                          if (phone) window.open(`tel:${phone}`, '_self')
                        }}
                        className="glass-button text-accent-green hover:text-accent-green hover:bg-accent-green/20 min-h-[44px]"
                      >
                        <Phone className="w-4 h-4 mr-1.5" />
                        Llamar
                      </Button>
                    )}
                    {esc.estado === 'pendiente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeEstado(esc, 'en_proceso')}
                        loading={updatingId === esc._id}
                        className="glass-button text-accent-yellow hover:text-accent-yellow hover:bg-accent-yellow/20 min-h-[44px]"
                      >
                        En proceso
                      </Button>
                    )}
                    {esc.estado !== 'resuelto' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeEstado(esc, 'resuelto')}
                        loading={updatingId === esc._id}
                        className="glass-button text-accent-green hover:text-accent-green hover:bg-accent-green/20 min-h-[44px]"
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-glass-border">
              <span className="text-sm text-text-muted">
                {total} {total === 1 ? 'llamada' : 'llamadas'}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="glass" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
                  Anterior
                </Button>
                <span className="text-sm text-text-muted">
                  {page} / {totalPages}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
