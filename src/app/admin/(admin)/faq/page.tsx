'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Combobox } from '@/components/ui/Combobox'
import { adminApi } from '@/lib/adminApi'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  BookOpen,
  Power,
  PowerOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeEntry {
  _id: string
  pregunta: string
  respuesta: string
  keywords: string[]
  categoria: string
  activo: boolean
  createdAt: string
}

const CATEGORIAS = [
  { value: 'pagos', label: 'Pagos' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'cuotas', label: 'Cuotas' },
  { value: 'general', label: 'General' },
]

const emptyForm = {
  pregunta: '',
  respuesta: '',
  keywords: '',
  categoria: 'general',
  activo: true,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FAQPage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('ALL')
  const [activo, setActivo] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeEntry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (pageNumber: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getKnowledge(
        pageNumber,
        20,
        search || undefined,
        categoria,
        activo
      )
      setEntries(res.data.data.entries || [])
      setTotalPages(res.data.data.totalPages || 1)
      setTotal(res.data.data.total || 0)
      setPage(pageNumber)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'No se pudo cargar la base de conocimiento')
    } finally {
      setLoading(false)
    }
  }, [search, categoria, activo])

  useEffect(() => {
    const timer = setTimeout(() => load(1), 300)
    return () => clearTimeout(timer)
  }, [search, categoria, activo, load])

  const openCreate = () => {
    setEditingEntry(null)
    setForm({ ...emptyForm })
    setIsModalOpen(true)
  }

  const openEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry)
    setForm({
      pregunta: entry.pregunta,
      respuesta: entry.respuesta,
      keywords: (entry.keywords || []).join(', '),
      categoria: entry.categoria || 'general',
      activo: entry.activo,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.pregunta.trim() || !form.respuesta.trim()) {
      toast.error('La pregunta y la respuesta son obligatorias')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        pregunta: form.pregunta.trim(),
        respuesta: form.respuesta.trim(),
        keywords: form.keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean),
        categoria: form.categoria,
        activo: form.activo,
      }

      if (editingEntry) {
        await adminApi.updateKnowledge(editingEntry._id, payload)
        toast.success('Entrada actualizada correctamente')
      } else {
        await adminApi.createKnowledge(payload)
        toast.success('Entrada creada correctamente')
      }

      setIsModalOpen(false)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Ocurrió un error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (entry: KnowledgeEntry) => {
    try {
      await adminApi.updateKnowledge(entry._id, { activo: !entry.activo })
      toast.success(entry.activo ? 'Entrada desactivada' : 'Entrada activada')
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Ocurrió un error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminApi.deleteKnowledge(deleteTarget._id)
      toast.success('Entrada eliminada')
      setDeleteTarget(null)
      load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Ocurrió un error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent-purple" />
            Base de conocimiento (FAQ Agente)
          </h1>
          <p className="text-sm text-text-muted mt-1">
            El agente de llamadas IA responde las dudas de los clientes usando estas entradas. Si una
            duda no está aquí, la escala a un asesor.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate} glow>
          <Plus className="w-4 h-4 mr-2" />
          Nueva entrada
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              icon={Search}
              placeholder="Buscar pregunta o respuesta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Combobox
              label="Categoría"
              options={[{ value: 'ALL', label: 'Todas' }, ...CATEGORIAS]}
              value={categoria}
              onChange={setCategoria}
            />
            <Combobox
              label="Estado"
              options={[
                { value: 'ALL', label: 'Todos' },
                { value: 'true', label: 'Activas' },
                { value: 'false', label: 'Inactivas' },
              ]}
              value={activo}
              onChange={setActivo}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <div className="flex flex-col items-center space-y-3">
                <BookOpen className="w-12 h-12 text-text-disabled" />
                <p className="text-lg font-medium text-text-secondary">No hay entradas</p>
                <p className="text-sm text-text-muted">
                  Agrega preguntas frecuentes para que el agente responda a tus clientes.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-glass-border">
              {entries.map((entry) => (
                <div key={entry._id} className="p-4 flex items-start justify-between gap-3 hover:bg-glass-primary/10 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary">{entry.pregunta}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                        {CATEGORIAS.find((c) => c.value === entry.categoria)?.label || entry.categoria}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                          entry.activo
                            ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                            : 'bg-text-muted/15 text-text-muted border-glass-border'
                        )}
                      >
                        {entry.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">{entry.respuesta}</p>
                    {entry.keywords && entry.keywords.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {entry.keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-glass-primary/20 text-text-muted border border-glass-border"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(entry)}
                      className="glass-button min-h-[44px] min-w-[44px] text-text-muted hover:text-accent-yellow hover:bg-accent-yellow/20"
                      title={entry.activo ? 'Desactivar' : 'Activar'}
                    >
                      {entry.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(entry)}
                      className="glass-button min-h-[44px] min-w-[44px] text-accent-blue hover:text-accent-blue hover:bg-accent-blue/20"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(entry)}
                      className="glass-button min-h-[44px] min-w-[44px] text-accent-red hover:text-accent-red hover:bg-accent-red/20"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-glass-border">
              <span className="text-sm text-text-muted">
                {total} {total === 1 ? 'entrada' : 'entradas'}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Editar entrada' : 'Nueva entrada'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Pregunta *</label>
            <Input
              placeholder="Ej: ¿Cómo puedo hacer un pago?"
              value={form.pregunta}
              onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Respuesta *</label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-glass-primary/20 border border-glass-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all resize-y"
              placeholder="Respuesta oficial que leerá el agente..."
              value={form.respuesta}
              onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Palabras clave (separadas por coma)
              </label>
              <Input
                placeholder="recibo, transferencia, banco"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Categoría</label>
              <Combobox
                options={CATEGORIAS}
                value={form.categoria}
                onChange={(value) => setForm({ ...form, categoria: value })}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-4 h-4 accent-accent-blue"
            />
            <span className="text-sm text-text-secondary">Entrada activa (visible para el agente)</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="glass" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting} glow>
              {editingEntry ? 'Guardar cambios' : 'Crear entrada'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar entrada"
        message={`¿Seguro que quieres eliminar "${deleteTarget?.pregunta}"? El agente ya no podrá responder esta duda.`}
        confirmText="Eliminar"
        isLoading={deleting}
      />
    </div>
  )
}
