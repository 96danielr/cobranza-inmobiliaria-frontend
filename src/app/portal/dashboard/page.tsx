'use client'

import { useState, useEffect } from 'react'
import { 
  Map, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  BadgeDollarSign,
  MessageCircle,
  Phone,
  Building2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatsCardSkeleton } from '@/components/ui/LoadingSpinner'
import { portalApi } from '@/lib/portalApi'
import Link from 'next/link'
import { formatCurrency, cn } from '@/lib/utils'

export default function PortalDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await portalApi.getSummary()
        if (response.data.success) {
          setData(response.data.data)
        }
      } catch (error) {
        console.error('Error fetching portal summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          <StatsCardSkeleton className="h-96" />
          <div className="space-y-6">
             <StatsCardSkeleton className="h-48" />
             <StatsCardSkeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Welcome Banner - Simplified and Focused */}
      <section className="relative overflow-hidden rounded-[2rem] bg-dark-secondary border border-glass-border p-8 md:p-12 shadow-glow">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent-blue/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 bg-accent-blue/20 text-accent-blue text-[10px] font-black uppercase tracking-widest rounded-full border border-accent-blue/30">
                Cliente Activo
              </span>
              <div className="flex items-center space-x-1 text-accent-green">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Portal Seguro</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-text-primary mb-4 leading-tight">
              Hola, <span className="gradient-text">{data?.clientName?.split(' ')[0]}</span>. <br />
              <span className="text-2xl md:text-3xl opacity-80">Bienvenido a tu portal de pagos.</span>
            </h1>
            <p className="text-text-secondary text-base max-w-lg">
              Aquí puedes revisar el estado de tus lotes, descargar tus recibos y reportar tus pagos de forma rápida y sencilla.
            </p>
          </div>
          <div className="flex-shrink-0">
             <div className="glass-card p-6 border-accent-blue/30 flex flex-col items-center justify-center text-center shadow-xl">
                <p className="text-[10px] text-text-muted font-black uppercase mb-1">Mis Lotes</p>
                <p className="text-4xl font-black text-accent-blue mb-2">{data?.lotsCount || 0}</p>
                <div className="h-1 w-12 bg-accent-blue/30 rounded-full" />
             </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card variant="interactive" className="group">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 bg-accent-blue/10 rounded-[20px] text-accent-blue group-hover:bg-accent-blue/20 transition-colors duration-300">
                <Map className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Mis Terrenos</p>
                <p className="text-3xl font-black text-text-primary mt-1">{data?.lotsCount || 0}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-1.5 w-full bg-glass-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent-blue w-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              </div>
              <Link href="/portal/lots" className="flex items-center justify-center w-full py-3 glass-button text-xs font-bold uppercase tracking-wider group-hover:border-accent-blue/50 transition-all">
                Ver mis lotes <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card variant="interactive" className="group">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 bg-accent-green/10 rounded-[20px] text-accent-green group-hover:bg-accent-green/20 transition-colors duration-300">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Pagado</p>
                <p className="text-2xl font-black text-text-primary mt-1">{formatCurrency(data?.totalInvested || 0)}</p>
              </div>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <span>Estado de Cuenta</span>
                  <span className="text-accent-green">Al día</span>
               </div>
               <div className="h-1.5 w-full bg-glass-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent-green w-[75%] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              </div>
              <p className="text-center text-[10px] text-text-muted italic">Suma de abonos realizados</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="interactive" className="group lg:col-span-1 md:col-span-2">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 bg-accent-purple/10 rounded-[20px] text-accent-purple group-hover:bg-accent-purple/20 transition-colors duration-300">
                <BadgeDollarSign className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Últimos Pagos</p>
                <p className="text-3xl font-black text-text-primary mt-1">{data?.recentPayments?.length || 0}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-1.5 w-full bg-glass-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent-purple w-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              </div>
              <Link href="/portal/payments" className="flex items-center justify-center w-full py-3 glass-button text-xs font-bold uppercase tracking-wider group-hover:border-accent-purple/50 transition-all">
                Historial de Pagos <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Payments Table */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="p-8 pb-0 flex items-center justify-between">
            <h3 className="font-black text-text-primary flex items-center text-xl uppercase tracking-tighter">
              <Clock className="w-6 h-6 mr-3 text-accent-blue" />
              Pagos Recientes
            </h3>
            <Link href="/portal/payments">
              <Button variant="outline" size="sm" className="text-[10px] uppercase font-black">Ver todo</Button>
            </Link>
          </div>
          <CardContent className="p-8">
            <div className="space-y-4">
              {data?.recentPayments && data.recentPayments.length > 0 ? (
                data.recentPayments.map((payment: any) => (
                  <div key={payment._id} className="group flex items-center justify-between p-5 glass-card border-glass-border hover:border-accent-blue/30 hover:bg-accent-blue/5 transition-all duration-300">
                    <div className="flex items-center space-x-5">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                        payment.status === 'approved' ? 'bg-accent-green/10 text-accent-green' : 
                        payment.status === 'pending' ? 'bg-accent-yellow/10 text-accent-yellow' : 'bg-accent-red/10 text-accent-red'
                      )}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-text-primary leading-tight">{formatCurrency(payment.amount)}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1">
                          Ref: {payment.referencia || 'Pago Regular'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted font-bold uppercase mb-1">{new Date(payment.createdAt).toLocaleDateString()}</p>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-md border",
                        payment.status === 'approved' ? 'text-accent-green border-accent-green/20 bg-accent-green/5' : 
                        payment.status === 'pending' ? 'text-accent-yellow border-accent-yellow/20 bg-accent-yellow/5' : 
                        'text-accent-red border-accent-red/20 bg-accent-red/5'
                      )}>
                        {payment.status === 'approved' ? 'Aprobado' : payment.status === 'pending' ? 'En Revisión' : 'Rechazado'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-dark-primary/30 rounded-3xl border border-dashed border-glass-border">
                  <div className="flex flex-col items-center space-y-4">
                     <CreditCard className="w-12 h-12 text-text-disabled" />
                     <p className="text-text-muted font-medium italic">Aún no tienes pagos registrados.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Help Center */}
        <div className="space-y-8">
          <Card variant="elevated" className="bg-gradient-to-br from-accent-blue to-accent-purple text-white border-none shadow-glow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <BadgeDollarSign className="w-32 h-32" />
            </div>
            <CardContent className="p-10 relative z-10">
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">¿Hiciste un abono?</h3>
              <p className="text-white/80 text-base mb-8 font-medium leading-relaxed">
                Reporta tu comprobante para que podamos validar tu pago y emitir tu recibo oficial.
              </p>
              <Link href="/reportar-pago" target="_blank">
                <Button className="bg-white text-accent-blue hover:bg-dark-primary hover:text-white font-black px-8 py-6 rounded-2xl text-base shadow-xl transition-all duration-300">
                  Reportar Pago <ExternalLink className="w-5 h-5 ml-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="interactive" className="border-accent-green/20">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-accent-green/10 rounded-2xl text-accent-green">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-text-primary uppercase tracking-tighter">WhatsApp Soporte</h4>
                </div>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">¿Dudas con tu pago? Escríbenos.</p>
                <Button variant="outline" className="w-full border-accent-green/30 text-accent-green hover:bg-accent-green/10 font-bold py-5 rounded-xl">
                   Chatear ahora
                </Button>
              </CardContent>
            </Card>

            <Card variant="interactive" className="border-accent-blue/20">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-text-primary uppercase tracking-tighter">Atención al Cliente</h4>
                </div>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">Llámanos para resolver tus inquietudes.</p>
                <Button variant="outline" className="w-full border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10 font-bold py-5 rounded-xl">
                   Llamar ahora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
