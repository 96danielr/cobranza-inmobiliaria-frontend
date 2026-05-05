'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Search, 
  Globe, 
  Layers, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PauseCircle, 
  Ban, 
  FileText,
  X,
  Loader2,
  AlertCircle,
  Phone,
  Smile,
  Paperclip,
  Camera,
  Mic,
  MessageSquare,
  MailCheck
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  APPROVED: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2, label: 'Aprobada' },
  PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pendiente' },
  REJECTED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Rechazada' },
  PAUSED: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: PauseCircle, label: 'Pausada' },
  DISABLED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Ban, label: 'Desactivada' },
}

const CATEGORIES = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utilidad / Notificación' },
  { value: 'AUTHENTICATION', label: 'Autenticación' },
]

const LANGUAGES = [
  { value: 'es', label: 'Español' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'es_CO', label: 'Español (Colombia)' },
  { value: 'es_MX', label: 'Español (México)' },
]

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  
  // Create Modal State
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'UTILITY',
    language: 'es',
    header: '',
    body: '',
    footer: ''
  })

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getWhatsAppTemplates()
      if (response.data.success) {
        setTemplates(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('No se pudieron cargar las plantillas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.body.trim()) return

    setCreating(true)
    try {
      const components: any[] = []
      
      if (form.header.trim()) {
        components.push({ type: 'HEADER', format: 'TEXT', text: form.header.trim() })
      }

      const bodyComponent: any = { type: 'BODY', text: form.body.trim() }
      const varMatches = form.body.match(/\{\{\d+\}\}/g)
      if (varMatches) {
        const exampleValues = varMatches.map((_, i) => `Ejemplo ${i + 1}`)
        bodyComponent.example = { body_text: [exampleValues] }
      }
      components.push(bodyComponent)

      if (form.footer.trim()) {
        components.push({ type: 'FOOTER', text: form.footer.trim() })
      }

      const response = await adminApi.createWhatsAppTemplate({
        name: form.name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        category: form.category,
        language: form.language,
        components,
      })

      if (response.data.success) {
        toast.success('Plantilla enviada para revisión de Meta')
        setShowCreate(false)
        setForm({ name: '', category: 'UTILITY', language: 'es', header: '', body: '', footer: '' })
        fetchTemplates()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear plantilla')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la plantilla "${name}"? Meta la borrará permanentemente.`)) return

    try {
      const response = await adminApi.deleteWhatsAppTemplate(name)
      if (response.data.success) {
        toast.success('Plantilla eliminada')
        fetchTemplates()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar plantilla')
    }
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = filterCategory === 'ALL' || t.category === filterCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-3">
            <MailCheck className="w-8 h-8 text-accent-blue" />
            Plantillas WhatsApp
          </h1>
          <p className="text-sm text-text-secondary mt-1 max-w-2xl">
            Gestiona las plantillas oficiales aprobadas por Meta para iniciar conversaciones de cobranza.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="glass" size="sm" onClick={fetchTemplates} className="gap-2">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)} className="gap-2 px-6">
            <Plus className="w-4 h-4" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input 
            placeholder="Buscar por nombre..." 
            className="pl-12 glass-input h-12"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="h-12 glass-input px-4 rounded-xl outline-none appearance-none cursor-pointer bg-dark-secondary/30 min-w-[200px]"
        >
          <option value="ALL">Todas las Categorías</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Templates Grid */}
      {loading && templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <Loader2 className="w-12 h-12 animate-spin text-accent-blue mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest">Consultando con Meta...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass-card p-20 text-center space-y-4">
          <div className="w-20 h-20 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-accent-blue opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-text-primary">No se encontraron plantillas</h3>
          <p className="text-sm text-text-secondary max-w-xs mx-auto">Prueba con otros términos o crea una nueva plantilla para que sea revisada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const body = template.components?.find((c: any) => c.type === 'BODY')?.text || ''
            const header = template.components?.find((c: any) => c.type === 'HEADER')?.text
            const footer = template.components?.find((c: any) => c.type === 'FOOTER')?.text
            const status = STATUS_CONFIG[template.status] || { color: 'bg-gray-500/20 text-gray-400', icon: AlertCircle, label: template.status }
            const StatusIcon = status.icon

            return (
              <motion.div 
                layout
                key={template.id || template.name}
                className="glass-card overflow-hidden group flex flex-col h-full border border-glass-border hover:border-accent-blue/50 transition-all duration-500"
              >
                {/* Status Bar */}
                <div className="p-4 border-b border-glass-border bg-dark-primary/20 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn("px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5", status.color)}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(template.name)}
                    className="p-2 hover:bg-accent-red/20 text-text-muted hover:text-accent-red rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-5 space-y-4 bg-dark-secondary/10 relative overflow-hidden min-h-[300px]">
                   {/* WhatsApp Mockup Preview */}
                   <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-lg relative max-w-[90%] self-start border border-gray-100 mb-4">
                      <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent" />
                      {header && <p className="text-[12px] font-bold text-gray-900 border-b pb-1 mb-1">{header}</p>}
                      <p className="text-[13px] text-gray-800 leading-tight whitespace-pre-wrap">{body}</p>
                      {footer && <p className="text-[10px] text-gray-500 mt-2">{footer}</p>}
                      <div className="flex justify-end mt-1">
                        <span className="text-[9px] text-gray-400 font-medium">12:00 PM</span>
                      </div>
                   </div>

                   <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate" title={template.name}>
                        {template.name.replace(/_/g, ' ')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {template.language}
                        </span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {template.category}
                        </span>
                      </div>
                   </div>
                </div>

                <div className="p-3 bg-dark-primary/20 border-t border-glass-border">
                  <Button variant="glass" size="sm" className="w-full h-10 font-bold uppercase tracking-widest text-[10px] gap-2">
                    Previsualizar Completo
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-primary/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-4xl p-0 overflow-hidden border border-glass-border shadow-2xl rounded-3xl flex flex-col md:flex-row"
            >
              {/* Form Side */}
              <div className="flex-1 p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Crear Plantilla</h2>
                    <p className="text-xs text-text-secondary uppercase tracking-widest opacity-60">Sujeta a aprobación por Meta</p>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-glass-primary/10 rounded-full transition-colors">
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Nombre Único</label>
                     <Input 
                       placeholder="ej: cobranza_atrasada_lote"
                       value={form.name}
                       onChange={e => setForm({...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')})}
                       className="glass-input"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Categoría</label>
                     <select 
                       value={form.category}
                       onChange={e => setForm({...form, category: e.target.value})}
                       className="w-full glass-input h-10 px-4 rounded-xl outline-none"
                     >
                        {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-dark-primary">{c.label}</option>)}
                     </select>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Encabezado (Opcional)</label>
                  <Input 
                    placeholder="Texto que aparecerá en negrita al inicio"
                    value={form.header}
                    onChange={e => setForm({...form, header: e.target.value})}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Cuerpo del Mensaje *</label>
                  <textarea 
                    rows={4}
                    placeholder="Hola {{1}}, te escribimos para recordarte tu pago..."
                    value={form.body}
                    onChange={e => setForm({...form, body: e.target.value})}
                    className="w-full glass-input rounded-2xl p-4 text-sm outline-none resize-none focus:ring-2 focus:ring-accent-blue/30"
                  />
                  <p className="text-[9px] text-text-muted italic px-1">Usa &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; para variables dinámicas.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Pie de Página (Opcional)</label>
                  <Input 
                    placeholder="ej: Equipo de Cartera Inmobiliaria"
                    value={form.footer}
                    onChange={e => setForm({...form, footer: e.target.value})}
                    className="glass-input"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button 
                    variant="primary" 
                    className="flex-1 h-14 uppercase tracking-widest font-black"
                    onClick={handleCreate}
                    disabled={creating || !form.name || !form.body}
                  >
                    {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enviar para Revisión"}
                  </Button>
                  <Button variant="glass" className="px-8" onClick={() => setShowCreate(false)}>Cancelar</Button>
                </div>
              </div>

              {/* Preview Side */}
              <div className="hidden lg:flex w-[350px] bg-dark-secondary/50 p-8 flex-col items-center border-l border-glass-border">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-8">Previsualización Real</div>
                  
                  {/* Phone Frame */}
                  <div className="w-full aspect-[9/18.5] bg-black rounded-[3rem] p-2.5 border-[4px] border-dark-primary shadow-2xl relative overflow-hidden">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20" />
                      
                      <div className="h-full w-full bg-[#E5DDD5] rounded-[2.2rem] overflow-hidden flex flex-col relative">
                          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/580/132/HD-wallpaper-whatsapp-background-whatsapp-logo-symbols-grey-background.jpg")' }} />
                          
                          {/* Header */}
                          <div className="bg-[#008069] p-3 pt-6 flex items-center gap-2 relative z-10">
                            <div className="w-6 h-6 rounded-full bg-white/20" />
                            <div className="flex-1">
                              <p className="text-[9px] font-bold text-white leading-tight">Sistema Cobranza</p>
                              <p className="text-[7px] text-white/70 leading-tight">en línea</p>
                            </div>
                          </div>

                          {/* Bubble */}
                          <div className="flex-1 p-3 flex flex-col relative z-10">
                              <div className="bg-white rounded-lg rounded-tl-none p-2 shadow-sm max-w-[90%] self-start relative">
                                  <div className="absolute top-0 -left-1.5 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
                                  {form.header && <p className="text-[9px] font-bold text-gray-900 border-b pb-0.5 mb-1">{form.header}</p>}
                                  <p className="text-[10px] text-gray-800 leading-snug whitespace-pre-wrap">{form.body || 'Escribe el cuerpo del mensaje...'}</p>
                                  {form.footer && <p className="text-[7px] text-gray-500 mt-1">{form.footer}</p>}
                                  <div className="flex justify-end mt-0.5">
                                    <span className="text-[7px] text-gray-400">12:00 PM</span>
                                  </div>
                              </div>
                          </div>

                          {/* Input */}
                          <div className="p-2 flex gap-1 relative z-10">
                             <div className="flex-1 bg-white h-7 rounded-full px-2 flex items-center gap-2">
                                <Smile className="w-3.5 h-3.5 text-gray-400" />
                                <div className="flex-1 text-[8px] text-gray-300">Mensaje</div>
                             </div>
                             <div className="w-7 h-7 bg-[#00A884] rounded-full flex items-center justify-center">
                                <Mic className="w-3.5 h-3.5 text-white" />
                             </div>
                          </div>
                      </div>
                  </div>

                  <p className="mt-8 text-[9px] text-text-muted text-center leading-relaxed">
                    * Meta tarda entre 5 minutos y 24 horas en aprobar nuevas plantillas.
                  </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
