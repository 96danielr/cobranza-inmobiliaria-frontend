'use client'

import { useState, useEffect } from 'react'
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { adminApi } from '@/lib/adminApi'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuditLog {
  _id: string
  userId: {
    _id: string
    fullName: string
    email: string
  }
  action: string
  module: string
  details: any
  ipAddress: string
  userAgent: string
  createdAt: string
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    module: ''
  })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getSystemLogs(
        page,
        20,
        filters.search,
        filters.action,
        filters.module
      )
      if (response.data.success) {
        setLogs(response.data.data.logs)
        setTotalPages(response.data.data.totalPages)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cargar los logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, filters.action, filters.module])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  return (
    <div className="space-y-6 px-1 py-2 md:p-6 pb-20 lg:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary flex items-center gap-3">
            <div className="p-2 bg-accent-blue/20 rounded-xl">
              <ScrollText className="w-6 h-6 text-accent-blue" />
            </div>
            Logs del Sistema
          </h1>
          <p className="text-text-secondary mt-1">Auditabilidad de acciones administrativas críticas</p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="glass-card border-glass-border overflow-visible">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-text-muted group-focus-within:text-accent-blue transition-colors" />
              </div>
              <Input
                placeholder="Buscar por usuario o detalles..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 glass-input"
              />
            </div>

            <div className="relative group">
              <select
                value={filters.module}
                onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                className="w-full h-[46px] glass-input appearance-none pl-10 cursor-pointer"
              >
                <option value="">Todos los Módulos</option>
                <option value="LOTS">Lotes</option>
                <option value="SALES">Ventas</option>
                <option value="PAYMENTS">Pagos</option>
                <option value="CLIENTS">Clientes</option>
                <option value="AUTH">Seguridad</option>
              </select>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Activity className="h-4 w-4 text-text-muted group-focus-within:text-accent-blue transition-colors" />
              </div>
            </div>

            <Button type="submit" className="glass-button bg-accent-blue text-white hover:bg-accent-blue/80 h-[46px]">
              Actualizar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Logs Table Card */}
      <Card className="glass-card border-glass-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-dark-secondary/50 border-b border-glass-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Fecha / Hora</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Módulo</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Acción</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-8">
                      <div className="w-full h-4 bg-glass-primary rounded-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No se encontraron logs que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={log._id}
                    className="hover:bg-glass-primary/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">
                          {dayjs(log.createdAt).format('DD/MM/YYYY')}
                        </span>
                        <span className="text-xs text-text-muted">
                          {dayjs(log.createdAt).format('HH:mm:ss')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-accent-purple" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-text-primary truncate">
                            {log.userId?.fullName || 'Sistema'}
                          </span>
                          <span className="text-xs text-text-muted truncate">
                            {log.userId?.email || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                        log.module === 'PAYMENTS' ? "bg-accent-green/10 border-accent-green/20 text-accent-green" :
                          log.module === 'SALES' ? "bg-accent-blue/10 border-accent-blue/20 text-accent-blue" :
                            log.module === 'LOTS' ? "bg-accent-purple/10 border-accent-purple/20 text-accent-purple" :
                              "bg-glass-primary border-glass-border text-text-muted"
                      )}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[300px]">
                        <p className="text-xs text-text-muted line-clamp-2 italic">
                          {JSON.stringify(log.details)}
                        </p>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-dark-secondary/30 border-t border-glass-border flex items-center justify-between">
            <span className="text-sm text-text-muted">
              Página <span className="font-bold text-text-primary">{page}</span> de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="glass-button"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="glass-button"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Footer Info */}
      <div className="flex items-center gap-2 p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl">
        <Info className="w-4 h-4 text-accent-blue shrink-0" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Este registro es inmutable y captura todas las actividades críticas. Los cambios en estados de pago, precios de lotes y asignaciones son auditados para seguridad del sistema.
        </p>
      </div>
    </div>
  )
}
