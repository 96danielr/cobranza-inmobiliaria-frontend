'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Users,
  Clock,
  Phone,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { StatsCardSkeleton, ChartPlaceholder, QuickActionSkeleton } from '@/components/ui/LoadingSpinner'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { useClientStore } from '@/stores/clientStore'
import toast from 'react-hot-toast'




import { Button } from '@/components/ui/Button'

export default function AdminDashboard() {
  const { admin, isAuthenticated } = useAdminAuthStore()
    const [data, setData] = useState({
    cartera: { valorTotalCartera: 0, totalRecaudado: 0, totalPendiente: 0, porcentajeRecaudo: 0 },
    mora: { totalContratosActivos: 0, contratosAlDia: 0, contratosMora1a15: 0, contratosMora16a30: 0, contratosMora31a60: 0, contratosMora60plus: 0, porcentajeMora: 0, dineroEnMora: 0 },
    recaudoMensual: { mesActual: 0, mesAnterior: 0, variacion: 0 },
    operacion: { comprobantesPendientes: 0, clientesEscalados: 0, whatsappEnviadosMes: 0, llamadasAIMes: 0 },
    totalSales: 0,
    isSeller: false
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [actionsLoading, setActionsLoading] = useState(true)
  const [clientStats, setClientStats] = useState({
    total: 0,
    dispuestos: 0,
    indecisos: 0,
    evasivos: 0,
    noDefinido: 0
  })
  const [recaudoMensualData, setRecaudoMensualData] = useState([])
  const [moraData, setMoraData] = useState([])
  const [adminUsersCount, setAdminUsersCount] = useState(0)
  const isFetching = useRef(false)

  const { clients, fetchClientsIfNeeded, totalClients: storeTotal } = useClientStore()

  // Load real dashboard data
  const loadDashboardData = async () => {
    if (!isAuthenticated || isFetching.current) return
    
    isFetching.current = true
    try {
      setLoading(true)
      setStatsLoading(true)
      setChartsLoading(true)
      setActionsLoading(true)
      
      // Load dashboard summary, ensuring client store is hydrated
      const [dashboardResponse, recaudoResponse] = await Promise.all([
        adminApi.getDashboardSummary(),
        adminApi.getRecaudoMensual(),
        fetchClientsIfNeeded() // Use store to fetch/cache clients
      ])
      
      if (dashboardResponse.data.success) {
        const dashboardData = dashboardResponse.data.data
        setData({
          cartera: dashboardData.cartera,
          mora: dashboardData.mora,
          recaudoMensual: dashboardData.recaudoMensual,
          operacion: dashboardData.operacion,
          totalSales: dashboardData.totalSales || 0,
          isSeller: dashboardData.isSeller || false
        })

        // Optimized: get total count directly from summary
        setClientStats(prev => ({
          ...prev,
          total: dashboardData.totalClients || storeTotal
        }))
        
        // Create mora chart data from real data
        setMoraData([
          { name: 'Al día', value: Number(dashboardData.mora.contratosAlDia) || 0, color: '#10b981' },
          { name: '1-15 días', value: Number(dashboardData.mora.contratosMora1a15) || 0, color: '#f59e0b' },
          { name: '16-30 días', value: Number(dashboardData.mora.contratosMora16a30) || 0, color: '#f97316' },
          { name: '31-60 días', value: Number(dashboardData.mora.contratosMora31a60) || 0, color: '#ef4444' },
          { name: '+60 días', value: Number(dashboardData.mora.contratosMora60plus) || 0, color: '#991b1b' }
        ] as any)
      }

      if (recaudoResponse.data.success) {
        const recaudoData = recaudoResponse.data.data
        const chartData = recaudoData.data.slice(-6).map((item: any) => ({
          mes: item.mes.substring(0, 3),
          recaudado: item.recaudado,
          meta: item.meta
        }))
        setRecaudoMensualData(chartData)
      }

      // Show success toast with unique ID to prevent duplicates
      toast.success('Dashboard cargado con datos reales', { id: 'dashboard-load-success' })

      // Update behavior stats using cached store data
      if (clients.length > 0) {
        setClientStats({
          total: storeTotal,
          dispuestos: clients.filter(c => c.behavior === 'DISPUESTO').length,
          indecisos: clients.filter(c => c.behavior === 'INDECISO').length,
          evasivos: clients.filter(c => c.behavior === 'EVASIVO').length,
          noDefinido: clients.filter(c => !c.behavior || c.behavior === 'N/A').length
        })
      }

      // Simulate staggered loading for better UX
      setTimeout(() => setStatsLoading(false), 300)
      setTimeout(() => setChartsLoading(false), 600) 
      setTimeout(() => setActionsLoading(false), 900)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Only show error for standard admins since superadmins don't use this data
      if (admin?.role !== 'superadmin') {
        toast.error('Error cargando datos del dashboard')
      }
    } finally {
      isFetching.current = false
      setTimeout(() => {
        setLoading(false)
        setStatsLoading(false)
        setChartsLoading(false)
        setActionsLoading(false)
      }, 1000)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      if (admin?.role === 'superadmin') {
        adminApi.getAdminUsers().then(res => {
          if (res.data.success) setAdminUsersCount(res.data.data.admins.length)
        })
      } else if (!isFetching.current) {
        loadDashboardData()
      }
    }
  }, [isAuthenticated, admin])

  // Calculate real behavior data
  const realComportamientoData = [
    { 
      name: 'Dispuestos', 
      value: clientStats.total > 0 ? Math.round((clientStats.dispuestos / clientStats.total) * 100) : 0, 
      count: clientStats.dispuestos,
      color: '#10b981' 
    },
    { 
      name: 'Indecisos', 
      value: clientStats.total > 0 ? Math.round((clientStats.indecisos / clientStats.total) * 100) : 0, 
      count: clientStats.indecisos,
      color: '#f59e0b' 
    },
    { 
      name: 'Evasivos', 
      value: clientStats.total > 0 ? Math.round((clientStats.evasivos / clientStats.total) * 100) : 0, 
      count: clientStats.evasivos,
      color: '#ef4444' 
    },
    { 
      name: 'No definido', 
      value: clientStats.total > 0 ? Math.round((clientStats.noDefinido / clientStats.total) * 100) : 0, 
      count: clientStats.noDefinido,
      color: '#94a3b8' 
    }
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 shadow-glass-hover">
          <p className="font-medium text-text-primary">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name.includes('meta') || entry.name.includes('recaudado') 
                ? formatCurrency(entry.value) 
                : formatNumber(entry.value)
              }
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (admin?.role === 'superadmin') {
    return (
      <div className="space-y-6 md:space-y-8 p-4 md:p-6">
        <div className="animate-fade-in-up">
          <h1 className="text-responsive-xl font-bold text-text-primary mb-3">
            Bienvenido, <span className="gradient-text">{admin.fullName}</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Panel de control para S. Administrador
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up-delay">
          <Card variant="interactive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary font-medium mb-1">Administradores</p>
                  <p className="text-3xl font-bold text-text-primary">{adminUsersCount}</p>
                </div>
                <div className="glass-card p-3 border-accent-purple/20">
                  <Users className="w-6 h-6 text-accent-purple" />
                </div>
              </div>
              <Link href="/admin/users">
                <Button variant="glass" size="sm" className="w-full">
                  Gestionar Usuarios
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-text-secondary font-medium mb-1">Estado del Sistema</p>
                  <p className="text-3xl font-bold text-accent-green">Activo</p>
                </div>
                <div className="glass-card p-3 border-accent-green/20">
                  <Clock className="w-6 h-6 text-accent-green" />
                </div>
              </div>
              <p className="text-xs text-text-secondary">
                Todos los servicios operando normalmente
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      <div className="animate-fade-in-up">
        <h1 className="text-responsive-xl font-bold text-text-primary mb-3">
          <span className="gradient-text">
            {data.isSeller ? 'Mi Resumen de Ventas' : 'Dashboard Administrativo'}
          </span>
        </h1>
        <p className="text-text-secondary text-responsive-base">
          {data.isSeller 
            ? `Has realizado ${data.totalSales} ventas y gestionas ${clientStats.total} clientes`
            : `Resumen general del sistema de cobranza inmobiliaria (${clientStats.total} clientes registrados)`
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up-delay">
        {statsLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card variant="interactive">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium mb-1">
                      {data.isSeller ? 'Valor de mis Ventas' : 'Ventas Totales'}
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-text-primary leading-tight">
                      {formatCurrency(data.cartera.valorTotalCartera)}
                    </p>
                  </div>
                  <div className="glass-card p-3 border-accent-blue/20">
                    <DollarSign className="w-6 h-6 text-accent-blue" />
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-accent-green mr-1" />
                  <span className="text-sm text-accent-green font-medium">
                    {formatPercentage(data.cartera.porcentajeRecaudo)} de mi cartera recaudada
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium mb-1">Recaudo Mensual</p>
                    <p className="text-lg md:text-2xl font-bold text-text-primary leading-tight">
                      {formatCurrency(data.recaudoMensual.mesActual)}
                    </p>
                  </div>
                  <div className="glass-card p-3 border-accent-green/20">
                    <ArrowUpRight className="w-6 h-6 text-accent-green" />
                  </div>
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-accent-green mr-1" />
                  <span className="text-sm text-accent-green font-medium">
                    +{formatPercentage(data.recaudoMensual.variacion)} vs mes anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium mb-1">Dinero en Mora</p>
                    <p className="text-lg md:text-2xl font-bold text-text-primary leading-tight">
                      {formatCurrency(data.mora.dineroEnMora)}
                    </p>
                  </div>
                  <div className="glass-card p-3 border-accent-red/20">
                    <AlertTriangle className="w-6 h-6 text-accent-red" />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-accent-red font-medium">
                    {formatPercentage(data.mora.porcentajeMora)} de contratos en mora
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary font-medium mb-1">
                      {data.isSeller ? 'Mis Contratos' : 'Contratos Activos'}
                    </p>
                    <p className="text-lg md:text-2xl font-bold text-text-primary leading-tight">
                      {formatNumber(data.totalSales)}
                    </p>
                  </div>
                  <div className="glass-card p-3 border-accent-purple/20">
                    <FileText className="w-6 h-6 text-accent-purple" />
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-accent-green font-medium">
                    {formatNumber(clientStats.total)} clientes individuales
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up-delay-2">
        {chartsLoading ? (
          <>
            <ChartPlaceholder title="Recaudo Mensual vs Meta" />
            <ChartPlaceholder title="Estado de Contratos" />
          </>
        ) : (
          <>
            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recaudo Mensual vs Meta</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recaudoMensualData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="mes" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="recaudado" fill="#60a5fa" name="Recaudado" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="meta" fill="rgba(255,255,255,0.1)" name="Meta" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-4 md:p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Estado de Contratos</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moraData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {moraData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up-delay-3">
        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Comportamiento Clientes</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={realComportamientoData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, value, count }: any) => `${name} ${count} (${value}%)`}
                  >
                    {realComportamientoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} clientes`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Operaciones del Mes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-accent-blue mr-3" />
                  <span className="text-sm text-text-primary">Comprobantes Pendientes</span>
                </div>
                <span className="text-base font-semibold text-text-primary">
                  {data.operacion.comprobantesPendientes}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-accent-red mr-3" />
                  <span className="text-sm text-text-primary">Clientes Escalados</span>
                </div>
                <span className="text-base font-semibold text-text-primary">
                  {data.operacion.clientesEscalados}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 text-accent-green mr-3" />
                  <span className="text-sm text-text-primary">WhatsApp Enviados</span>
                </div>
                <span className="text-base font-semibold text-text-primary">
                  {formatNumber(data.operacion.whatsappEnviadosMes)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 glass-button rounded-xl">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-accent-purple mr-3" />
                  <span className="text-sm text-text-primary">Llamadas AI</span>
                </div>
                <span className="text-base font-semibold text-text-primary">
                  {formatNumber(data.operacion.llamadasAIMes)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {actionsLoading ? (
          <Card variant="elevated">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Acciones Rápidas</h3>
              <QuickActionSkeleton count={4} />
            </CardContent>
          </Card>
        ) : (
          <Card variant="elevated">
            <CardContent className="p-4 md:p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Link
                  href="/admin/payments"
                  className="flex items-center p-3 text-left w-full glass-button rounded-xl hover:shadow-glow transition-all duration-300 group"
                >
                  <div className="p-2 bg-accent-blue/20 rounded-lg mr-3 group-hover:bg-accent-blue/30 transition-colors">
                    <FileText className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div className="min-h-[44px] flex flex-col justify-center">
                    <p className="font-medium text-text-primary">Revisar Pagos</p>
                    <p className="text-sm text-text-secondary">{data.operacion.comprobantesPendientes} pendientes</p>
                  </div>
                </Link>

                <Link
                  href="/admin/clients"
                  className="flex items-center p-3 text-left w-full glass-button rounded-xl hover:shadow-glow transition-all duration-300 group"
                >
                  <div className="p-2 bg-accent-yellow/20 rounded-lg mr-3 group-hover:bg-accent-yellow/30 transition-colors">
                    <Users className="w-5 h-5 text-accent-yellow" />
                  </div>
                  <div className="min-h-[44px] flex flex-col justify-center">
                    <p className="font-medium text-text-primary">Clientes Escalados</p>
                    <p className="text-sm text-text-secondary">{data.operacion.clientesEscalados} requieren atención</p>
                  </div>
                </Link>

                <Link
                  href="/admin/collections"
                  className="flex items-center p-3 text-left w-full glass-button rounded-xl hover:shadow-glow transition-all duration-300 group"
                >
                  <div className="p-2 bg-accent-green/20 rounded-lg mr-3 group-hover:bg-accent-green/30 transition-colors">
                    <MessageSquare className="w-5 h-5 text-accent-green" />
                  </div>
                  <div className="min-h-[44px] flex flex-col justify-center">
                    <p className="font-medium text-text-primary">Nueva Cobranza</p>
                    <p className="text-sm text-text-secondary">Enviar mensajes masivos</p>
                  </div>
                </Link>

                <Link
                  href="/admin/import"
                  className="flex items-center p-3 text-left w-full glass-button rounded-xl hover:shadow-glow transition-all duration-300 group"
                >
                  <div className="p-2 bg-accent-purple/20 rounded-lg mr-3 group-hover:bg-accent-purple/30 transition-colors">
                    <FileText className="w-5 h-5 text-accent-purple" />
                  </div>
                  <div className="min-h-[44px] flex flex-col justify-center">
                    <p className="font-medium text-text-primary">Importar Datos</p>
                    <p className="text-sm text-text-secondary">Cargar archivo Excel</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}