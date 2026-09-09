'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { QrCode, Link as LinkIcon, Download, Check, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface SharePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
  subtitle?: string
}

export function SharePaymentModal({
  isOpen,
  onClose,
  url,
  title = 'Compartir con Clientes',
  subtitle = 'Selecciona cómo deseas compartir el acceso con tus clientes:'
}: SharePaymentModalProps) {
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link')

  useEffect(() => {
    if (url && isOpen) {
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then((dataUri) => setQrDataUrl(dataUri))
        .catch((err) => console.error('Error generating QR:', err))
    }
  }, [url, isOpen])

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('¡Enlace copiado al portapapeles!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('No se pudo copiar automáticamente. Por favor copia el texto manualmente.')
    }
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'codigo-qr-pago-clientes.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Código QR descargado exitosamente')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-5 p-1">
        <p className="text-xs text-text-secondary leading-relaxed">
          {subtitle}
        </p>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-glass-primary/10 border border-glass-border rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'link'
                ? 'bg-accent-blue/25 text-accent-blue shadow-sm border border-accent-blue/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-glass-primary/5'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Compartir Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'qr'
                ? 'bg-accent-purple/25 text-accent-purple shadow-sm border border-accent-purple/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-glass-primary/5'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Compartir QR
          </button>
        </div>

        {/* LINK OPTION */}
        {activeTab === 'link' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-glass-primary/15 border border-glass-border space-y-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Enlace público directo
              </span>
              <div className="p-2.5 rounded-lg bg-dark-secondary/60 border border-glass-border/40 font-mono text-xs text-accent-blue break-all select-all">
                {url}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCopy}
              className="w-full glass-button bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue border-accent-blue/40 min-h-[44px] font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-accent-green" />
                  ¡Copiado con éxito!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Enlace
                </>
              )}
            </Button>
          </div>
        )}

        {/* QR OPTION */}
        {activeTab === 'qr' && (
          <div className="space-y-4 animate-fade-in flex flex-col items-center">
            <div className="p-4 bg-white rounded-2xl border-2 border-accent-purple/40 shadow-xl flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Código QR para pago de clientes"
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-text-muted text-xs">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="text-center text-xs text-text-muted max-w-xs">
              Tus clientes pueden escanear este código con la cámara de su celular para abrir directamente la página de pagos.
            </p>

            <div className="w-full grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="glass-button border-glass-border text-text-secondary min-h-[42px] text-xs font-semibold"
              >
                <Copy className="w-4 h-4 mr-1.5" />
                Copiar Link
              </Button>
              <Button
                type="button"
                onClick={handleDownloadQr}
                className="glass-button bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple border-accent-purple/40 min-h-[42px] text-xs font-semibold"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Descargar QR
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
