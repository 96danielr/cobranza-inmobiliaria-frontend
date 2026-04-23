'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Filter,
  Building2,
  FileCheck2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TableRowSkeleton } from '@/components/ui/LoadingSpinner'
import { portalApi } from '@/lib/portalApi'
import { formatCurrency, cn } from '@/lib/utils'

export default function MyPaymentsPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await portalApi.getPayments()
        if (response.data.success) {
          setPayments(response.data.data.payments)
        }
      } catch (error) {
        console.error('Error fetching my payments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  const filteredPayments = payments.filter((p: any) => 
    p.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.amount.toString().includes(searchTerm)
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-3.5 h-3.5" />
      case 'pending': return <Clock className="w-3.5 h-3.5" />
      case 'rejected': return <XCircle className="w-3.5 h-3.5" />
      default: return <Clock className="w-3.5 h-3.5" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Completado'
      case 'pending': return 'En Revisión'
      case 'rejected': return 'Rechazado'
      default: return status
    }
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Page Header Premium matching Admin Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-glass-border pb-8 animate-fade-in-up">
        <div>
          <div className="flex items-center space-x-2 text-accent-purple mb-2">
            <CreditCard className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gestión Financiera</span>
          </div>
          <h1 className="text-responsive-2xl font-bold text-text-primary tracking-tighter">Historial de Pagos</h1>
          <p className="text-text-secondary mt-2 text-sm max-w-md">
            Consulta el estado de tus abonos y descarga los recibos oficiales emitidos por tesorería.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto animate-fade-in-up animate-fade-in-up-delay">
          <div className="relative flex-1 md:w-80 group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-accent-blue transition-colors">
                <Search className="w-4 h-4" />
             </div>
             <input 
                type="text"
                placeholder="Buscar por referencia o monto..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-secondary/50 border border-glass-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-accent-blue/50 focus:ring-4 focus:ring-accent-blue/10 transition-all outline-none"
             />
          </div>
          <Button variant="glass" className="h-[52px] w-[52px] rounded-2xl flex-shrink-0">
             <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Payments Table/Grid matching Admin Style */}
      <Card variant="elevated" className="overflow-hidden rounded-[2rem] border-glass-border shadow-2xl animate-fade-in-up animate-fade-in-up-delay">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-dark-secondary/30">
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-glass-border">Fecha Contable</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-glass-border">Concepto y Detalle</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-glass-border">Monto Abanado</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-glass-border">Estado Actual</th>
                <th className="px-8 py-6 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-glass-border text-right">Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border/50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center space-y-4">
                       <div className="w-16 h-16 bg-dark-primary rounded-full flex items-center justify-center border border-dashed border-glass-border">
                          <CreditCard className="w-8 h-8 text-text-disabled opacity-30" />
                       </div>
                       <p className="text-text-muted font-bold uppercase tracking-widest text-xs">No se encontraron movimientos</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment: any) => (
                  <tr key={payment._id} className="hover:bg-accent-blue/5 transition-all duration-300 group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-dark-primary rounded-lg border border-glass-border">
                           <Calendar className="w-4 h-4 text-text-muted" />
                        </div>
                        <span className="text-sm font-bold text-text-primary">
                          {new Date(payment.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-text-primary group-hover:text-accent-blue transition-colors">
                          {payment.referencia || 'Pago de Cuota Lote'}
                        </span>
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                          Canal: {payment.metodoPago || 'Consignación'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-2">
                        {payment.status === 'approved' ? (
                           <ArrowUpCircle className="w-4 h-4 text-accent-green opacity-50" />
                        ) : (
                           <Clock className="w-4 h-4 text-accent-yellow opacity-50" />
                        )}
                        <span className="text-base font-black text-text-primary tracking-tight">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-widest",
                        payment.status === 'approved' ? 'bg-accent-green/10 text-accent-green border-accent-green/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]' :
                        payment.status === 'pending' ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/20' :
                        'bg-accent-red/10 text-accent-red border-accent-red/20'
                      )}>
                        <span className="mr-2">{getStatusIcon(payment.status)}</span>
                        {getStatusLabel(payment.status)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {payment.status === 'approved' ? (
                        <Button variant="glass" size="sm" className="h-10 px-5 text-[10px] font-black uppercase tracking-widest border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white transition-all rounded-xl">
                          <Download className="w-3.5 h-3.5 mr-2" /> Descargar
                        </Button>
                      ) : (
                        <div className="flex items-center justify-end space-x-2 text-[10px] text-text-muted font-bold italic">
                           <span>Validando...</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Financial Security Banner */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card variant="elevated" className="md:col-span-2 bg-gradient-to-r from-dark-secondary to-dark-primary border-glass-border p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <FileCheck2 className="w-32 h-32" />
            </div>
            <div className="flex items-start space-x-6">
               <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center flex-shrink-0 border border-accent-blue/20">
                  <FileText className="w-8 h-8 text-accent-blue" />
               </div>
               <div>
                  <h4 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-2">Sobre la emisión de recibos</h4>
                  <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                    Cada vez que realizas un pago, nuestro departamento financiero realiza un cruce bancario. Una vez confirmado, se emite un recibo oficial numerado que podrás descargar desde aquí.
                  </p>
               </div>
            </div>
         </Card>
         <Card variant="elevated" className="bg-accent-blue/5 border-accent-blue/20 p-8 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-accent-blue/20 rounded-full flex items-center justify-center mb-4">
               <Building2 className="w-6 h-6 text-accent-blue" />
            </div>
            <h5 className="font-black text-text-primary uppercase text-sm mb-2 tracking-tighter">Seguridad Inmobiliaria</h5>
            <p className="text-[11px] text-text-secondary">Tus transacciones están protegidas por protocolos de encriptación bancaria.</p>
         </Card>
      </section>
    </div>
  )
}
