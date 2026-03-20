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
  Loader2,
  ImagePlus,
  DollarSign,
  Link,
  Copy,
  ExternalLink,
  X,
  ImageIcon
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import toast from 'react-hot-toast'

interface Lot {
  _id: string
  stage: string
  nomenclature: string
  lotNumber: string
  area: number
  price?: number
  images?: string[]
  createdAt: string
}

export default function LotsPage() {
  const { selectedCompanyId } = useAdminAuthStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    _id: '',
    stage: '',
    nomenclature: '',
    lotNumber: '',
    area: '',
    price: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const fetchLots = async (page: number, limit: number, search?: string) => {
    try {
      const response = await adminApi.getLots(page, limit, search)
      if (!response.data.success) {
        throw new Error('Error loading lots')
      }

      return {
        data: response.data.data.lots || [],
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit,
        pages: response.data.data.pagination.pages
      }
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

  const handleCreateOrUpdateLot = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload = {
        ...formData,
        area: formData.area ? parseFloat(formData.area) : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined
      }

      let response
      if (formData._id) {
        response = await adminApi.updateLot(formData._id, payload)
      } else {
        response = await adminApi.createLot(payload)
      }

      if (response.data.success) {
        toast.success(formData._id ? 'Lote actualizado' : 'Lote creado correctamente')
        setIsCreateModalOpen(false)
        resetForm()
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error en la operación')
      }
    } catch (error) {
      console.error('Error saving lot:', error)
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ _id: '', stage: '', nomenclature: '', lotNumber: '', area: '', price: '' })
  }

  const handleEdit = (lot: Lot) => {
    setFormData({
      _id: lot._id,
      stage: lot.stage || '',
      nomenclature: lot.nomenclature || '',
      lotNumber: lot.lotNumber || '',
      area: lot.area?.toString() || '',
      price: lot.price?.toString() || ''
    })
    setIsCreateModalOpen(true)
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

  const openImageModal = (lot: Lot) => {
    setSelectedLot(lot)
    setSelectedFiles([])
    setIsImageModalOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUploadImages = async () => {
    if (!selectedLot || selectedFiles.length === 0) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('images', file)
      })

      const response = await adminApi.uploadLotImages(selectedLot._id, formData)
      if (response.data.success) {
        toast.success('Imágenes subidas correctamente')
        setIsImageModalOpen(false)
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error al subir imágenes')
      }
    } catch (error) {
      toast.error('Error al subir imágenes')
    } finally {
      setIsUploading(false)
    }
  }

  const copyCatalogLink = () => {
    if (!selectedCompanyId) return
    const link = `${window.location.origin}/catalog/${selectedCompanyId}`
    navigator.clipboard.writeText(link)
    toast.success('Enlace del catálogo copiado')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Gestión de Lotes</h1>
          <p className="text-text-secondary mt-2">
            Administra el inventario de lotes, precios e imágenes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={copyCatalogLink}
            variant="outline"
            className="glass-button min-h-[44px]"
          >
            <Link className="w-4 h-4 mr-2 text-accent-green" />
            Link Catálogo
          </Button>
          <Button 
            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
            className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lote
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up animate-fade-in-up-delay">
        <Card variant="elevated">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-3 bg-accent-blue/20 backdrop-blur-sm rounded-full border border-glass-border">
                <Layers className="w-6 h-6 text-accent-blue" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-text-secondary font-medium">Lotes Totales</p>
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
              icon={Search}
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
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Lote</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Área</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Precio</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary">Imágenes</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary w-40">Acciones</th>
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
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagination.data.map((lot: Lot) => (
                    <tr key={lot._id} className="border-b border-glass-border hover:bg-glass-primary/20 transition-colors">
                      <td className="py-4 px-4 md:px-6">
                        <div>
                          <p className="font-bold text-text-primary">{lot.stage || '-'} - {lot.lotNumber}</p>
                          <p className="text-sm text-text-muted">Nom: {lot.nomenclature || '-'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-text-secondary">
                        {lot.area ? `${lot.area} m²` : '-'}
                      </td>
                      <td className="py-4 px-4 md:px-6 text-text-primary font-medium">
                        {lot.price ? formatCurrency(lot.price) : '-'}
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center space-x-2">
                          {lot.images && lot.images.length > 0 ? (
                            <div className="flex -space-x-2">
                              {lot.images.slice(0, 3).map((img, i) => (
                                <div key={i} className="w-8 h-8 rounded-md border border-white overflow-hidden bg-glass-primary">
                                  <img src={img} alt="lot" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {lot.images.length > 3 && (
                                <div className="w-8 h-8 rounded-md border border-white bg-glass-secondary flex items-center justify-center text-[10px] text-text-primary">
                                  +{lot.images.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-text-disabled">Sin imágenes</span>
                          )}
                          <Button 
                            variant="glass" 
                            size="sm" 
                            onClick={() => openImageModal(lot)}
                            className="p-1 min-h-[32px] min-w-[32px]"
                          >
                            <ImagePlus className="w-4 h-4 text-accent-blue" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(lot)}
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
             {pagination.data.map((lot: Lot) => (
              <Card key={lot._id} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-text-primary">{lot.stage} - {lot.lotNumber}</h3>
                      <p className="text-sm text-text-secondary">Área: {lot.area} m² - {lot.price ? formatCurrency(lot.price) : 'N/A'}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(lot)} className="glass-button">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openImageModal(lot)} className="glass-button text-accent-blue">
                        <ImagePlus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {lot.images && lot.images.length > 0 && (
                     <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {lot.images.map((img, i) => (
                          <img key={i} src={img} className="w-16 h-16 object-cover rounded-lg border border-glass-border flex-shrink-0" />
                        ))}
                     </div>
                  )}
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
        title={formData._id ? 'Editar Lote' : 'Registar Nuevo Lote'}
        size="lg"
      >
        <form onSubmit={handleCreateOrUpdateLot} className="space-y-4 pt-2">
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Precio de Venta</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
              <Input
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Ej: 45000000"
                className="glass-input pl-10"
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

      {/* Image Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title="Imágenes del Lote"
        size="md"
      >
        <div className="space-y-6 pt-2">
          {selectedLot && selectedLot.images && selectedLot.images.length > 0 && (
             <div className="grid grid-cols-3 gap-2">
                {selectedLot.images.map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-glass-border relative group">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))}
             </div>
          )}

          <div className="border-2 border-dashed border-glass-border rounded-xl p-8 text-center hover:border-accent-blue/50 transition-colors">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              id="file-upload" 
              className="hidden" 
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-accent-blue/10 rounded-full mb-3">
                  <ImageIcon className="w-8 h-8 text-accent-blue" />
                </div>
                <p className="font-medium text-text-primary">Haz clic para subir imágenes</p>
                <p className="text-xs text-text-muted mt-1">PNG, JPG hasta 5MB</p>
                {selectedFiles.length > 0 && (
                  <p className="mt-2 text-sm text-accent-green font-medium">
                    {selectedFiles.length} archivos seleccionados
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsImageModalOpen(false)} className="glass-button">
              Cerrar
            </Button>
            <Button 
              disabled={selectedFiles.length === 0 || isUploading}
              onClick={handleUploadImages}
              className="glass-button bg-accent-blue text-white"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subir Imágenes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
