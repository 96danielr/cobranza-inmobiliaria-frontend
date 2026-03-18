'use client'

import { useState } from 'react'
import { 
  Search,
  Plus,
  Edit,
  Trash2,
  Building2,
  Map,
  Layers,
  Maximize,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'

interface Lot {
  _id: string
  stage: string
  nomenclature: string
  lotNumber: string
  area: number
  createdAt: string
}

export default function LotsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    stage: '',
    nomenclature: '',
    lotNumber: '',
    area: ''
  })

  const fetchLots = async (page: number, limit: number, search?: string) => {
    // Debug: trazar cada carga de datos para identificar patrones de llamadas
    console.time(`fetchLots page=${page} limit=${limit} search=${search || ''}`)
    try {
      const response = await adminApi.getLots(page, limit, search)
      if (!response.data.success) {
        throw new Error('Error loading lots')
      }

      const result = {
        data: response.data.data.lots || [],
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit,
        pages: response.data.data.pagination.pages
      }
      console.timeEnd(`fetchLots page=${page} limit=${limit} search=${search || ''}`)
      return result
    } catch (error) {
      console.error('Error fetching lots:', error)
      throw error
    }
  }

  const pagination = useServerPagination({
    fetchData: fetchLots,
    initialLimit: 20
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await adminApi.createLot({
        ...formData,
        area: formData.area ? parseFloat(formData.area) : undefined
      })

      if (response.data.success) {
        toast.success('Lote creado correctamente')
        setIsCreateModalOpen(false)
        setFormData({ stage: '', nomenclature: '', lotNumber: '', area: '' })
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error al crear el lote')
      }
    } catch (error) {
      console.error('Error creating lot:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLot = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este lote?')) return

    try {
      const response = await adminApi.deleteLot(id)
      if (response.data.success) {
        toast.success('Lote eliminado')
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar el lote')
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Gestión de Lotes</h1>
          <p className="text-text-secondary mt-2">
            Administra el inventario de lotes y terrenos disponibles
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lote
          </Button>
        </div>
      </div>

      {/* Quick Stats (Optional, simplified for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up animate-fade-in-up-delay">
        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent-blue/20 backdrop-blur-sm rounded-full border border-glass-border">
                <Layers className="w-6 h-6 text-accent-blue" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary font-medium">Total Lotes</p>
                <p className="text-responsive-xl font-bold text-text-primary">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card variant="interactive" className="animate-fade-in-up animate-fade-in-up-delay">
        <CardContent className="p-4 md:p-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por etapa, nomenclatura o número de lote..."
              value={pagination.search}
              onChange={(e) => pagination.handleSearch(e.target.value)}
              className="glass-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lots Table */}
      <Card variant="elevated" className="flex-1 flex flex-col min-h-0 animate-fade-in-up animate-fade-in-up-delay">
        <div className="flex-1 overflow-y-auto min-h-[400px] max-h-[600px] relative">
          <div className="hidden lg:block">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-glass-primary backdrop-blur-glass shadow-sm">
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary border-x border-glass-border">Etapa</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary border-r border-glass-border">Nomenclatura</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary border-r border-glass-border">Número Lote</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary border-r border-glass-border">Área (m²)</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary border-r border-glass-border w-40">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={5} />
                  ))
                ) : pagination.total === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-muted">
                      <div className="flex flex-col items-center space-y-3">
                        <Building2 className="w-12 h-12 text-text-disabled" />
                        <p className="text-lg font-medium">No hay lotes registrados</p>
                        <p className="text-sm">Agrega un nuevo lote para comenzar el inventario</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagination.data.map((lot: Lot) => (
                    <tr key={lot._id} className="border-b border-glass-border hover:bg-glass-primary/20 transition-colors">
                      <td className="py-3 px-4 md:px-6 border-x border-glass-border text-text-primary font-medium">
                        {lot.stage || '-'}
                      </td>
                      <td className="py-3 px-4 md:px-6 border-r border-glass-border text-text-secondary">
                        {lot.nomenclature || '-'}
                      </td>
                      <td className="py-3 px-4 md:px-6 border-r border-glass-border text-text-secondary">
                        {lot.lotNumber || '-'}
                      </td>
                      <td className="py-3 px-4 md:px-6 border-r border-glass-border text-text-secondary">
                        {lot.area ? `${lot.area} m²` : '-'}
                      </td>
                      <td className="py-3 px-4 md:px-6 border-r border-glass-border">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="glass-button min-h-[40px] min-w-[40px] text-accent-blue"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLot(lot._id)}
                            className="glass-button min-h-[40px] min-w-[40px] text-accent-red hover:bg-accent-red/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden p-4 space-y-4">
            {pagination.loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24">
                    <div className="h-full bg-glass-primary/20 rounded-lg"></div>
                  </CardContent>
                </Card>
              ))
            ) : pagination.data.map((lot: Lot) => (
              <Card key={lot._id} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-text-primary">{lot.stage} - {lot.lotNumber}</h3>
                      <p className="text-sm text-text-secondary">Nomenclatura: {lot.nomenclature}</p>
                      <p className="text-sm text-text-secondary">Área: {lot.area} m²</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="glass-button">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteLot(lot._id)} className="glass-button text-accent-red">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {!pagination.loading && pagination.pages > 1 && (
          <div className="flex-shrink-0 border-t border-glass-border p-4">
            <PaginationControls
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onPageChange={pagination.goToPage}
              onLimitChange={pagination.changeLimit}
            />
          </div>
        )}
      </Card>

      {/* Lot Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registar Nuevo Lote"
        size="md"
      >
        <form onSubmit={handleCreateLot} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Etapa</label>
              <Input
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                placeholder="Ej: ETAPA 1"
                required
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Nomenclatura</label>
              <Input
                name="nomenclature"
                value={formData.nomenclature}
                onChange={handleInputChange}
                placeholder="Ej: 42"
                required
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Número de Lote</label>
              <Input
                name="lotNumber"
                value={formData.lotNumber}
                onChange={handleInputChange}
                placeholder="Ej: 275-2"
                required
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Área (m²)</label>
              <Input
                name="area"
                type="number"
                value={formData.area}
                onChange={handleInputChange}
                placeholder="Ej: 120"
                className="glass-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-glass-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
              className="glass-button"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="glass-button bg-accent-blue text-white hover:bg-accent-blue/80"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Lote'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
