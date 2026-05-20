'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Users, 
  Home, 
  CheckCircle, 
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Award,
  ChevronRight,
  Filter,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Wallet
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatsCardSkeleton } from '@/components/ui/LoadingSpinner'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  Legend,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface ProjectionData {
  year: number
  month: number
  monthName: string
  label: string
  expectedAmount: number
  count: number
}

interface LotStat {
  stage: string
  total: number
  vendidos: number
  disponibles: number
  separados: number
  apartados: number
  porcentajeVendido: number
  projectName: string
}

interface SalesReportData {
  salesThisMonth: number
  topAdvisor: {
    id: string
    name: string
    count: number
  } | null
  separatedLots: number
  lotStats: LotStat[]
}

interface AgingBucket {
  amount: number
  count: number
}

interface AgingData {
  bucket30: AgingBucket
  bucket60: AgingBucket
  bucket90: AgingBucket
  bucketOver90: AgingBucket
}

interface ComparisonData {
  year: number
  month: number
  monthName: string
  label: string
  expectedAmount: number
  realAmount: number
}

interface DelinquentClient {
  clientId: string
  clientName: string
  clientDocument: string
  lotNumber: string
  lotStage: string
  lateAmount: number
  lateQuotasCount: number
}

interface BestClient {
  clientId: string
  clientName: string
  clientDocument: string
  lotNumber: string
  lotStage: string
  onTimeRate: number
  paidQuotasCount: number
  totalPaidAmount: number
}

interface AdvancedReportData {
  aging: AgingData
  comparison: ComparisonData[]
  delinquentClients: DelinquentClient[]
  bestClients: BestClient[]
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'finance'>('sales')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SalesReportData | null>(null)
  const [projection, setProjection] = useState<ProjectionData[]>([])
  const [projectionMonths, setProjectionMonths] = useState(6)
  const [loadingProjection, setLoadingProjection] = useState(false)

