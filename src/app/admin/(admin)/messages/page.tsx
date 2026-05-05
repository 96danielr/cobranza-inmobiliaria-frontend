'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  MessageSquare, 
  Send, 
  User, 
  Search, 
  Plus, 
  Phone, 
  ChevronDown, 
  X, 
  Loader2, 
  Check, 
  CheckCheck,
  Building2,
  Clock
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { COUNTRIES, getFlagUrl, type Country } from '@/lib/countries'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Contact {
  _id: string
  fullName: string
  email?: string
  phone?: string
  whatsapp?: string
}

interface Message {
  _id: string
  direction: 'inbound' | 'outbound'
  body: string
  status: 'sent' | 'delivered' | 'read' | 'received' | 'failed'
  createdAt: string
  type: string
}

interface Conversation {
  _id: string
  waId: string
  lastMessage: string
  updatedAt: string
  clientId?: Contact
  unreadCount: number
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // New Chat Modal State
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES.find(c => c.iso === 'co') || COUNTRIES[0])
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const response = await adminApi.getWhatsAppConversations()
      if (response.data.success) {
        setConversations(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await adminApi.getWhatsAppTemplates()
      if (response.data.success) {
        setTemplates(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }, [])

  const fetchHistory = useCallback(async (convId: string) => {
    // Find the conversation to get the client ID
    const conv = conversations.find(c => c._id === convId)
    if (!conv || !conv.clientId?._id) return

    try {
      const response = await adminApi.getWhatsAppHistory(conv.clientId._id)
      if (response.data.success) {
        setMessages(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoadingMessages(false)
    }
  }, [conversations])

  useEffect(() => {
    fetchConversations()
    fetchTemplates()
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [fetchConversations, fetchTemplates])

  useEffect(() => {
    if (selectedId) {
      setLoadingMessages(true)
      fetchHistory(selectedId)
      if (pollingInterval.current) clearInterval(pollingInterval.current)
      pollingInterval.current = setInterval(() => fetchHistory(selectedId), 5000)
    } else {
      setMessages([])
      if (pollingInterval.current) clearInterval(pollingInterval.current)
    }
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current)
    }
  }, [selectedId, fetchHistory])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const selectedConv = conversations.find(c => c._id === selectedId)
    if (!newMessage.trim() || !selectedConv) return

    setSending(true)
    try {
      const response = await adminApi.sendWhatsAppMessage({
        clientId: selectedConv.clientId?._id,
        phone: selectedConv.waId,
        text: newMessage
      })
      if (response.data.success) {
        setNewMessage('')
        fetchHistory(selectedId!)
        fetchConversations()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleStartNewChat = async () => {
    if (!newChatPhone.trim()) return

    const fullPhone = `${selectedCountry.code}${newChatPhone.replace(/\D/g, '')}`
    
    setSending(true)
    try {
      const response = await adminApi.sendWhatsAppMessage({
        phone: fullPhone,
        templateName: selectedTemplate || undefined,
        text: selectedTemplate ? undefined : 'Hola, me pongo en contacto contigo desde el Sistema de Cobranza.'
      })
      
      if (response.data.success) {
        toast.success('Conversación iniciada')
        setIsNewChatModalOpen(false)
        setNewChatPhone('')
        fetchConversations()
        // Try to select the new conversation
        const newConv = response.data.data
        if (newConv && newConv.conversationId) {
           setSelectedId(newConv.conversationId)
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar chat')
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

  const filteredConversations = conversations.filter(c => {
    const name = c.clientId?.fullName || c.waId
    return name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const selectedConversation = conversations.find(c => c._id === selectedId)

  return (
    <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] glass-card overflow-hidden rounded-3xl border border-glass-border shadow-2xl">
      {/* Sidebar - Conversations List */}
      <div className="w-full md:w-80 border-r border-glass-border flex flex-col bg-dark-secondary/30">
        <div className="p-4 border-b border-glass-border space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black text-text-primary uppercase tracking-tighter flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent-blue" />
              Mensajes
            </h1>
            <Button 
              variant="glass" 
              size="sm" 
              className="rounded-full w-12 h-12 p-0 flex items-center justify-center bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 shadow-glow-blue transition-all hover:scale-110 active:scale-95"
              onClick={() => setIsNewChatModalOpen(true)}
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Buscar chat..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 glass-input h-10 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-2 opacity-50">
              <p className="text-sm text-text-secondary">No hay conversaciones</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv._id}
                onClick={() => setSelectedId(conv._id)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 text-left transition-all border-b border-glass-border/10",
                  selectedId === conv._id 
                    ? "bg-accent-blue/10 border-l-4 border-l-accent-blue" 
                    : "hover:bg-glass-primary/5 border-l-4 border-l-transparent"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xs font-bold text-white">
                    {conv.clientId?.fullName?.charAt(0).toUpperCase() || <Phone className="w-4 h-4" />}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-text-primary truncate">
                      {conv.clientId?.fullName || `+${conv.waId}`}
                    </h3>
                    <span className="text-[10px] text-text-muted whitespace-nowrap">
                      {dayjs(conv.updatedAt).format('HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate opacity-80">
                    {conv.lastMessage}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-accent-blue flex items-center justify-center animate-pulse">
                    <span className="text-[10px] font-bold text-white">{conv.unreadCount}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-dark-primary/20 relative">
        <AnimatePresence mode="wait">
          {selectedId ? (
            <motion.div 
              key={selectedId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-glass-border bg-glass-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">
                      {selectedConversation?.clientId?.fullName || `+${selectedConversation?.waId}`}
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                      <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest">En línea</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="glass" size="sm" className="h-8 text-[10px] uppercase tracking-wider gap-2">
                     <Building2 className="w-3 h-3" /> Perfil
                   </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-dark-primary/10"
                style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)', 
                  backgroundSize: '32px 32px' 
                }}
              >
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
                    <MessageSquare className="w-12 h-12 mb-4" />
                    <p className="text-sm">No hay mensajes previos.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg._id}
                      className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xl relative group",
                        msg.direction === 'outbound' 
                          ? "bg-accent-blue text-white rounded-tr-none" 
                          : "bg-glass-secondary text-text-primary rounded-tl-none border border-glass-border"
                      )}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-60">
                          <span className="text-[9px] font-medium uppercase tracking-tighter">
                            {dayjs(msg.createdAt).format('HH:mm')}
                          </span>
                          {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                        </div>
                        
                        {/* Decorative triangle for bubbles */}
                        <div className={cn(
                          "absolute top-0 w-2 h-2",
                          msg.direction === 'outbound' 
                            ? "right-[-8px] border-l-[8px] border-l-accent-blue border-b-[8px] border-b-transparent" 
                            : "left-[-8px] border-r-[8px] border-r-glass-secondary border-b-[8px] border-b-transparent"
                        )} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-glass-primary/5 border-t border-glass-border">
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Escribe un mensaje..."
                      className="w-full glass-input rounded-2xl py-3 px-4 text-sm resize-none min-h-[48px] max-h-32 transition-all focus:min-h-[80px]"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={!newMessage.trim() || sending}
                    className="rounded-2xl w-14 h-14 p-0 flex-shrink-0 shadow-lg shadow-accent-blue/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {sending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Send className="w-6 h-6 stroke-[2.5px] -rotate-45 translate-x-0.5 -translate-y-0.5" />
                    )}
                  </Button>
                </form>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-30">
               <div className="w-24 h-24 bg-accent-blue/5 rounded-full flex items-center justify-center mb-6">
                 <MessageSquare className="w-12 h-12 text-accent-blue" />
               </div>
               <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Bandeja de Mensajes</h2>
               <p className="text-sm max-w-xs">Selecciona un chat de la lista para empezar a gestionar la cobranza por WhatsApp.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-primary/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-lg p-6 space-y-6 relative border border-glass-border shadow-2xl rounded-3xl"
            >
              <button 
                onClick={() => setIsNewChatModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-glass-primary/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent-blue/20 flex items-center justify-center text-accent-blue">
                    <Plus className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Nueva Conversación</h2>
                </div>
                <p className="text-xs text-text-secondary uppercase tracking-widest opacity-60 ml-[52px]">Iniciar chat con número nuevo</p>
              </div>

              <div className="space-y-4">
                {/* Phone Input with Country Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Número de Teléfono</label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
                        className="flex items-center gap-2 px-4 py-3 glass-button rounded-2xl min-w-[120px] justify-between border border-glass-border/30"
                      >
                        <div className="flex items-center gap-2">
                          <img 
                            src={getFlagUrl(selectedCountry.iso)} 
                            alt={selectedCountry.name}
                            className="w-5 h-3 object-cover rounded-sm"
                          />
                          <span className="text-xs font-bold text-text-primary">+{selectedCountry.code}</span>
                        </div>
                        <ChevronDown className={cn("w-3 h-3 text-text-muted transition-transform", isCountryMenuOpen && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {isCountryMenuOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 mt-2 w-64 glass-card p-2 z-[110] border border-glass-border shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
                          >
                            <div className="p-2 border-b border-glass-border mb-2">
                              <Input
                                placeholder="Buscar país..."
                                value={countrySearch}
                                onChange={e => setCountrySearch(e.target.value)}
                                className="h-8 text-xs glass-input"
                                autoFocus
                              />
                            </div>
                            {COUNTRIES.filter(c => 
                              c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
                              c.code.includes(countrySearch)
                            ).map(c => (
                              <button
                                key={`${c.iso}-${c.code}`}
                                onClick={() => {
                                  setSelectedCountry(c)
                                  setIsCountryMenuOpen(false)
                                  setCountrySearch('')
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-accent-blue/10 transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <img src={getFlagUrl(c.iso)} className="w-5 h-3" />
                                  <span className="text-xs text-text-primary group-hover:text-accent-blue">{c.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted">+{c.code}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="flex-1 relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <Input
                        placeholder="Ej: 300 123 4567"
                        value={newChatPhone}
                        onChange={e => setNewChatPhone(e.target.value.replace(/\D/g, ''))}
                        className="pl-12 glass-input h-full rounded-2xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Template Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Plantilla de Inicio (Opcional)</label>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full glass-input rounded-2xl px-4 py-3 text-sm appearance-none cursor-pointer border border-glass-border/30 bg-transparent"
                  >
                    <option value="" className="bg-dark-primary text-text-primary">Mensaje Libre (Requiere chat previo)</option>
                    {templates.map((t: any) => (
                      <option key={t.id} value={t.name} className="bg-dark-primary text-text-primary">
                        {t.name} ({t.language})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-text-muted flex items-center gap-1 ml-1">
                    <Clock className="w-3 h-3" /> Meta requiere plantillas para iniciar chats nuevos o tras 24h.
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleStartNewChat}
                    variant="primary"
                    disabled={!newChatPhone.trim() || sending}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-tighter text-base shadow-xl shadow-accent-blue/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    {sending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 stroke-[2.5px]" />
                        Iniciar Conversación
                      </>
                    )}
                  </Button>
                </div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}
