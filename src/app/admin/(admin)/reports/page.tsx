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
  Filter
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

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SalesReportData | null>(null)
  const [projection, setProjection] = useState<ProjectionData[]>([])
  const [projectionMonths, setProjectionMonths] = useState(6)
  const [loadingProjection, setLoadingProjection] = useState(false)

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

  useEffect(() => {
    fetchReport()
    fetchProjection(projectionMonths)
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
            Informe de <span className="gradient-text">Ventas</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Seguimiento detallado de comercialización y estado de inventario.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="glass" size="sm" onClick={fetchReport} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Este Mes
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </div>

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
            <h2 className="text-xl font-bold text-text-primary">Proyección de Recaudos</h2>
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

        <Card variant="elevated" className="overflow-hidden">
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
                      formatter={(value: number) => [formatCurrency(value), 'Recaudo Esperado']}
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
  )
}