  // New Reports State
  const [advancedData, setAdvancedData] = useState<AdvancedReportData | null>(null)
  const [loadingAdvanced, setLoadingAdvanced] = useState(false)

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getSalesReport()
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      toast.error('Error al cargar el informe de ventas')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjection = async (months: number) => {
    try {
      setLoadingProjection(true)
      const response = await adminApi.getCashFlowProjection(months)
      if (response.data.success) {
        setProjection(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching projection:', error)
    } finally {
      setLoadingProjection(false)
    }
  }

  const fetchAdvancedReport = async () => {
    try {
      setLoadingAdvanced(true)
      const response = await adminApi.getAdvancedReports()
      if (response.data.success) {
        setAdvancedData(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching advanced report:', error)
      toast.error('Error al cargar informes de cartera y cobros')
    } finally {
      setLoadingAdvanced(false)
    }
  }

  useEffect(() => {
    fetchReport()
    fetchProjection(projectionMonths)
    fetchAdvancedReport()
  }, [])

  useEffect(() => {
    fetchProjection(projectionMonths)
  }, [projectionMonths])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-white/10 rounded-lg mb-4"></div>
          <div className="h-6 w-96 bg-white/5 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full bg-white/5 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 px-1 py-2 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-text-primary mb-2">
            Módulo de <span className="gradient-text">Reportes</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Análisis comercial, proyección de recaudos, cartera morosa y comportamiento de pago.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="glass" size="sm" onClick={() => { fetchReport(); fetchAdvancedReport(); }} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Actualizar Datos
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-gray-100 dark:bg-glass-primary/30 backdrop-blur-sm p-1 rounded-2xl border border-gray-200 dark:border-glass-border self-start w-full max-w-md">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'sales' 
              ? 'bg-blue-600 dark:bg-accent-blue text-white shadow-md' 
              : 'text-gray-500 hover:text-gray-900 dark:text-text-secondary dark:hover:text-text-primary'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Ventas y Etapas
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'finance' 
              ? 'bg-blue-600 dark:bg-accent-blue text-white shadow-md' 
              : 'text-gray-500 hover:text-gray-900 dark:text-text-secondary dark:hover:text-text-primary'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Cartera y Recaudos
        </button>
      </div>

      {/* TAB 1: SALES & STAGE INVENTORY */}
      {activeTab === 'sales' && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="interactive" className="stats-card stats-blue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-text-secondary font-medium mb-1">Ventas del Mes</p>
                    <p className="text-3xl font-bold text-text-primary">{data?.salesThisMonth || 0}</p>
                  </div>
                  <div className="glass-card p-3 border-accent-blue/20">
                    <TrendingUp className="w-6 h-6 text-accent-blue" />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-accent-blue font-medium">Contratos formalizados este mes</span>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive" className="stats-card stats-purple">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium mb-1">Top Asesor</p>
                    <p className="text-xl font-bold text-text-primary truncate">
                      {data?.topAdvisor?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="glass-card p-3 border-accent-purple/20">
                    <Award className="w-6 h-6 text-accent-purple" />
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-accent-purple mr-1" />
                  <span className="text-sm text-accent-purple font-medium">
                    {data?.topAdvisor?.count || 0} ventas realizadas
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive" className="stats-card stats-yellow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-text-secondary font-medium mb-1">Lotes Separados</p>
                    <p className="text-3xl font-bold text-text-primary">{data?.separatedLots || 0}</p>
                  </div>
                  <div className="glass-card p-3 border-accent-yellow/20">
                    <Users className="w-6 h-6 text-accent-yellow" />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-accent-yellow font-medium">En proceso de cierre</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Projection Chart */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-accent-blue" />
                <h2 className="text-xl font-bold text-text-primary">Proyección de Recaudos Futuros</h2>
              </div>
              <div className="flex bg-glass-primary/30 backdrop-blur-sm p-1 rounded-xl border border-glass-border self-start">
                {[3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setProjectionMonths(m)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      projectionMonths === m 
                        ? 'bg-accent-blue text-white shadow-glow-sm' 
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {m} meses
                  </button>
                ))}
              </div>
            </div>

            <Card variant="elevated" className="overflow-hidden animate-fade-in">
              <CardContent className="p-6">
                <div className="h-[300px] w-full">
                  {loadingProjection ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(8px)'
                          }}
                          formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Recaudo Esperado']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="expectedAmount" 
                          stroke="var(--accent-blue)" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorExpected)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-accent-blue/30 border border-accent-blue"></div>
                    <span>Estimación basada en cuotas pendientes y en mora</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Status */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-accent-blue" />
              <h2 className="text-xl font-bold text-text-primary">Estado por Etapa</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {data?.lotStats.map((stat, index) => (
                <Card key={`${stat.projectName}-${stat.stage}`} variant="elevated" className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      {/* Left info */}
                      <div className="lg:col-span-4 p-6 bg-white/5 border-b lg:border-b-0 lg:border-r border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-accent-blue/20 rounded-lg">
                            <Home className="w-5 h-5 text-accent-blue" />
                          </div>
                          <div>
                            <h3 className="font-bold text-text-primary text-lg">{stat.projectName}</h3>
                            <p className="text-sm text-text-secondary">Etapa: {stat.stage}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">Progreso de Ventas</span>
                            <span className="text-sm font-bold text-accent-green">{formatPercentage(stat.porcentajeVendido)}</span>
                          </div>
                          <ProgressBar 
                            value={stat.porcentajeVendido} 
                            glow={true}
                            size="md" 
                            showLabel={false}
                            className="shadow-glow-sm"
                          />
                        </div>
                      </div>

                      {/* Right stats */}
                      <div className="lg:col-span-8 p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                          <div className="text-center">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Total Lotes</p>
                            <p className="text-2xl font-bold text-text-primary">{stat.total}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Vendidos</p>
                            <p className="text-2xl font-bold text-accent-green">{stat.vendidos}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Disponibles</p>
                            <p className="text-2xl font-bold text-accent-blue">{stat.disponibles}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Separados</p>
                            <p className="text-2xl font-bold text-accent-yellow">{stat.separados}</p>
                          </div>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                            <span className="text-xs text-text-secondary">{stat.apartados} Apartados</span>
                          </div>
                          <div className="ml-auto">
                            <Button variant="glass" size="sm" className="group-hover:translate-x-1 transition-transform">
                              Ver detalles <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {data?.lotStats.length === 0 && (
                <div className="text-center py-20 glass-card">
                  <PieChartIcon className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-20" />
                  <p className="text-text-secondary">No hay datos disponibles para mostrar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PORTFOLIO AGING & REVENUE PERFORMANCE */}
      {activeTab === 'finance' && (
        <div className="space-y-8 animate-fade-in">
          {loadingAdvanced ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
              <div className="h-80 bg-white/5 rounded-2xl animate-pulse" />
            </div>
          ) : (
            <>
              {/* Cartera por Edades (Aging Portfolio) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-accent-blue" />
                  <h2 className="text-xl font-bold text-text-primary">Estado de Cartera Vencida (Edad de Cartera)</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* 30 days */}
                  <Card variant="interactive" className="stats-card stats-green">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Mora 1 a 30 Días</p>
                          <h3 className="text-2xl font-extrabold text-text-primary mt-1">
                            {formatCurrency(advancedData?.aging.bucket30.amount || 0)}
                          </h3>
                        </div>
                        <div className="glass-card px-2.5 py-1 rounded-full text-xs font-bold border-accent-green/20">
                          <span className="text-accent-green font-bold">
                            {advancedData?.aging.bucket30.count || 0} cuotas
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 60 days */}
                  <Card variant="interactive" className="stats-card stats-yellow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Mora 31 a 60 Días</p>
                          <h3 className="text-2xl font-extrabold text-text-primary mt-1">
                            {formatCurrency(advancedData?.aging.bucket60.amount || 0)}
                          </h3>
                        </div>
                        <div className="glass-card px-2.5 py-1 rounded-full text-xs font-bold border-accent-yellow/20">
                          <span className="text-accent-yellow font-bold">
                            {advancedData?.aging.bucket60.count || 0} cuotas
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 90 days */}
                  <Card variant="interactive" className="stats-card stats-purple">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Mora 61 a 90 Días</p>
                          <h3 className="text-2xl font-extrabold text-text-primary mt-1">
                            {formatCurrency(advancedData?.aging.bucket90.amount || 0)}
                          </h3>
                        </div>
                        <div className="glass-card px-2.5 py-1 rounded-full text-xs font-bold border-accent-purple/20">
                          <span className="text-accent-purple font-bold">
                            {advancedData?.aging.bucket90.count || 0} cuotas
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* > 90 days */}
                  <Card variant="interactive" className="stats-card stats-red">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold mb-1">Mora de más de 90 Días</p>
                          <h3 className="text-2xl font-extrabold text-text-primary mt-1">
                            {formatCurrency(advancedData?.aging.bucketOver90.amount || 0)}
                          </h3>
                        </div>
                        <div className="glass-card px-2.5 py-1 rounded-full text-xs font-bold border-accent-red/20">
                          <span className="text-accent-red font-bold">
                            {advancedData?.aging.bucketOver90.count || 0} cuotas
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Esperado VS Recaudado Real (Revenue performance) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-accent-green" />
                  <h2 className="text-xl font-bold text-text-primary">Esperado por Recaudar VS Recaudado Real (Últimos 6 Meses)</h2>
                </div>

                <Card className="glass-card p-6">
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={advancedData?.comparison} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="label" 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '16px',
                            backdropFilter: 'blur(12px)',
                            color: '#ffffff'
                          }}
                          formatter={(value: any, name: any) => [
                            formatCurrency(Number(value) || 0), 
                            name === 'expectedAmount' ? 'Monto Programado (Esperado)' : 'Recaudado Real del Mes'
                          ]}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={40} 
                          iconType="circle"
                          formatter={(value) => value === 'expectedAmount' ? 'Programado (Esperado)' : 'Recaudado Real'}
                        />
                        <Bar dataKey="expectedAmount" fill="#3b82f6" name="expectedAmount" radius={[6, 6, 0, 0]} maxBarSize={45} />
                        <Bar dataKey="realAmount" fill="#10b981" name="realAmount" radius={[6, 6, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-blue"></div>
                      <span><strong>Esperado:</strong> Valor planificado de cuotas vigentes para el mes correspondiente.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent-green"></div>
                      <span><strong>Recaudado Real:</strong> Pagos efectivamente aprobados/recaudados durante dicho mes.</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Clientes Morosos VS Mejor Comportamiento */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Clientes más Morosos */}
                <Card className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-glass-border flex items-center justify-between bg-accent-red/5">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-accent-red" />
                      <h3 className="font-extrabold text-text-primary text-base">Clientes más Morosos</h3>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-accent-red/20 text-accent-red">
                      Top 10 Cartera Vencida
                    </span>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-glass-border/30 text-text-secondary text-xs uppercase bg-white/2">
                            <th className="px-5 py-3.5 font-semibold">Cliente</th>
                            <th className="px-5 py-3.5 font-semibold">Lote / Etapa</th>
                            <th className="px-5 py-3.5 font-semibold text-right">Cuotas Vencidas</th>
                            <th className="px-5 py-3.5 font-semibold text-right">Monto en Mora</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/10">
                          {advancedData?.delinquentClients.map((client) => (
                            <tr key={client.clientId} className="hover:bg-white/2 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-bold text-text-primary">{client.clientName}</div>
                                <div className="text-xs text-text-muted">{client.clientDocument}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-text-secondary">Lote {client.lotNumber}</div>
                                <div className="text-xs text-text-muted">{client.lotStage}</div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-accent-red/15 text-accent-red">
                                  {client.lateQuotasCount} cuotas
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-black text-accent-red">
                                {formatCurrency(client.lateAmount)}
                              </td>
                            </tr>
                          ))}
                          {(!advancedData || advancedData.delinquentClients.length === 0) && (
                            <tr>
                              <td colSpan={4} className="px-5 py-10 text-center text-text-muted">
                                No se encontraron clientes en mora. ¡Felicitaciones!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Clientes con Mejor Comportamiento */}
                <Card className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-glass-border flex items-center justify-between bg-accent-green/5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-accent-green" />
                      <h3 className="font-extrabold text-text-primary text-base">Mejor Comportamiento de Pago</h3>
                    </div>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-accent-green/20 text-accent-green">
                      Top 10 Clientes Cumplidos
                    </span>
                  </div>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-glass-border/30 text-text-secondary text-xs uppercase bg-white/2">
                            <th className="px-5 py-3.5 font-semibold">Cliente</th>
                            <th className="px-5 py-3.5 font-semibold">Lote / Etapa</th>
                            <th className="px-5 py-3.5 font-semibold text-right">Pagos a Tiempo</th>
                            <th className="px-5 py-3.5 font-semibold text-right">Total Aportado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-border/10">
                          {advancedData?.bestClients.map((client) => (
                            <tr key={client.clientId} className="hover:bg-white/2 transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-bold text-text-primary">{client.clientName}</div>
                                <div className="text-xs text-text-muted">{client.clientDocument}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-text-secondary">Lote {client.lotNumber}</div>
                                <div className="text-xs text-text-muted">{client.lotStage}</div>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                                  client.onTimeRate >= 90 
                                    ? 'bg-accent-green/15 text-accent-green' 
                                    : 'bg-accent-yellow/15 text-accent-yellow'
                                }`}>
                                  {client.onTimeRate.toFixed(0)}% a tiempo
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-black text-accent-green">
                                {formatCurrency(client.totalPaidAmount)}
                              </td>
                            </tr>
                          ))}
                          {(!advancedData || advancedData.bestClients.length === 0) && (
                            <tr>
                              <td colSpan={4} className="px-5 py-10 text-center text-text-muted">
                                No hay suficientes datos para establecer el ranking.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
