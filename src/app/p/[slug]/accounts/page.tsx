'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CreditCard,
  Copy,
  Check,
  ArrowRight,
  Info,
  Building,
  DollarSign,
  QrCode,
  FileText,
  Loader2,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { apiPublic } from '@/lib/api'
import toast from 'react-hot-toast'

interface BankAccount {
  _id: string
  banco: string
  tipoCuenta: string
  numeroCuenta: string
  titular?: string
  qrCode?: string
  isActive: boolean
}

interface CompanyPublicData {
  name: string
  nit?: string
  phone?: string
  email?: string
  logo?: string
  bankAccounts: BankAccount[]
}

export default function PublicAccountsPage() {
  const { slug } = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<CompanyPublicData | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [isQrZoomed, setIsQrZoomed] = useState(false)

  useEffect(() => {
    fetchCompanyAccounts()
  }, [slug])

  const fetchCompanyAccounts = async () => {
    if (!slug) return
    setLoading(true)
    try {
      const response = await apiPublic.getCompanyAccounts(slug as string)
      if (response.data.success) {
        const data = response.data.data
        setCompany(data)
        // Auto-select first active account if available
        if (data.bankAccounts && data.bankAccounts.length > 0) {
          setSelectedAccount(data.bankAccounts[0])
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar las cuentas de la empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('¡Número de cuenta copiado!')
    setTimeout(() => {
      setCopiedIndex(null)
    }, 2000)
  }

  const handleGoToReportPayment = () => {
    router.push(`/p/${slug}/payments`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-accent-blue mx-auto" />
          <p className="text-text-secondary text-sm font-medium animate-pulse">Cargando cuentas autorizadas de pago...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4">
        <Card variant="elevated" className="border-glass-border glass-effect max-w-md w-full p-6 text-center">
          <Info className="w-12 h-12 text-accent-red mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2 font-display">Empresa no encontrada</h2>
          <p className="text-text-secondary text-sm mb-6">
            El enlace que ingresaste no corresponde a ninguna empresa activa en nuestro sistema. Por favor verifica e intenta de nuevo.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-start p-4 md:p-8 relative">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-accent-blue/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="w-full max-w-4xl space-y-6 md:space-y-8 animate-fade-in-up mt-4 md:mt-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-4">
          {company.logo ? (
            <div className="w-20 h-20 bg-white/90 rounded-2xl flex items-center justify-center p-2 border border-glass-border shadow-lg shadow-glass-primary/10">
              <img 
                src={company.logo} 
                alt={company.name} 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-accent-blue/20 rounded-2xl flex items-center justify-center border border-accent-blue/30 shadow-lg shadow-accent-blue/5">
              <Building className="w-8 h-8 text-accent-blue" />
            </div>
          )}
          
          <div className="space-y-1">
            <h1 className="text-responsive-2xl md:text-3xl font-bold text-text-primary tracking-tight font-display">
              {company.name}
            </h1>
            <p className="text-text-secondary text-sm">
              {company.nit ? `NIT: ${company.nit}` : 'Cuentas de Recaudo Oficiales'}
            </p>
          </div>
        </div>

        {/* Main Content Layout */}
        {!company.bankAccounts || company.bankAccounts.length === 0 ? (
          <Card variant="elevated" className="border-glass-border glass-effect max-w-lg mx-auto p-8 text-center">
            <CreditCard className="w-14 h-14 text-text-disabled mx-auto mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">No hay cuentas bancarias configuradas</h3>
            <p className="text-text-secondary text-sm">
              Esta empresa no ha registrado cuentas de pago públicas en su configuración todavía. Por favor contáctalos directamente para realizar tu pago.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Column: Bank Selection */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted px-1">
                Selecciona tu Banco de Preferencia
              </h3>
              
              <div className="space-y-3">
                {company.bankAccounts.map((acc, index) => {
                  const isSelected = selectedAccount?._id === acc._id
                  return (
                    <div
                      key={acc._id}
                      onClick={() => setSelectedAccount(acc)}
                      className={`
                        p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.98]
                        ${isSelected 
                          ? 'bg-accent-blue/15 border-accent-blue/50 shadow-md shadow-accent-blue/5' 
                          : 'bg-glass-primary/10 border-glass-border hover:bg-glass-primary/20 hover:border-glass-border/70'
                        }
                      `}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-base transition-colors ${isSelected ? 'text-accent-blue' : 'text-text-primary group-hover:text-text-primary'}`}>
                            {acc.banco}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                            ${acc.tipoCuenta === 'Ahorros' 
                              ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' 
                              : 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                            }
                          `}>
                            {acc.tipoCuenta}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary font-mono">
                          No. ****{acc.numeroCuenta.slice(-4)}
                        </p>
                      </div>
                      
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all
                        ${isSelected 
                          ? 'border-accent-blue bg-accent-blue text-white' 
                          : 'border-glass-border text-transparent group-hover:border-glass-border/80'
                        }
                      `}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick Report Payment Callout */}
              <Card variant="elevated" className="border-glass-border bg-glass-primary/5 p-4 mt-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-green/20 flex items-center justify-center shrink-0 border border-accent-green/30 mt-0.5">
                    <FileText className="w-4 h-4 text-accent-green" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-text-primary">¿Ya realizaste tu pago?</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Una vez que transfieras, reporta tu comprobante para que la administración apruebe tu cuota de inmediato.
                    </p>
                    <button
                      onClick={handleGoToReportPayment}
                      className="text-[11px] text-accent-green hover:underline font-bold flex items-center gap-1 mt-1 group"
                    >
                      Reportar pago ahora
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Account Details & QR code */}
            <div className="lg:col-span-7">
              {selectedAccount ? (
                <Card variant="elevated" className="border-glass-border glass-effect h-full flex flex-col justify-between overflow-hidden">
                  
                  {/* Account Metadata */}
                  <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-glass-border pb-6">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                          Banco Seleccionado
                        </span>
                        <h2 className="text-2xl font-bold text-text-primary">
                          {selectedAccount.banco}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border
                          ${selectedAccount.tipoCuenta === 'Ahorros' 
                            ? 'bg-accent-blue/15 text-accent-blue border-accent-blue/20' 
                            : 'bg-accent-purple/15 text-accent-purple border-accent-purple/20'
                          }
                        `}>
                          Cuenta de {selectedAccount.tipoCuenta}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Account Details */}
                      <div className="space-y-4">
                        <div className="space-y-1.5 p-4 rounded-xl border border-glass-border bg-glass-primary/10 relative group">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                            Número de Cuenta
                          </label>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-lg font-bold text-text-primary select-all tracking-wide font-mono">
                              {selectedAccount.numeroCuenta}
                            </span>
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={() => handleCopy(selectedAccount.numeroCuenta, 1)}
                              className="p-2 min-h-[36px] min-w-[36px] hover:bg-glass-primary/30 transition-all border border-glass-border/30"
                            >
                              {copiedIndex === 1 ? (
                                <Check className="w-4 h-4 text-accent-green" />
                              ) : (
                                <Copy className="w-4 h-4 text-text-secondary group-hover:text-text-primary" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {selectedAccount.titular && (
                          <div className="space-y-1 p-4 rounded-xl border border-glass-border bg-glass-primary/10">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                              Titular / Destinatario
                            </span>
                            <span className="text-base font-semibold text-text-primary block">
                              {selectedAccount.titular}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2.5 items-start text-xs text-text-secondary leading-relaxed p-1">
                          <Info className="w-4 h-4 text-accent-blue shrink-0 mt-0.5" />
                          <span>
                            Asegúrate de verificar bien el número de cuenta y titular antes de transferir. Guarda el comprobante para reportarlo.
                          </span>
                        </div>
                      </div>

                      {/* Right: QR Code Visualizer */}
                      <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-glass-border bg-glass-primary/5">
                        {selectedAccount.qrCode ? (
                          <div className="space-y-3 w-full text-center">
                            <div 
                              onClick={() => setIsQrZoomed(true)}
                              className="relative group mx-auto w-48 h-48 bg-white p-2 rounded-2xl border border-glass-border shadow-xl shadow-accent-blue/10 flex items-center justify-center overflow-hidden cursor-zoom-in active:scale-95 transition-all"
                            >
                              <img 
                                src={selectedAccount.qrCode} 
                                alt={`QR para pago a ${selectedAccount.banco}`} 
                                className="w-full h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <span className="text-[11px] bg-black/80 text-white font-bold px-3 py-1.5 rounded-full uppercase tracking-wider scale-90 group-hover:scale-100 transition-all duration-300">
                                  Ampliar QR
                                </span>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-glass-primary/15 px-2.5 py-1 rounded-full border border-glass-border/30">
                              <QrCode className="w-3.5 h-3.5 text-accent-blue animate-pulse" />
                              Haz clic para ampliar QR
                            </span>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-text-disabled space-y-2">
                            <QrCode className="w-12 h-12 mx-auto opacity-30" />
                            <p className="text-xs text-text-muted">
                              Esta cuenta no requiere escaneo QR. Realiza la transferencia con los datos provistos.
                            </p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Sticky report payment call to action */}
                  <div className="p-6 md:p-8 bg-glass-primary/10 border-t border-glass-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-accent-green" />
                      <span className="text-sm font-semibold text-text-primary">
                        Reporte rápido desde celular o PC
                      </span>
                    </div>
                    
                    <Button
                      onClick={handleGoToReportPayment}
                      className="w-full sm:w-auto h-12 px-6 text-sm font-bold glass-button bg-accent-green/20 text-accent-green border-accent-green/30 hover:bg-accent-green/30 shadow-lg shadow-accent-green/5"
                    >
                      Reportar mi Pago
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                </Card>
              ) : (
                <div className="h-full flex items-center justify-center p-12 text-center text-text-muted border border-dashed border-glass-border rounded-2xl bg-glass-primary/5">
                  Selecciona una cuenta a la izquierda para visualizar los datos.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Zoomed QR Code Modal Overlay */}
      {isQrZoomed && selectedAccount && selectedAccount.qrCode && (
        <div 
          onClick={() => setIsQrZoomed(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm w-full bg-white p-6 rounded-3xl border border-glass-border shadow-2xl flex flex-col items-center gap-4 animate-scale-in text-center"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-black/50">
                {selectedAccount.banco}
              </span>
              <h4 className="text-lg font-bold text-black">
                Código QR de Pago
              </h4>
            </div>

            <div className="w-64 h-64 bg-white p-2 rounded-2xl border border-black/10 shadow-inner flex items-center justify-center">
              <img 
                src={selectedAccount.qrCode} 
                alt="QR ampliado" 
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-black/60">
              Escanea con tu aplicación bancaria preferida para pagar.
            </p>
          </div>
        </div>
      )}

      {/* Premium footer branding */}
      <footer className="mt-12 md:mt-20 py-6 text-text-muted text-xs flex items-center gap-2 italic">
        <CreditCard className="w-4 h-4 text-accent-blue" />
        Canales Autorizados por {company.name} • 100% Seguro
      </footer>
    </div>
  )
}
