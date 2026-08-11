'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ConversationProvider,
  useConversation,
} from '@elevenlabs/react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Volume2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AICallContext {
  /** Nombre del cliente */
  nombre_cliente: string
  /** Nombre de la inmobiliaria/constructora */
  nombre_inmobiliaria?: string
  /** Documento de identidad del cliente */
  documento_identidad?: string
  /** Resumen de cuotas pendientes/próximas en texto legible */
  resumen_cuotas?: string
  /** Intención u objetivo principal de la llamada */
  intencion?: 'cobro' | 'recordatorio' | 'soporte' | 'dudas' | 'general'
  /** Tipo de notificación legado */
  tipo_notificacion?: 'cobro' | 'recordatorio'
  /** Cualquier variable extra que quieras inyectar */
  [key: string]: string | undefined
}

interface AICallModalProps {
  isOpen: boolean
  onClose: () => void
  context: AICallContext | null
}

interface TranscriptEntry {
  role: 'agent' | 'user'
  message: string
  timestamp: Date
}

// ─── Inner component (must be inside ConversationProvider) ────────────────────

function AICallInner({ context, onClose }: { context: AICallContext; onClose: () => void }) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [intencion, setIntencion] = useState<NonNullable<AICallContext['intencion']>>(
    context.intencion || 'cobro'
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  const conversation = useConversation({
    onMessage: (payload) => {
      setTranscript((prev) => [
        ...prev,
        {
          role: payload.source === 'ai' ? 'agent' : 'user',
          message: payload.message,
          timestamp: new Date(),
        },
      ])
    },
    onError: (msg) => {
      setError(typeof msg === 'string' ? msg : 'Error de conexión con el agente')
    },
    onDisconnect: () => {
      // Session ended
    },
  })

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const handleStart = async () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID
    if (!agentId) {
      setError('Falta configurar NEXT_PUBLIC_ELEVENLABS_AGENT_ID en .env.local')
      return
    }

    setError(null)
    setTranscript([])

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('Permiso de micrófono denegado. Habilítalo en tu navegador para continuar.')
      return
    }

    const payloadContext = {
      ...context,
      intencion,
      nombre_inmobiliaria: context.nombre_inmobiliaria || 'Cobranza Inmobiliaria',
    }

    try {
      conversation.startSession({
        agentId,
        dynamicVariables: payloadContext,
        onConnect: () => setHasStarted(true),
        onError: (msg) => setError(typeof msg === 'string' ? msg : 'Error al conectar'),
      })
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar la sesión')
    }
  }

  const handleEnd = () => {
    conversation.endSession()
  }

  const handleClose = () => {
    if (conversation.status === 'connected') {
      conversation.endSession()
    }
    onClose()
  }

  const isConnected = conversation.status === 'connected'
  const isConnecting = conversation.status === 'connecting'

  return (
    <div className="flex flex-col h-[520px] -mx-4 -mb-4">
      {/* Status Bar */}
      <div className="px-4 py-3 bg-glass-primary/10 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-3 h-3 rounded-full transition-colors',
              isConnected ? 'bg-accent-green animate-pulse' : 
              isConnecting ? 'bg-accent-yellow animate-pulse' : 
              'bg-text-muted'
            )} />
            <div>
              <p className="text-sm font-medium text-text-primary">
                {context.nombre_cliente}
              </p>
              <p className="text-xs text-text-muted">
                {isConnected ? 'En llamada' : 
                 isConnecting ? 'Conectando...' :
                 hasStarted ? 'Llamada finalizada' :
                 'Listo para llamar'}
              </p>
            </div>
          </div>

          {/* Speaking / Listening indicator */}
          {isConnected && (
            <div className="flex items-center gap-2">
              {conversation.isSpeaking ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-purple/20 text-accent-purple border border-accent-purple/30">
                  <Volume2 className="w-3 h-3" />
                  IA hablando
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
                  <Mic className="w-3 h-3" />
                  Escuchando
                </span>
              )}
            </div>
          )}
        </div>

        {/* Context summary */}
        <div className="mt-2 px-3 py-2 bg-glass-primary/20 rounded-lg">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-medium text-text-secondary">Contexto:</span>{' '}
            {context.resumen_cuotas}
          </p>
        </div>
      </div>

      {/* Transcript Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-primary/50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      >
        {error && (
          <div className="flex items-start gap-2 p-3 bg-accent-red/10 border border-accent-red/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-accent-red mt-0.5 flex-shrink-0" />
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {!hasStarted && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="w-14 h-14 bg-accent-purple/10 rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-accent-purple" />
            </div>
            
            <div>
              <p className="text-sm font-medium text-text-primary">
                Selecciona la intención para el agente:
              </p>
              <p className="text-xs text-text-muted mt-1">
                Esto definirá el saludo y objetivo inicial de la conversación.
              </p>
            </div>

            {/* Intention Selector */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {[
                { id: 'cobro', label: '💸 Cobro cuota' },
                { id: 'recordatorio', label: '⏰ Recordatorio' },
                { id: 'dudas', label: '❓ Resolver dudas' },
                { id: 'soporte', label: '🛠️ Ayuda con pago' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIntencion(item.id as any)}
                  className={cn(
                    'px-3 py-2 text-xs rounded-xl border transition-all text-left font-medium',
                    intencion === item.id
                      ? 'bg-accent-purple/20 border-accent-purple text-accent-purple shadow-sm'
                      : 'bg-glass-primary/20 border-glass-border text-text-secondary hover:bg-glass-primary/40'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-text-muted">
              El agente usará tu micrófono y bocinas para hablar contigo en tiempo real.
            </p>
          </div>
        )}

        {transcript.map((entry, index) => (
          <div
            key={index}
            className={cn(
              'flex',
              entry.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm',
                entry.role === 'user'
                  ? 'bg-accent-blue/20 text-text-primary rounded-tr-none border border-accent-blue/30'
                  : 'bg-accent-purple/15 text-text-primary rounded-tl-none border border-accent-purple/25'
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {entry.role === 'agent' ? (
                  <Bot className="w-3 h-3 text-accent-purple" />
                ) : (
                  <User className="w-3 h-3 text-accent-blue" />
                )}
                <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                  {entry.role === 'agent' ? 'Agente IA' : 'Tú'}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {entry.message}
              </p>
              <p className="text-[10px] text-text-muted text-right mt-1">
                {entry.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isConnected && transcript.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-accent-purple animate-spin mr-2" />
            <span className="text-sm text-text-muted">Esperando respuesta del agente...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-glass-primary/20 border-t border-glass-border">
        <div className="flex items-center justify-center gap-3">
          {!isConnected && !isConnecting ? (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleStart}
                className="flex-1 max-w-xs"
                glow
              >
                <Phone className="w-4 h-4 mr-2" />
                {hasStarted ? 'Reiniciar Llamada' : 'Iniciar Llamada'}
              </Button>
              {hasStarted && (
                <Button
                  variant="glass"
                  size="md"
                  onClick={handleClose}
                >
                  Cerrar
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Mute toggle */}
              <Button
                variant="glass"
                size="md"
                onClick={() => conversation.setMuted(!conversation.isMuted)}
                className={cn(
                  'min-w-[44px] min-h-[44px] p-0',
                  conversation.isMuted && 'bg-accent-red/20 border-accent-red/30 text-accent-red'
                )}
                title={conversation.isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
              >
                {conversation.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {/* End call */}
              <Button
                variant="danger"
                size="md"
                onClick={handleEnd}
                className="flex-1 max-w-xs"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Colgar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main exported Modal ──────────────────────────────────────────────────────

export function AICallModal({ isOpen, onClose, context }: AICallModalProps) {
  if (!context) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📞 Llamada IA de Cobranza"
      size="md"
    >
      <ConversationProvider>
        <AICallInner context={context} onClose={onClose} />
      </ConversationProvider>
    </Modal>
  )
}
