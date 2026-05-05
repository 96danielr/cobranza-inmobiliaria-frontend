import { useState, useEffect, useRef } from 'react'
import { Send, User, Check, CheckCheck, Loader2, MessageSquare, Phone } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface Message {
  _id: string
  direction: 'inbound' | 'outbound'
  body: string
  status: 'sent' | 'delivered' | 'read' | 'received' | 'failed'
  createdAt: string
  type: string
}

interface WhatsAppChatModalProps {
  isOpen: boolean
  onClose: () => void
  client: {
    _id: string
    name: string
    phone: string
    whatsapp?: string
  } | null
}

export function WhatsAppChatModal({ isOpen, onClose, client }: WhatsAppChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && client) {
      fetchHistory()
      fetchTemplates()
      // Setup interval for polling new messages (simple implementation)
      const interval = setInterval(fetchHistory, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, client?._id])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchHistory = async () => {
    if (!client) return
    try {
      const response = await adminApi.getWhatsAppHistory(client._id)
      if (response.data.success) {
        setMessages(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await adminApi.getWhatsAppTemplates()
      if (response.data.success) {
        setTemplates(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSendTemplate = async (templateName: string) => {
    if (!client) return
    setSending(true)
    try {
      const response = await adminApi.sendWhatsAppMessage({
        clientId: client._id,
        templateName
      })
      if (response.data.success) {
        setShowTemplates(false)
        fetchHistory()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar plantilla')
    } finally {
      setSending(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !client) return

    setSending(true)
    try {
      const response = await adminApi.sendWhatsAppMessage({
        clientId: client._id,
        text: newMessage
      })
      if (response.data.success) {
        setNewMessage('')
        fetchHistory()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Check className="w-3 h-3 text-text-muted" />
      case 'delivered': return <CheckCheck className="w-3 h-3 text-text-muted" />
      case 'read': return <CheckCheck className="w-3 h-3 text-accent-blue" />
      case 'failed': return <span className="text-accent-red">!</span>
      default: return null
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chat con ${client?.name || 'Cliente'}`}
      size="md"
    >
      <div className="flex flex-col h-[500px] -mx-4 -mb-4">
        {/* Header Info */}
        <div className="px-4 py-2 bg-glass-primary/10 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs font-medium text-text-secondary">{client?.phone || client?.whatsapp}</span>
          </div>
          <div className="relative">
            <Button 
              variant="glass" 
              size="sm" 
              className="h-8 text-[10px] uppercase tracking-wider"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              {showTemplates ? 'Escribir' : 'Ver Plantillas'}
            </Button>
            
            {showTemplates && (
              <div className="absolute top-full right-0 mt-2 w-64 glass-card p-2 z-50 border border-glass-border shadow-2xl max-h-60 overflow-y-auto">
                <div className="px-3 py-2 border-b border-glass-border mb-1">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Plantillas Aprobadas</p>
                </div>
                {templates.length === 0 ? (
                  <p className="p-4 text-xs text-text-secondary text-center">Cargando plantillas...</p>
                ) : (
                  templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSendTemplate(t.name)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-accent-blue/10 text-xs text-text-primary transition-all mb-1"
                    >
                      <span className="font-bold">{t.name}</span>
                      <span className="block opacity-50 text-[9px]">{t.language}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-primary/50"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-accent-blue opacity-50" />
              </div>
              <p className="text-sm text-text-secondary">No hay mensajes previos con este cliente.</p>
              <p className="text-xs text-text-muted mt-1">Envía un mensaje para iniciar la cobranza.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div 
                key={msg._id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`
                  max-w-[80%] rounded-2xl px-4 py-2 shadow-sm
                  ${msg.direction === 'outbound' 
                    ? 'bg-accent-blue/20 text-text-primary rounded-tr-none border border-accent-blue/30' 
                    : 'bg-glass-primary/40 text-text-primary rounded-tl-none border border-glass-border'
                  }
                `}>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-text-muted">
                      {dayjs(msg.createdAt).format('HH:mm')}
                    </span>
                    {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-glass-primary/20 border-t border-glass-border flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 glass-input min-h-[44px]"
            disabled={sending}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className="bg-accent-blue hover:bg-accent-blue/80 text-white min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-xl transition-all"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
