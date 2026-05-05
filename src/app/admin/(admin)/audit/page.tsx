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
  Info,
  Clock,
  Shield,
  Box
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { adminApi } from '@/lib/adminApi'
import dayjs from 'dayjs'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuditLog {
  _id: string
  userId: string
  userFullName: string
  userEmail: string
  role: string
  action: string
  module: string
  targetId: string
  details: any
  ip: string
  userAgent: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    startDate: '',
    endDate: ''
  })
  const [metadata, setMetadata] = useState<{modules: string[], actions: string[]}>({
    modules: [],
    actions: []
  })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getAuditLogs({
        page,
        limit: 15,
        ...filters
      })
      if (response.data.success) {
        setLogs(response.data.data)
        setTotalPages(response.data.pagination.pages)
        setTotalLogs(response.data.pagination.total)
      }
    } catch (error: any) {
      console.error('Error fetching audit logs:', error)
      toast.error('Error al cargar el registro de auditoría')
    } finally {
      setLoading(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const response = await adminApi.getAuditMetadata()
      if (response.data.success) {
        setMetadata(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching audit metadata:', error)
    }
  }

  useEffect(() => {
    fetchMetadata()
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [page, filters.module, filters.action])

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'LOTS': return 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue'
      case 'PAYMENTS': return 'bg-accent-green/10 border-accent-green/20 text-accent-green'
      case 'CLIENTS': return 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple'
      case 'CONTRACTS': return 'bg-accent-yellow/10 border-accent-yellow/20 text-accent-yellow'
      default: return 'bg-white/5 border-white/10 text-text-secondary'
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 px-1 py-2 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-responsive-xl font-bold text-text-primary mb-2">
            Registro de <span className="gradient-text">Auditoría</span>
          </h1>
          <p className="text-text-secondary text-responsive-base">
            Historial detallado de todas las acciones críticas realizadas en el sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 flex items-center gap-2 border-accent-blue/20">
            <Activity className="w-4 h-4 text-accent-blue" />
            <span className="text-sm font-bold text-text-primary">{totalLogs} Eventos</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card variant="interactive" className="overflow-visible">
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Box className="w-3 h-3" /> Módulo
              </label>
              <select
                value={filters.module}
                onChange={(e) => { setFilters({...filters, module: e.target.value}); setPage(1); }}
                className="glass-input w-full min-h-[44px] px-3 cursor-pointer"
              >
                <option value="">Todos los módulos</option>
                {metadata.modules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3 h-3" /> Acción
              </label>
              <select
                value={filters.action}
                onChange={(e) => { setFilters({...filters, action: e.target.value}); setPage(1); }}
                className="glass-input w-full min-h-[44px] px-3 cursor-pointer"
              >
                <option value="">Todas las acciones</option>
                {metadata.actions.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Fecha Inicio
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters({...filters, startDate: e.target.value}); setPage(1); }}
                className="glass-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Fecha Fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters({...filters, endDate: e.target.value}); setPage(1); }}
                className="glass-input"
              />
            </div>
          </div>
          {(filters.module || filters.action || filters.startDate || filters.endDate) && (
            <div className="mt-4 flex justify-end">
              <Button 
                variant="glass" 
                size="sm" 
                onClick={() => { setFilters({module:'', action:'', startDate:'', endDate:''}); setPage(1); }}
                className="text-accent-red hover:bg-accent-red/10"
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 w-full bg-white/5 rounded-2xl animate-pulse border border-white/10" />
          ))
        ) : logs.length === 0 ? (
          <div className="text-center py-20 glass-card">
            <ScrollText className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-20" />
            <p className="text-text-secondary">No hay registros que coincidan con los criterios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode='popLayout'>
              {logs.map((log) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={log._id}
                >
                  <Card className="glass-card border-glass-border hover:bg-white/5 transition-all overflow-hidden">
                    <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                      {/* Left: Time and User */}
                      <div className="md:w-1/4 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-text-primary">
                          <Clock className="w-4 h-4 text-accent-blue" />
                          <span className="text-sm font-bold">
                            {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center text-[10px] font-bold text-accent-purple">
                            {log.userFullName.slice(0,1)}
                          </div>
                          <span className="text-xs font-medium text-text-secondary truncate max-w-[150px]">
                            {log.userFullName}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Action and Module */}
                      <div className="md:w-1/4 flex flex-col gap-2">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border self-start",
                          getModuleColor(log.module)
                        )}>
                          {log.module}
                        </span>
                        <span className="text-sm font-bold text-text-primary">
                          {log.action}
                        </span>
                      </div>

                      {/* Right: Details */}
                      <div className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                          <div className="text-xs text-text-secondary font-mono break-all">
                            {typeof log.details === 'object' 
                              ? Object.entries(log.details).map(([k, v]) => (
                                  <div key={k} className="inline-block mr-3">
                                    <span className="text-text-muted">{k}:</span> <span className="text-text-primary">{String(v)}</span>
                                  </div>
                                ))
                              : String(log.details)
                            }
                            {log.targetId && (
                              <div className="mt-1 text-[10px] opacity-50">
                                Target ID: {log.targetId}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* IP / Agent Info */}
                      <div className="hidden lg:flex flex-col items-end gap-1 opacity-40">
                         <div className="flex items-center gap-1 text-[10px]">
                           <Shield className="w-3 h-3" />
                           {log.ip}
                         </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-8">
            <Button
              variant="glass"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="glass-button"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-bold text-text-primary">
              {page} / {totalPages}
            </span>
            <Button
              variant="glass"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="glass-button"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Security Disclaimer */}
      <div className="bg-accent-blue/5 border border-accent-blue/10 p-4 rounded-2xl flex items-start gap-3">
        <Shield className="w-5 h-5 text-accent-blue shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          Este registro de auditoría es inmutable para garantizar la integridad de los datos. 
          Todas las acciones administrativas, cambios de precios, eliminaciones y aprobaciones de pagos quedan registradas permanentemente con la identidad del usuario responsable.
        </p>
      </div>
    </div>
  )
}
