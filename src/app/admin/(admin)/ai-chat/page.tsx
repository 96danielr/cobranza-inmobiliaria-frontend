'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Trash2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import * as XLSX from 'xlsx'
import { aiApi } from '@/lib/aiApi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { DownloadCloud, FileSpreadsheet } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'table'
  tableData?: any[]
  columns?: string[]
  suggestedFilename?: string
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de inteligencia artificial. Puedo ayudarte a analizar las ventas, lotes y pagos de tu empresa. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setIsThinking(false)
      setMessages(prev => {
        const newMsgs = [...prev]
        const last = newMsgs[newMsgs.length - 1]
        if (last && last.role === 'assistant') {
          (last as any).isFinished = true
        }
        return newMsgs;
      })
    }
  }

  const handleExportToExcel = (data: any[], columns: string[], suggestedName?: string) => {
    const ws = XLSX.utils.json_to_sheet(data, { header: columns })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte AI")

    const date = new Date().toISOString().split('T')[0]
    const finalName = suggestedName ? `${suggestedName}_${date}.xlsx` : `Reporte_IA_${date}.xlsx`
    XLSX.writeFile(wb, finalName)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsThinking(true)

    // Setup cancellation
    abortControllerRef.current = new AbortController()

    try {
      // Enviar el historial previo (mapeado para no enviar datos innecesarios)
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await aiApi.ask(input, history, abortControllerRef.current.signal)

      if (!response.ok) throw new Error('Error en la comunicación con la IA')
      if (!response.body) throw new Error('No se recibió cuerpo de respuesta')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let lineBuffer = ''

      // Crear mensaje vacío para el asistente que se irá llenando
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, assistantMessage])

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        lineBuffer += decoder.decode(value, { stream: true })
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (dataStr === '[DONE]') continue

            try {
              const data = JSON.parse(dataStr)

              if (data.metadata) {
                setMessages(prev => {
                  const newMessages = [...prev]
                  const last = newMessages[newMessages.length - 1]
                  if (last && last.role === 'assistant') {
                    last.type = data.metadata.type
                    last.tableData = data.metadata.tableData
                    last.columns = data.metadata.columns
                    last.suggestedFilename = data.metadata.suggestedFilename
                  }
                  return newMessages
                })
              } else if (data.token) {
                setIsThinking(false)
                accumulatedContent += data.token

                setMessages(prev => {
                  const newMessages = [...prev]
                  const last = newMessages[newMessages.length - 1]
                  if (last && last.role === 'assistant') {
                    last.content = accumulatedContent
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Ignorar parcelas incompletas
            }
          }
        }
      }

      // Finish state
      setIsLoading(false)
      setIsThinking(false)
      setMessages(prev => {
        const newMsgs = [...prev]
        const last = newMsgs[newMsgs.length - 1]
        if (last && last.role === 'assistant' && last.content.length > 0) {
          (last as any).isFinished = true
        }
        return newMsgs
      })

    } catch (error: any) {
      if (error.name === 'AbortError') return

      setIsLoading(false)
      setIsThinking(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ocurrió un error al procesar tu solicitud.',
        timestamp: new Date()
      }])
    } finally {
      abortControllerRef.current = null
    }
  }

  const suggestions = [
    { label: 'Resumen de ventas', text: 'Dame un resumen de las ventas de este mes' },
    { label: 'Mejores clientes', text: '¿Quiénes son los 5 clientes con más pagos?' },
    { label: 'Estado de lotes', text: '¿Cuántos lotes están disponibles y cuántos vendidos?' },
    { label: 'Análisis de mora', text: '¿Cuál es el monto total en mora actualmente?' }
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] px-1 py-2 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent-blue" />
            Asistente Inteligente
          </h1>
          <p className="text-text-secondary">Consulta datos y obtén análisis en tiempo real</p>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setMessages([messages[0]])}
          className="text-text-secondary hover:text-accent-red"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpiar Chat
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 glass-card rounded-2xl border border-glass-border overflow-hidden">
        {/* Messages Dashboard */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex max-w-[85%] md:max-w-[75%] gap-3",
                message.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-glow",
                  message.role === 'user' ? "bg-gradient-primary" : "bg-dark-secondary border border-accent-blue/20"
                )}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-accent-blue" />
                  )}
                </div>
                <div className={cn(
                  "flex flex-col relative",
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-700 relative overflow-hidden",
                    message.role === 'user'
                      ? "bg-gradient-primary text-white rounded-tr-none"
                      : "bg-glass-primary/50 text-text-primary border border-glass-border rounded-tl-none backdrop-blur-sm",
                    (message as any).isFinished && "ring-2 ring-accent-blue/30 shadow-glow",
                    (message as any).isFinished && "animate-rainbow-burst animate-mirror-shine",
                    message.content === '' && message.role === 'assistant' && "animate-rainbow-loading border-2"
                  )}>
                    {message.content === '' && message.role === 'assistant' ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                      </div>
                    ) : (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-accent-blue" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}

                    {message.type === 'table' && message.tableData && message.tableData.length > 0 && (
                      <div className={cn(
                        "mt-4 overflow-x-auto rounded-xl border border-glass-border/30 bg-black/20 transition-all duration-1000",
                        (message as any).isFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                      )}>
                        {/* Botón de Excel */}
                        <div className="p-3 border-b border-glass-border/20 flex justify-between items-center bg-white/5">
                          <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
                            {message.tableData.length} registros encontrados
                          </span>
                          <button
                            onClick={() => handleExportToExcel(message.tableData!, message.columns!, message.suggestedFilename)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                              message.tableData.length > 5
                                ? "bg-accent-green/20 text-accent-green border border-accent-green/30 hover:bg-accent-green/30 shadow-glow animate-pulse"
                                : "bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10"
                            )}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Descargar Excel
                          </button>
                        </div>

                        <table className="w-full text-left border-collapse min-w-[400px]">
                          <thead>
                            <tr className="bg-white/5">
                              {message.columns?.map((col) => (
                                <th key={col} className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-accent-blue border-b border-glass-border/30">
                                  {col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {message.tableData.map((row, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                {message.columns?.map((col) => (
                                  <td key={col} className="px-4 py-2 text-xs border-b border-glass-border/10">
                                    {typeof row[col] === 'object' && row[col] !== null
                                      ? JSON.stringify(row[col])
                                      : String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start animate-in fade-in zoom-in duration-500">
              <div className="flex max-w-[75%] gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-dark-secondary border border-accent-blue/40 flex items-center justify-center shadow-glow animate-pulse">
                  <Sparkles className="w-4 h-4 text-accent-blue" />
                </div>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-blue to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative px-5 py-3 bg-glass-primary/80 backdrop-blur-xl border border-glass-border rounded-2xl rounded-tl-none flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce"></span>
                    </div>
                    <span className="text-xs font-medium bg-gradient-to-r from-accent-blue to-purple-400 bg-clip-text text-transparent animate-pulse">
                      La IA está analizando los datos...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-glass-border" style={{backgroundColor: 'var(--surface-glass-secondary)'}}>
          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-bottom-1 duration-500">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => setInput(suggestion.text)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue border border-accent-blue/20 hover:bg-accent-blue/20 transition-colors flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3 h-3" />
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className={cn(
            "relative flex items-center gap-2 p-1 rounded-xl transition-all duration-500",
            isLoading && "animate-rainbow-loading border-2 border-transparent"
          )}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Haz una pregunta sobre tus ventas o clientes..."
              className="flex-1 glass-input border border-glass-border rounded-xl px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all pr-12"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={handleCancel}
                className="absolute right-2 p-2 rounded-lg bg-accent-red text-white shadow-glow hover:bg-accent-red/80 transition-all"
                title="Detener generación"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                </div>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={cn(
                  "absolute right-2 p-2 rounded-lg transition-all",
                  input.trim()
                    ? "bg-accent-blue text-white shadow-glow hover:scale-105"
                    : "bg-glass-border text-text-muted cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </form>
          <p className="text-[10px] text-center text-text-muted mt-3">
            Impulsado por Gemini AI • Las respuestas se basan en los datos actuales de tu empresa.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes rainbow-burst {
          0% { border-color: #3b82f6; box-shadow: 0 0 10px #3b82f6, inset 0 0 5px #3b82f6; }
          20% { border-color: #8b5cf6; box-shadow: 0 0 20px #8b5cf6, inset 0 0 10px #8b5cf6; }
          40% { border-color: #ec4899; box-shadow: 0 0 30px #ec4899, inset 0 0 15px #ec4899; }
          60% { border-color: #06b6d4; box-shadow: 0 0 20px #06b6d4, inset 0 0 10px #06b6d4; }
          100% { border-color: rgba(255,255,255,0.1); box-shadow: 0 0 0px transparent; }
        }
        @keyframes rainbow-boom {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes rainbow-loading {
          0% { border-color: #3b82f6; }
          33% { border-color: #ec4899; }
          66% { border-color: #8b5cf6; }
          100% { border-color: #3b82f6; }
        }
        @keyframes mirror-shine {
          0% { left: -150%; }
          100% { left: 150%; }
        }
        .animate-rainbow-burst {
          animation: rainbow-burst 4s ease-out forwards;
        }
        .animate-rainbow-burst::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, #3b82f6, #ec4899, transparent);
          border-radius: inherit;
          animation: rainbow-boom 1.5s ease-out forwards;
        }
        .animate-rainbow-loading {
          animation: rainbow-loading 2s linear infinite;
        }
        .animate-mirror-shine::after {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          width: 200px;
          height: 100%;
          background: linear-gradient(
            110deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transform: skewX(-20deg);
          animation: mirror-shine 0.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  )
}
