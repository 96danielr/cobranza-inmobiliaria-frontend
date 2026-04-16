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
  ImageIcon,
  ShoppingCart,
  Calendar as CalendarIcon,
  UserPlus,
  Users,
  Eye,
  Info
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SortHeader } from '@/components/ui/SortHeader'
import { TableRowSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import { PaginationControls } from '@/components/ui/Pagination'
import { useServerPagination } from '@/hooks/usePagination'
import { adminApi } from '@/lib/adminApi'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { useClientStore } from '@/stores/clientStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface Lot {
  _id: string
  stage: string
  nomenclature: string
  lotNumber: string
  area: number
  price?: number
  images?: string[]
  status: 'disponible' | 'vendido'
  createdAt: string
  sellerId?: {
    accountId: {
      fullName: string
    }
  }
}

export default function LotsPage() {
  const { selectedCompanyId, admin } = useAdminAuthStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false)
  const [sellers, setSellers] = useState<any[]>([])
  const [loadingSellers, setLoadingSellers] = useState(false)

  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false)
  const [saleDetail, setSaleDetail] = useState<any>(null)
  const [loadingSaleDetail, setLoadingSaleDetail] = useState(false)

  const { clients, fetchClientsIfNeeded, loading: clientsLoading } = useClientStore()

  const [formData, setFormData] = useState({
    _id: '',
    stage: '',
    nomenclature: '',
    lotNumber: '',
    area: '',
    price: ''
  })

  const [sellFormData, setSellFormData] = useState({
    clientId: '',
    totalValue: '',
    installmentsCount: '24',
    initialQuotaPercentage: '30',
    initialQuotasCount: '1',
    contractDate: dayjs().format('YYYY-MM-DD'),
    negotiation: 'Venta Directa',
    // New client fields if creating new
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    sellerId: ''
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const fetchLots = async (page: number, limit: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    try {
      const response = await adminApi.getLots(page, limit, search, sortBy, sortOrder)
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

  const handleViewSaleDetail = async (lot: Lot) => {
    setSelectedLot(lot)
    setIsSaleDetailModalOpen(true)
    setLoadingSaleDetail(true)
    setSaleDetail(null)
    try {
      const response = await adminApi.getLotSaleDetail(lot._id)
      if (response.data.success) {
        setSaleDetail(response.data.data)
      }
    } catch (error) {

      toast.error('Error al cargar detalles de la venta')
    } finally {
      setLoadingSaleDetail(false)
    }
  }

  const handleSellClick = (lot: Lot) => {
    setSelectedLot(lot)
    setIsCreatingNewClient(false)
    setSellFormData({
      clientId: '',
      totalValue: lot.price?.toString() || '',
      installmentsCount: '24',
      initialQuotaPercentage: '30',
      initialQuotasCount: '1',
      contractDate: dayjs().format('YYYY-MM-DD'),
      negotiation: 'Venta Directa',
      clientName: '',
      clientIdNumber: '',
      clientPhone: '',
      sellerId: ''
    })
    setIsSellModalOpen(true)
    fetchClientsIfNeeded()
    fetchSellers()
  }

  const fetchSellers = async () => {
    try {
      setLoadingSellers(true)
      const response = await adminApi.getSellers()
      if (response.data.success) {
        setSellers(response.data.data)
      }
    } catch (error) {

    } finally {
      setLoadingSellers(false)
    }
  }

  const handleSellLot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot) return

    setIsSubmitting(true)
    try {
      const payload: any = {
        totalValue: parseFloat(sellFormData.totalValue),
        installmentsCount: parseInt(sellFormData.installmentsCount),
        initialQuotaPercentage: parseFloat(sellFormData.initialQuotaPercentage),
        initialQuotasCount: parseInt(sellFormData.initialQuotasCount),
        contractDate: sellFormData.contractDate,
        negotiation: sellFormData.negotiation,
        sellerId: sellFormData.sellerId || undefined
      }

      if (isCreatingNewClient) {
        payload.clientData = {
          name: sellFormData.clientName,
          idNumber: sellFormData.clientIdNumber,
          phone: sellFormData.clientPhone
        }
      } else {
        payload.clientId = sellFormData.clientId
        if (!payload.clientId) {
          toast.error('Debe seleccionar un cliente')
          setIsSubmitting(false)
          return
        }
      }

      const response = await adminApi.sellLot(selectedLot._id, payload)
      if (response.data.success) {
        toast.success('Venta registrada correctamente')
        setIsSellModalOpen(false)
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error al registrar venta')
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSellInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSellFormData(prev => ({ ...prev, [name]: value }))
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
    <div className="flex flex-col min-h-full space-y-4 md:space-y-6 px-1 py-2 md:p-6">
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
          {admin?.role !== 'vendedor' && (
            <Button
              onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
              className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Lote
            </Button>
          )}
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
        <div className="flex-1 overflow-auto min-h-[400px] lg:min-h-[500px] lg:max-h-[600px] xl:max-h-[calc(100vh-350px)] w-100 xl:max-w-[900px] 2xl:max-w-[1560px] relative">
          <div className="hidden lg:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="sticky top-0 z-20">
                  <SortHeader
                    label="Lote"
                    field="lotNumber"
                    currentSortBy={pagination.sortBy}
                    currentSortOrder={pagination.sortOrder}
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <SortHeader
                    label="Área"
                    field="area"
                    currentSortBy={pagination.sortBy}
                    currentSortOrder={pagination.sortOrder}
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <SortHeader
                    label="Precio"
                    field="price"
                    currentSortBy={pagination.sortBy}
                    currentSortOrder={pagination.sortOrder}
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Estado</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Vendedor</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Imágenes</th>
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary w-40 bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagination.loading ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRowSkeleton key={index} columns={6} />
                  ))
                ) : pagination.total === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lot.status === 'vendido'
                          ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                          : 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                          }`}>
                          {lot.status === 'vendido' ? 'Vendido' : 'Disponible'}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-sm text-text-secondary whitespace-nowrap">
                        {lot.sellerId?.accountId?.fullName || '-'}
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
                          {admin?.role !== 'vendedor' && (
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={() => openImageModal(lot)}
                              className="p-1 min-h-[32px] min-w-[32px]"
                            >
                              <ImagePlus className="w-4 h-4 text-accent-blue" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center space-x-2">
                          {lot.status === 'vendido' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSaleDetail(lot)}
                              className="glass-button min-h-[40px] min-w-[40px] text-accent-purple hover:bg-accent-purple/10"
                              title="Ver Detalles de Venta"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSellClick(lot)}
                              className="glass-button min-h-[40px] min-w-[40px] text-accent-green hover:bg-accent-green/10"
                              title="Vender Lote"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          )}
                          {admin?.role !== 'vendedor' && (
                            <>
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
                            </>
                          )}
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
                      <p className="text-xs text-text-muted mt-1">Vendedor: {lot.sellerId?.accountId?.fullName || 'N/A'}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${lot.status === 'vendido'
                        ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                        : 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                        }`}>
                        {lot.status === 'vendido' ? 'Vendido' : 'Disponible'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {lot.status === 'vendido' ? (
                        <Button size="sm" variant="outline" onClick={() => handleViewSaleDetail(lot)} className="glass-button text-accent-purple">
                          <Eye className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleSellClick(lot)} className="glass-button text-accent-green">
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      )}
                      {admin?.role !== 'vendedor' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(lot)} className="glass-button">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openImageModal(lot)} className="glass-button text-accent-blue">
                            <ImagePlus className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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

      {/* Sell Modal */}
      <Modal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        title={`Vender Lote: ${selectedLot?.stage} - ${selectedLot?.lotNumber}`}
        size="lg"
      >
        <form onSubmit={handleSellLot} className="space-y-6 pt-2">
          {/* Client Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-text-primary flex items-center">
                <Users className="w-4 h-4 mr-2 text-accent-blue" />
                Información del Cliente
              </label>
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={() => setIsCreatingNewClient(!isCreatingNewClient)}
                className="text-xs h-8"
              >
                {isCreatingNewClient ? 'Seleccionar existente' : 'Nuevo cliente'}
                {isCreatingNewClient ? <Users className="w-3 h-3 ml-2" /> : <UserPlus className="w-3 h-3 ml-2" />}
              </Button>
            </div>

            {isCreatingNewClient ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-glass-primary/10 border border-glass-border animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Nombre Completo</label>
                  <Input
                    name="clientName"
                    value={sellFormData.clientName}
                    onChange={handleSellInputChange}
                    placeholder="Nombre del cliente"
                    required
                    className="glass-input h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Cédula</label>
                  <Input
                    name="clientIdNumber"
                    value={sellFormData.clientIdNumber}
                    onChange={handleSellInputChange}
                    placeholder="Documento"
                    required
                    className="glass-input h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Teléfono</label>
                  <Input
                    name="clientPhone"
                    value={sellFormData.clientPhone}
                    onChange={handleSellInputChange}
                    placeholder="Contacto"
                    required
                    className="glass-input h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  name="clientId"
                  value={sellFormData.clientId}
                  onChange={handleSellInputChange}
                  required={!isCreatingNewClient}
                  className="w-full h-11 px-4 rounded-xl border border-glass-border bg-glass-primary/50 backdrop-blur-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all appearance-none"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {c.idNumber}
                    </option>
                  ))}
                </select>
                {clientsLoading && <p className="text-xs text-text-muted animate-pulse">Cargando clientes...</p>}
              </div>
            )}
          </div>

          {admin?.role !== 'vendedor' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary flex items-center">
                <Users className="w-4 h-4 mr-2 text-accent-purple" />
                Asignar Vendedor (Opcional)
              </label>
              <select
                name="sellerId"
                value={sellFormData.sellerId}
                onChange={handleSellInputChange}
                className="w-full h-11 px-4 rounded-xl border border-glass-border bg-glass-primary/50 backdrop-blur-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all appearance-none"
              >
                <option value="">Sin vendedor asignado</option>
                {sellers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              {loadingSellers && <p className="text-xs text-text-muted animate-pulse">Cargando vendedores...</p>}
            </div>
          )}

          <div className="h-px bg-glass-border w-full" />

          {/* Sale Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-text-primary flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-accent-green" />
                Valores del Contrato
              </label>

              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Valor Total de Venta</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                  <Input
                    name="totalValue"
                    type="number"
                    value={sellFormData.totalValue}
                    onChange={handleSellInputChange}
                    className="glass-input pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-text-secondary">% Cuota Inicial</label>
                  <Input
                    name="initialQuotaPercentage"
                    type="number"
                    value={sellFormData.initialQuotaPercentage}
                    onChange={handleSellInputChange}
                    className="glass-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-secondary"># Cuotas Iniciales</label>
                  <Input
                    name="initialQuotasCount"
                    type="number"
                    value={sellFormData.initialQuotasCount}
                    onChange={handleSellInputChange}
                    className="glass-input"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-text-primary flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-accent-purple" />
                Plazos y Programación
              </label>

              <div className="space-y-2">
                <label className="text-xs text-text-secondary">Fecha del Contrato</label>
                <Input
                  name="contractDate"
                  type="date"
                  value={sellFormData.contractDate}
                  onChange={handleSellInputChange}
                  className="glass-input"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-text-secondary"># Cuotas Ordinarias</label>
                <Input
                  name="installmentsCount"
                  type="number"
                  value={sellFormData.installmentsCount}
                  onChange={handleSellInputChange}
                  className="glass-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary">Por cobrar en cuotas:</span>
              <span className="font-bold text-accent-blue">
                {formatCurrency(parseFloat(sellFormData.totalValue || '0') * (1 - parseFloat(sellFormData.initialQuotaPercentage || '0') / 100))}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1 text-text-muted italic">
              <span>Valor cuota mensual estim.:</span>
              <span>
                {formatCurrency((parseFloat(sellFormData.totalValue || '0') * (1 - parseFloat(sellFormData.initialQuotaPercentage || '0') / 100)) / (parseInt(sellFormData.installmentsCount) || 1))}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSellModalOpen(false)}
              className="glass-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="glass-button bg-accent-green text-white hover:bg-accent-green/80 flex-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Completar Venta
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Sale Detail Modal */}
      <Modal
        isOpen={isSaleDetailModalOpen}
        onClose={() => setIsSaleDetailModalOpen(false)}
        title="Detalles de Contrato Pro"
        size="xl"
      >
        {loadingSaleDetail ? (
          <ModalContentSkeleton />
        ) : saleDetail ? (
          <div className="space-y-6 pt-2 animate-fade-in">
            {/* Lot & Contract Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-glass-primary/10 border border-glass-border">
                <p className="text-xs text-text-muted uppercase font-bold mb-1">Información del Lote</p>
                <h4 className="text-xl font-bold text-text-primary">{selectedLot?.stage} - {selectedLot?.lotNumber}</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-text-secondary flex justify-between">
                    <span>Nomenclatura:</span> <span className="text-text-primary font-medium">{selectedLot?.nomenclature}</span>
                  </p>
                  <p className="text-sm text-text-secondary flex justify-between">
                    <span>Área:</span> <span className="text-text-primary font-medium">{selectedLot?.area} m²</span>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20">
                <p className="text-xs text-accent-blue uppercase font-bold mb-1">Resumen Financiero</p>
                <h4 className="text-xl font-bold text-accent-blue">{formatCurrency(saleDetail.contract.totalValue)}</h4>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-text-secondary flex justify-between">
                    <span>Cuotas:</span> <span className="text-text-primary font-medium">{saleDetail.contract.installmentsCount} cuotas</span>
                  </p>
                  <p className="text-sm text-text-secondary flex justify-between">
                    <span>Valor Cuota:</span> <span className="text-text-primary font-medium">{formatCurrency(saleDetail.contract.installmentValue)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Client & Seller */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center text-text-primary font-semibold border-b border-glass-border pb-2">
                  <Users className="w-4 h-4 mr-2 text-accent-blue" />
                  Cliente
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-text-primary">{saleDetail.contract.client?.name}</p>
                  <p className="text-sm text-text-secondary">CC: {saleDetail.contract.client?.idNumber}</p>
                  <p className="text-sm text-text-secondary">Tel: {saleDetail.contract.client?.phone}</p>
                  {saleDetail.contract.client?.email && (
                    <p className="text-sm text-text-secondary">Email: {saleDetail.contract.client.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-text-primary font-semibold border-b border-glass-border pb-2">
                  <UserPlus className="w-4 h-4 mr-2 text-accent-green" />
                  Vendedor
                </div>
                {saleDetail.contract.sellerId ? (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-text-primary">
                      {saleDetail.contract.sellerId.accountId?.fullName || 'N/A'}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {saleDetail.contract.sellerId.accountId?.email || 'N/A'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center text-text-disabled italic text-sm py-4">
                    Sin vendedor asignado
                  </div>
                )}
              </div>
            </div>

            {/* Negotiation Details */}
            <Card variant="elevated" className="p-4 bg-glass-secondary/50">
              <div className="flex items-center mb-3">
                <Info className="w-4 h-4 mr-2 text-accent-blue" />
                <span className="font-bold text-text-primary">Detalles de la Negociación</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-text-muted">Tipo</p>
                  <p className="text-sm font-medium text-text-primary">{saleDetail.contract.negotiation}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Fecha Contrato</p>
                  <p className="text-sm font-medium text-text-primary">
                    {dayjs(saleDetail.contract.contractDate).format('DD [de] MMMM, YYYY')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Inicio Pagos</p>
                  <p className="text-sm font-medium text-text-primary">
                    {dayjs(saleDetail.contract.startDate).format('DD/MM/YYYY')}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quotas Summary */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-glass-border pb-2">
                <div className="flex items-center text-text-primary font-semibold">
                  <CalendarIcon className="w-4 h-4 mr-2 text-accent-purple" />
                  Plan de Pagos ({saleDetail.quotas.length} cuotas)
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-text-muted border-b border-glass-border uppercase">
                      <th className="py-2">#</th>
                      <th className="py-2">Tipo</th>
                      <th className="py-2">Vencimiento</th>
                      <th className="py-2 text-right">Valor</th>
                      <th className="py-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {saleDetail.quotas.map((quota: any) => (
                      <tr key={quota._id} className="border-b border-glass-border hover:bg-glass-primary/10">
                        <td className="py-3 font-medium text-text-secondary">{quota.number}</td>
                        <td className="py-3 capitalize text-text-muted">{quota.type}</td>
                        <td className="py-3 text-text-primary">
                          {dayjs(quota.dueDate).format('DD/MM/YYYY')}
                        </td>
                        <td className="py-3 text-right font-bold text-text-primary">
                          {formatCurrency(quota.value)}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${quota.status === 'pagada'
                            ? 'bg-accent-green/10 text-accent-green'
                            : 'bg-accent-red/10 text-accent-red'
                            }`}>
                            {quota.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsSaleDetailModalOpen(false)} className="glass-button bg-accent-blue text-white">
                Cerrar Detalles
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-text-muted">
            No se pudieron cargar los detalles de la venta
          </div>
        )}
      </Modal>
    </div>
  )
}
