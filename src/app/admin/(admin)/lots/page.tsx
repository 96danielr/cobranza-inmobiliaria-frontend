'use client'

import { useState, useEffect } from 'react'
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
  Info,
  FileDown
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
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
import { Combobox } from '@/components/ui/Combobox'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface Lot {
  _id: string
  stage: string
  manzana?: string
  nomenclature: string
  lotNumber: string
  area: number
  price?: number
  images?: string[]
  status: 'disponible' | 'apartado' | 'separado' | 'vendido'
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

  const [isReserveDetailModalOpen, setIsReserveDetailModalOpen] = useState(false)
  const [reserveDetail, setReserveDetail] = useState<any>(null)
  const [loadingReserveDetail, setLoadingReserveDetail] = useState(false)

  const [companyLogo, setCompanyLogo] = useState<string>('')
  const [projectLogo, setProjectLogo] = useState<string>('')

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'company' | 'project') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      try {
        if (type === 'company') {
          setCompanyLogo(base64)
          if (selectedCompanyId) {
            await adminApi.updateCompany(selectedCompanyId, { logo: base64 })
          }
          toast.success('Logo de la empresa guardado en la base de datos')
        } else {
          setProjectLogo(base64)
          if (selectedCompanyId) {
            await adminApi.updateCompany(selectedCompanyId, { projectLogo: base64 })
          }
          toast.success('Logo del proyecto guardado en la base de datos')
        }
      } catch (err) {
        toast.error('Error al guardar el logo en la base de datos')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleClearLogo = async (type: 'company' | 'project') => {
    try {
      if (type === 'company') {
        setCompanyLogo('')
        if (selectedCompanyId) {
          await adminApi.updateCompany(selectedCompanyId, { logo: '' })
        }
        toast.success('Logo de la empresa eliminado de la base de datos')
      } else {
        setProjectLogo('')
        if (selectedCompanyId) {
          await adminApi.updateCompany(selectedCompanyId, { projectLogo: '' })
        }
        toast.success('Logo del proyecto eliminado de la base de datos')
      }
    } catch (err) {
      toast.error('Error al eliminar el logo de la base de datos')
    }
  }

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [releaseFormData, setReleaseFormData] = useState({ reason: '', observations: '' })

  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false)
  const [reserveFormData, setReserveFormData] = useState({
    type: 'apartado',
    clientId: '',
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    clientEmail: '',
    amount: '',
    observations: '',
    expirationDays: ''
  })

  const { clients, fetchClientsIfNeeded, loading: clientsLoading } = useClientStore()

  const [formData, setFormData] = useState({
    _id: '',
    stage: '',
    manzana: '',
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
    clientEmail: '',
    sellerId: '',
    bonus: '',
    bonusValue: '0',
    separationAmount: '0',
    initialQuotaDueDate: dayjs().format('YYYY-MM-DD'),
    paymentDay: '5'
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
    setFormData({ _id: '', stage: '', manzana: '', nomenclature: '', lotNumber: '', area: '', price: '' })
  }

  const handleEdit = (lot: Lot) => {
    setFormData({
      _id: lot._id,
      stage: lot.stage || '',
      manzana: lot.manzana || '',
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

      // Also fetch current company logos from MongoDB
      if (selectedCompanyId) {
        const companyResponse = await adminApi.getCompany(selectedCompanyId)
        if (companyResponse.data.success) {
          const companyData = companyResponse.data.data.company
          setCompanyLogo(companyData.logo || '')
          setProjectLogo(companyData.projectLogo || '')
        }
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
      clientEmail: '',
      sellerId: '',
      bonus: '',
      bonusValue: '0',
      separationAmount: lot.status === 'separado' ? '500000' : '0',
      initialQuotaDueDate: dayjs().add(15, 'day').format('YYYY-MM-DD'),
      paymentDay: '5'
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
        sellerId: sellFormData.sellerId || undefined,
        bonus: sellFormData.bonus,
        bonusValue: parseFloat(sellFormData.bonusValue) || 0,
        separationAmount: parseFloat(sellFormData.separationAmount) || 0,
        initialQuotaDueDate: sellFormData.initialQuotaDueDate,
        paymentDay: parseInt(sellFormData.paymentDay) || 5
      }

      if (isCreatingNewClient) {
        payload.clientData = {
          name: sellFormData.clientName,
          idNumber: sellFormData.clientIdNumber,
          phone: sellFormData.clientPhone,
          email: sellFormData.clientEmail
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

  const handleReserveClick = (lot: Lot) => {
    setSelectedLot(lot)
    setIsCreatingNewClient(false)
    setReserveFormData({
      type: 'apartado',
      clientId: '',
      clientName: '',
      clientIdNumber: '',
      clientPhone: '',
      clientEmail: '',
      amount: '',
      observations: '',
      expirationDays: ''
    })
    setIsReserveModalOpen(true)
    fetchClientsIfNeeded()
  }

  const handleReserveLot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot) return

    setIsSubmitting(true)
    try {
      const payload: any = {
        type: reserveFormData.type,
        amount: reserveFormData.amount ? parseFloat(reserveFormData.amount) : undefined,
        observations: reserveFormData.observations,
        expirationDays: reserveFormData.expirationDays ? parseInt(reserveFormData.expirationDays) : undefined
      }

      if (isCreatingNewClient) {
        payload.clientData = {
          name: reserveFormData.clientName,
          idNumber: reserveFormData.clientIdNumber,
          phone: reserveFormData.clientPhone,
          email: reserveFormData.clientEmail
        }
      } else {
        payload.clientId = reserveFormData.clientId
        if (!payload.clientId) {
          toast.error('Debe seleccionar un cliente')
          setIsSubmitting(false)
          return
        }
      }

      const response = await adminApi.reserveLot(selectedLot._id, payload)
      if (response.data.success) {
        toast.success(`Lote ${reserveFormData.type} correctamente`)
        setIsReserveModalOpen(false)
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error en la operación')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewReserveDetail = async (lot: Lot) => {
    setSelectedLot(lot)
    setIsReserveDetailModalOpen(true)
    setLoadingReserveDetail(true)
    setReserveDetail(null)
    try {
      const response = await adminApi.getLot(lot._id)
      if (response.data.success) {
        setReserveDetail(response.data.data)
      }
    } catch (error) {
      toast.error('Error al cargar detalles de la reserva')
    } finally {
      setLoadingReserveDetail(false)
    }
  }

  const handleReleaseLot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLot) return

    setIsSubmitting(true)
    try {
      const response = await adminApi.releaseLot(selectedLot._id, releaseFormData)
      if (response.data.success) {
        toast.success('Lote liberado correctamente')
        setIsReleaseModalOpen(false)
        setIsReserveDetailModalOpen(false)
        pagination.refresh()
      } else {
        toast.error(response.data.message || 'Error al liberar lote')
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsSubmitting(false)
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

  const generatePaymentPlanPDF = () => {
    if (!saleDetail || !selectedLot) return

    const doc = new jsPDF()
    
    // Space for Company Logo (Left) and Project Logo (Right)
    doc.setDrawColor(200, 200, 200)
    
    // Company Logo space (Izquierda)
    if (companyLogo) {
      try {
        doc.addImage(companyLogo, 'PNG', 14, 10, 45, 20)
      } catch (err) {
        doc.setLineDashPattern([2, 2], 0)
        doc.rect(14, 10, 45, 20)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text('[ LOGO EMPRESA ]', 36.5, 21, { align: 'center' })
      }
    } else {
      doc.setLineDashPattern([2, 2], 0)
      doc.rect(14, 10, 45, 20)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('[ LOGO EMPRESA ]', 36.5, 21, { align: 'center' })
    }
    
    // Project Logo space (Derecha)
    if (projectLogo) {
      try {
        doc.addImage(projectLogo, 'PNG', 151, 10, 45, 20)
      } catch (err) {
        doc.setLineDashPattern([2, 2], 0)
        doc.rect(151, 10, 45, 20)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text('[ LOGO PROYECTO ]', 173.5, 21, { align: 'center' })
      }
    } else {
      doc.setLineDashPattern([2, 2], 0)
      doc.rect(151, 10, 45, 20)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text('[ LOGO PROYECTO ]', 173.5, 21, { align: 'center' })
    }
    
    // Restore normal solid lines and colors
    doc.setLineDashPattern([], 0)
    doc.setDrawColor(0, 0, 0)

    // Header Title (Centered)
    doc.setFontSize(18)
    doc.setTextColor(44, 62, 80)
    doc.text('Plan de Pagos', 105, 18, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setTextColor(120)
    doc.text(`Generado el: ${dayjs().format('DD/MM/YYYY HH:mm')}`, 105, 25, { align: 'center' })

    // Lot and Client Info
    doc.setFontSize(12)
    doc.setTextColor(44, 62, 80)
    doc.text('Información del Lote', 14, 40)
    doc.text('Información del Cliente', 120, 40)
    doc.line(14, 42, 200, 42)
    
    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(`Lote: ${selectedLot.stage} - ${selectedLot.lotNumber}`, 14, 50)
    doc.text(`Nomenclatura: ${selectedLot.nomenclature || 'N/A'}`, 14, 56)
    doc.text(`Precio de Venta: ${formatCurrency(saleDetail.contract.totalValue)}`, 14, 62)
    
    doc.text(`Nombre: ${saleDetail.contract.client?.name}`, 120, 50)
    doc.text(`Cédula: ${saleDetail.contract.client?.idNumber}`, 120, 56)
    doc.text(`Teléfono: ${saleDetail.contract.client?.phone}`, 120, 62)
    doc.text(`Correo: ${saleDetail.contract.client?.email || 'N/A'}`, 120, 68)

    // Quotas Table
    const tableRows = saleDetail.quotas.map((q: any) => [
      q.number === 0 ? 'Separación' : q.type === 'cuota' ? `Cuota ${q.number}` : q.type === 'inicial' ? `Cuota Inicial ${q.number}` : `Ordinaria ${q.number}`,
      dayjs(q.dueDate).format('DD/MM/YYYY'),
      formatCurrency(q.value),
      q.status === 'pagado' || q.status === 'pagada' ? 'PAGADO' : 'PENDIENTE'
    ])

    autoTable(doc, {
      startY: 76,
      head: [['Descripción', 'Fecha de Vencimiento', 'Valor', 'Estado']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    // Summary at the end
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Resumen del Plan', 14, finalY)
    doc.line(14, finalY + 2, 200, finalY + 2)
    
    doc.setFontSize(10)
    doc.text(`Total a Pagar: ${formatCurrency(saleDetail.contract.totalValue)}`, 14, finalY + 10)
    doc.text(`Cuotas Totales: ${saleDetail.contract.installmentsCount}`, 14, finalY + 15)
    doc.text(`Valor por Cuota: ${formatCurrency(saleDetail.contract.installmentValue)}`, 14, finalY + 20)

    doc.save(`Plan_Pagos_${selectedLot.lotNumber}_${saleDetail.contract.client?.name.replace(/\s+/g, '_')}.pdf`)
  }

  const formatCurrency = (value: any) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num) || num === null || num === undefined) return '$ 0'
    
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num)
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
        <Card variant="elevated" className="stats-card stats-blue">
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
                  <SortHeader
                    label="Estado"
                    field="status"
                    currentSortBy={pagination.sortBy}
                    currentSortOrder={pagination.sortOrder}
                    onSort={pagination.handleSort}
                    className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                  />
                  <th className="text-left py-3 px-4 md:px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">Ejecutivo Comercial</th>
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
                          <p className="font-bold text-text-primary">E: {lot.stage || '-'} - M: {lot.manzana || '-'} - L: {lot.lotNumber}</p>
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          lot.status === 'vendido' ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm' :
                          lot.status === 'separado' ? 'bg-purple-100 text-purple-700 border border-purple-200 shadow-sm' :
                          lot.status === 'apartado' ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm' :
                          'bg-green-100 text-green-700 border border-green-200 shadow-sm'
                        }`}>
                          {lot.status === 'vendido' ? 'Vendido' : 
                           lot.status === 'separado' ? 'Separado' :
                           lot.status === 'apartado' ? 'Apartado' : 'Disponible'}
                        </span>
                      </td>
                      <td className="py-4 px-4 md:px-6 text-sm text-text-secondary whitespace-nowrap">
                        {lot.sellerId?.accountId?.fullName || '-'}
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex items-center space-x-2">
                          {lot.images && lot.images.length > 0 ? (
                            <div className="flex -space-x-2">
                              {lot.images.slice(0, 3).map((img: any, i: number) => (
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
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSellClick(lot)}
                                className="glass-button min-h-[40px] min-w-[40px] text-accent-green hover:bg-accent-green/10"
                                title="Vender Lote"
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReserveClick(lot)}
                                className="glass-button min-h-[40px] min-w-[40px] text-accent-blue hover:bg-accent-blue/10"
                                title="Apartar/Separar Lote"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          {(lot.status === 'apartado' || lot.status === 'separado') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReserveDetail(lot)}
                              className="glass-button min-h-[40px] min-w-[40px] text-accent-blue hover:bg-accent-blue/10"
                              title="Ver Detalles de Reserva"
                            >
                              <Info className="w-4 h-4" />
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
                      <h3 className="font-bold text-text-primary">E: {lot.stage} - M: {lot.manzana} - L: {lot.lotNumber}</h3>
                      <p className="text-sm text-text-secondary">Área: {lot.area} m² - {lot.price ? formatCurrency(lot.price) : 'N/A'}</p>
                      <p className="text-xs text-text-muted mt-1">Ejecutivo: {lot.sellerId?.accountId?.fullName || 'N/A'}</p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        lot.status === 'vendido' ? 'bg-red-100 text-red-700 border border-red-200' :
                        lot.status === 'separado' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        lot.status === 'apartado' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {lot.status === 'vendido' ? 'Vendido' : 
                         lot.status === 'separado' ? 'Separado' :
                         lot.status === 'apartado' ? 'Apartado' : 'Disponible'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {lot.status === 'vendido' ? (
                        <Button size="sm" variant="outline" onClick={() => handleViewSaleDetail(lot)} className="glass-button text-accent-purple">
                          <Eye className="w-4 h-4" />
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleSellClick(lot)} className="glass-button text-accent-green">
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReserveClick(lot)} className="glass-button text-accent-blue">
                            <Users className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {(lot.status === 'apartado' || lot.status === 'separado') && (
                        <Button size="sm" variant="outline" onClick={() => handleViewReserveDetail(lot)} className="glass-button text-accent-blue">
                          <Info className="w-4 h-4" />
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
              <label className="text-sm font-medium text-text-secondary">Manzana</label>
              <Input
                name="manzana"
                value={formData.manzana}
                onChange={handleInputChange}
                placeholder="Ej: MZ A"
                required
                className="glass-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Lote</label>
            <Input
              name="lotNumber"
              value={formData.lotNumber}
              onChange={handleInputChange}
              placeholder="Ej: 275-2"
              required
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Correo Electrónico</label>
                  <Input
                    name="clientEmail"
                    value={sellFormData.clientEmail}
                    onChange={handleSellInputChange}
                    placeholder="email@ejemplo.com"
                    type="email"
                    className="glass-input h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Combobox
                  options={clients.map(c => ({ value: c._id, label: `${c.name} - ${c.idNumber}` }))}
                  value={sellFormData.clientId}
                  onChange={(val) => setSellFormData(prev => ({ ...prev, clientId: val }))}
                  placeholder="Seleccione un cliente..."
                  searchPlaceholder="Buscar por nombre o cédula..."
                />
                {clientsLoading && <p className="text-xs text-text-muted animate-pulse">Cargando clientes...</p>}
              </div>
            )}
          </div>

          {admin?.role !== 'vendedor' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary flex items-center">
                <Users className="w-4 h-4 mr-2 text-accent-purple" />
                Asignar Ejecutivo Comercial (Opcional)
              </label>
              <select
                name="sellerId"
                value={sellFormData.sellerId}
                onChange={handleSellInputChange}
                className="w-full h-11 px-4 rounded-xl border border-glass-border bg-glass-primary/50 backdrop-blur-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all appearance-none"
              >
                <option value="">Sin ejecutivo comercial asignado</option>
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
                  <label className="text-xs text-text-secondary">Bono de Descuento (Valor)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-purple/50" />
                    <Input
                      name="bonusValue"
                      type="number"
                      value={sellFormData.bonusValue}
                      onChange={handleSellInputChange}
                      className="glass-input pl-10 border-accent-purple/30 focus:border-accent-purple"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-text-secondary">Descripción del Bono</label>
                  <Input
                    name="bonus"
                    value={sellFormData.bonus}
                    onChange={handleSellInputChange}
                    className="glass-input border-accent-purple/30 focus:border-accent-purple"
                    placeholder="Ej: Promo Mayo"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/20">
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span>Valor Neto a Financiar:</span>
                  <span className="font-bold text-accent-green text-sm">
                    {formatCurrency(Number(sellFormData.totalValue || 0) - Number(sellFormData.bonusValue || 0))}
                  </span>
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

              <div className="space-y-2">
                <label className="text-xs text-text-secondary font-medium">Monto de Separación (Descontar de la Inicial)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-green" />
                  <Input
                    name="separationAmount"
                    type="number"
                    value={sellFormData.separationAmount}
                    onChange={handleSellInputChange}
                    className="glass-input pl-10 border-accent-green/30 focus:border-accent-green"
                    placeholder="0"
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
                <label className="text-xs text-text-secondary">Fecha Pago Resto de Inicial</label>
                <Input
                  name="initialQuotaDueDate"
                  type="date"
                  value={sellFormData.initialQuotaDueDate}
                  onChange={handleSellInputChange}
                  className="glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <label className="text-xs text-text-secondary">Día de Pago Ordinario</label>
                  <select
                    name="paymentDay"
                    value={sellFormData.paymentDay}
                    onChange={handleSellInputChange}
                    className="w-full h-11 px-3 rounded-xl border border-glass-border bg-glass-primary/50 backdrop-blur-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all appearance-none"
                    required
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        Día {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          <div className="p-4 rounded-xl bg-accent-blue/5 border border-accent-blue/20 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Valor Neto Pactado:</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency(Number(sellFormData.totalValue || 0) - Number(sellFormData.bonusValue || 0))}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">Total Inicial Pactado ({sellFormData.initialQuotaPercentage}%):</span>
              <span className="font-semibold text-text-primary">
                {formatCurrency((Number(sellFormData.totalValue || 0) - Number(sellFormData.bonusValue || 0)) * (Number(sellFormData.initialQuotaPercentage || 0) / 100))}
              </span>
            </div>
            {Number(sellFormData.separationAmount || 0) > 0 && (
              <div className="flex justify-between items-center text-xs text-accent-green font-medium">
                <span>Descuento por Separación:</span>
                <span>-{formatCurrency(Number(sellFormData.separationAmount || 0))}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm border-t border-glass-border/30 pt-2">
              <span className="text-text-secondary font-semibold">Inicial Restante por cobrar ({sellFormData.initialQuotasCount} cuotas):</span>
              <span className="font-bold text-accent-blue">
                {formatCurrency(Math.max(0, (Number(sellFormData.totalValue || 0) - Number(sellFormData.bonusValue || 0)) * (Number(sellFormData.initialQuotaPercentage || 0) / 100) - Number(sellFormData.separationAmount || 0)))}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-glass-border/30 pt-2">
              <span className="text-text-secondary font-semibold">Financiado Ordinario ({sellFormData.installmentsCount} cuotas):</span>
              <span className="font-bold text-accent-purple">
                {formatCurrency((Number(sellFormData.totalValue || 0) - Number(sellFormData.bonusValue || 0)) * (1 - Number(sellFormData.initialQuotaPercentage || 0) / 100))}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1 text-text-muted italic">
              <span>Cuota mensual ordinaria est.:</span>
              <span>
                {formatCurrency(((Number(sellFormData.totalValue || 0) - Number(sellFormData.bonusValue || 0)) * (1 - Number(sellFormData.initialQuotaPercentage || 0) / 100)) / (parseInt(sellFormData.installmentsCount) || 1))}
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl bg-glass-primary/10 border border-glass-border">
              <div>
                <p className="text-xs text-text-muted uppercase font-bold mb-1">Información del Lote</p>
                <h4 className="text-xl font-bold text-text-primary">{selectedLot?.stage} - {selectedLot?.lotNumber}</h4>
                <p className="text-sm text-text-secondary">Contrato Pro #{saleDetail.contract._id.slice(-6).toUpperCase()}</p>
              </div>
              <Button 
                onClick={generatePaymentPlanPDF}
                className="glass-button bg-accent-blue text-white w-full md:w-auto"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Descargar Plan
              </Button>
            </div>

            {/* Logo Configuration Section */}
            <div className="p-4 rounded-xl bg-glass-primary/10 border border-glass-border/40 space-y-4">
              <div className="flex items-center gap-2 border-b border-glass-border/30 pb-2">
                <Building2 className="w-5 h-5 text-accent-blue animate-pulse" />
                <div>
                  <h4 className="font-bold text-sm text-text-primary">Configuración de Logos para el PDF</h4>
                  <p className="text-[11px] text-text-secondary">Sube los logos de tu empresa y del proyecto para que aparezcan en el encabezado del plan de pagos descargable.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Logo Empresa */}
                <div className="space-y-2 p-3 rounded-lg bg-glass-primary/5 border border-glass-border/30">
                  <span className="text-xs font-semibold text-text-primary block">Logo de la Empresa (Izquierda)</span>
                  <div className="flex items-center gap-3">
                    {companyLogo ? (
                      <div className="relative w-16 h-10 border border-glass-border bg-white rounded flex items-center justify-center overflow-hidden">
                        <img src={companyLogo} alt="Logo Empresa" className="max-w-full max-h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleClearLogo('company')}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-10 border border-dashed border-glass-border rounded flex items-center justify-center text-[9px] text-text-muted italic text-center leading-none">
                        Sin Logo
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="company-logo-input"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, 'company')}
                    />
                    <label
                      htmlFor="company-logo-input"
                      className="px-3 py-1.5 rounded bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-xs font-bold cursor-pointer transition-colors"
                    >
                      Subir Imagen
                    </label>
                  </div>
                </div>

                {/* Logo Proyecto */}
                <div className="space-y-2 p-3 rounded-lg bg-glass-primary/5 border border-glass-border/30">
                  <span className="text-xs font-semibold text-text-primary block">Logo del Proyecto (Derecha)</span>
                  <div className="flex items-center gap-3">
                    {projectLogo ? (
                      <div className="relative w-16 h-10 border border-glass-border bg-white rounded flex items-center justify-center overflow-hidden">
                        <img src={projectLogo} alt="Logo Proyecto" className="max-w-full max-h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => handleClearLogo('project')}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-10 border border-dashed border-glass-border rounded flex items-center justify-center text-[9px] text-text-muted italic text-center leading-none">
                        Sin Logo
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      id="project-logo-input"
                      className="hidden"
                      onChange={(e) => handleLogoUpload(e, 'project')}
                    />
                    <label
                      htmlFor="project-logo-input"
                      className="px-3 py-1.5 rounded bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-xs font-bold cursor-pointer transition-colors"
                    >
                      Subir Imagen
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-glass-primary/5 border border-glass-border">
                <p className="text-xs text-text-muted uppercase font-bold mb-1">Estado del Pago</p>
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
                  Ejecutivo Comercial
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
                    Sin ejecutivo comercial asignado
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
                        <td className="py-3 font-medium text-text-secondary">{quota.number === 0 ? '-' : quota.number}</td>
                        <td className="py-3 capitalize text-text-muted">
                          {quota.number === 0 ? 'separación' : quota.type === 'extra' ? 'ordinaria' : quota.type}
                        </td>
                        <td className="py-3 text-text-primary">
                          {dayjs(quota.dueDate).format('DD/MM/YYYY')}
                        </td>
                        <td className="py-3 text-right text-text-primary">
                          <div className="font-bold">{formatCurrency(quota.value)}</div>
                          {quota.amountPaid > 0 && quota.amountPaid < quota.value && (
                            <div className="text-[10px] text-text-muted mt-0.5 leading-tight">
                              Abonado: <span className="text-accent-green font-semibold">{formatCurrency(quota.amountPaid)}</span><br />
                              Saldo: <span className="text-accent-red font-semibold">{formatCurrency(quota.value - quota.amountPaid)}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            quota.status === 'pagada' || quota.status === 'pagado'
                              ? 'bg-accent-green/10 text-accent-green'
                              : quota.amountPaid > 0
                              ? 'bg-accent-yellow/10 text-accent-yellow'
                              : 'bg-accent-red/10 text-accent-red'
                            }`}>
                            {quota.status === 'pagada' || quota.status === 'pagado'
                              ? 'PAGADO'
                              : quota.amountPaid > 0
                              ? 'ABONADA'
                              : quota.status}
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
      {/* Reserve Modal */}
      <Modal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        title={`Reservar Lote: ${selectedLot?.stage} - ${selectedLot?.lotNumber}`}
        size="lg"
      >
        <form onSubmit={handleReserveLot} className="space-y-6 pt-2">
          {/* Reservation Type */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-text-primary flex items-center">
              <Layers className="w-4 h-4 mr-2 text-accent-blue" />
              Tipo de Reserva
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setReserveFormData(prev => ({ ...prev, type: 'apartado' }))}
                className={`p-4 rounded-xl border transition-all text-left ${
                  reserveFormData.type === 'apartado'
                    ? 'bg-accent-blue/10 border-accent-blue'
                    : 'bg-glass-primary/10 border-glass-border hover:border-accent-blue/50'
                }`}
              >
                <p className="font-bold text-text-primary">Apartado</p>
                <p className="text-xs text-text-muted mt-1">Sin dinero. Validez 5 días.</p>
              </button>
              <button
                type="button"
                onClick={() => setReserveFormData(prev => ({ ...prev, type: 'separado' }))}
                className={`p-4 rounded-xl border transition-all text-left ${
                  reserveFormData.type === 'separado'
                    ? 'bg-accent-purple/10 border-accent-purple'
                    : 'bg-glass-primary/10 border-glass-border hover:border-accent-purple/50'
                }`}
              >
                <p className="font-bold text-text-primary">Separado</p>
                <p className="text-xs text-text-muted mt-1">Mínimo $500,000. Validez 1 mes.</p>
              </button>
            </div>
          </div>

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
              </Button>
            </div>

            {isCreatingNewClient ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-glass-primary/10 border border-glass-border">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Nombre Completo</label>
                  <Input
                    value={reserveFormData.clientName}
                    onChange={(e) => setReserveFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Nombre"
                    required
                    className="glass-input h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Cédula</label>
                  <Input
                    value={reserveFormData.clientIdNumber}
                    onChange={(e) => setReserveFormData(prev => ({ ...prev, clientIdNumber: e.target.value }))}
                    placeholder="Documento"
                    required
                    className="glass-input h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Teléfono</label>
                  <Input
                    value={reserveFormData.clientPhone}
                    onChange={(e) => setReserveFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    placeholder="Contacto"
                    required
                    className="glass-input h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Correo Electrónico</label>
                  <Input
                    value={reserveFormData.clientEmail}
                    onChange={(e) => setReserveFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="email@ejemplo.com"
                    type="email"
                    className="glass-input h-9"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Combobox
                  options={clients.map(c => ({ value: c._id, label: `${c.name} - ${c.idNumber}` }))}
                  value={reserveFormData.clientId}
                  onChange={(val) => setReserveFormData(prev => ({ ...prev, clientId: val }))}
                  placeholder="Seleccione un cliente..."
                  searchPlaceholder="Buscar por nombre o cédula..."
                />
              </div>
            )}
          </div>

          {reserveFormData.type === 'separado' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-accent-green" />
                Monto del Pago (Mínimo $500,000)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-disabled" />
                <Input
                  type="number"
                  min="500000"
                  value={reserveFormData.amount}
                  onChange={(e) => setReserveFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="500000"
                  required
                  className="glass-input pl-10"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Días de Vigencia</label>
              <Input
                type="number"
                value={reserveFormData.expirationDays}
                onChange={(e) => setReserveFormData(prev => ({ ...prev, expirationDays: e.target.value }))}
                placeholder={reserveFormData.type === 'separado' ? '30' : '5'}
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Observaciones</label>
              <Input
                value={reserveFormData.observations}
                onChange={(e) => setReserveFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Detalles adicionales..."
                className="glass-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-glass-border">
            <Button type="button" variant="outline" onClick={() => setIsReserveModalOpen(false)} className="glass-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="glass-button bg-accent-blue text-white flex-1 sm:flex-none">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Confirmar ${reserveFormData.type === 'apartado' ? 'Apartado' : 'Separación'}`
              )}
            </Button>
          </div>
        </form>
      </Modal>
 
      {/* Reserve Detail Modal */}
      <Modal
        isOpen={isReserveDetailModalOpen}
        onClose={() => setIsReserveDetailModalOpen(false)}
        title={`Detalles de Reserva: ${selectedLot?.stage} - ${selectedLot?.lotNumber}`}
        size="lg"
      >
        {loadingReserveDetail ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-accent-blue" />
          </div>
        ) : reserveDetail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Cliente
                </h3>
                <div className="p-4 rounded-xl bg-glass-primary/10 border border-glass-border">
                  <p className="font-bold text-text-primary text-lg">{reserveDetail.reservationBy?.name || 'N/A'}</p>
                  <p className="text-sm text-text-secondary mt-1">C.C. {reserveDetail.reservationBy?.idNumber || 'N/A'}</p>
                  <p className="text-sm text-text-secondary">Tel: {reserveDetail.reservationBy?.phone || 'N/A'}</p>
                  <p className="text-sm text-text-secondary">Email: {reserveDetail.reservationBy?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Reservation Stats */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Vigencia
                </h3>
                <div className="p-4 rounded-xl bg-glass-primary/10 border border-glass-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Estado:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      reserveDetail.status === 'separado' ? 'bg-accent-purple/10 text-accent-purple' : 'bg-accent-blue/10 text-accent-blue'
                    }`}>
                      {reserveDetail.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Desde:</span>
                    <span className="text-sm font-medium text-text-primary">
                      {dayjs(reserveDetail.reservedAt).format('DD/MM/YYYY')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">Vence:</span>
                    <span className="text-sm font-bold text-accent-red">
                      {reserveDetail.expiresAt ? dayjs(reserveDetail.expiresAt).format('DD/MM/YYYY') : 'N/A'}
                    </span>
                  </div>
                  {reserveDetail.expiresAt && (
                    <p className="text-[10px] text-right text-text-muted mt-1">
                      (Quedan {dayjs(reserveDetail.expiresAt).diff(dayjs(), 'day')} días)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="elevated" className="p-4 bg-glass-secondary/50">
                <div className="flex items-center mb-2">
                  <Info className="w-4 h-4 mr-2 text-accent-blue" />
                  <span className="font-bold text-text-primary">Observaciones</span>
                </div>
                <p className="text-sm text-text-secondary italic">
                  {reserveDetail.reservationDetails || 'Sin observaciones registradas'}
                </p>
              </Card>

              <Card variant="elevated" className="p-4 bg-glass-secondary/50">
                <div className="flex items-center mb-2">
                  <UserPlus className="w-4 h-4 mr-2 text-accent-green" />
                  <span className="font-bold text-text-primary">Ejecutivo Comercial</span>
                </div>
                <p className="text-sm text-text-secondary">
                  {reserveDetail.sellerId?.accountId?.fullName || 'No asignado'}
                </p>
                {reserveDetail.sellerId?.accountId?.email && (
                  <p className="text-xs text-text-muted mt-1">
                    {reserveDetail.sellerId.accountId.email}
                  </p>
                )}
              </Card>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-glass-border">
              {admin?.role !== 'vendedor' && (
                <Button 
                  onClick={() => {
                    setIsReleaseModalOpen(true);
                    setReleaseFormData({ reason: 'cancelacion_cliente', observations: '' });
                  }} 
                  variant="outline" 
                  className="glass-button text-accent-red hover:bg-accent-red/10 border-accent-red/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Reserva / Liberar Lote
                </Button>
              )}
              <Button onClick={() => setIsReserveDetailModalOpen(false)} className="glass-button bg-accent-blue text-white">
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-text-muted">
            No se pudieron cargar los detalles de la reserva
          </div>
        )}
      </Modal>

      {/* Release Modal */}
      <Modal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
        title="Liberar Lote / Cancelar Reserva"
        size="md"
      >
        <form onSubmit={handleReleaseLot} className="space-y-6 pt-2">
          <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl">
            <p className="text-sm text-accent-red font-medium">
              ¿Estás seguro de liberar este lote? Se eliminarán los datos del cliente actual y el lote volverá a estar disponible para la venta.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Motivo de liberación</label>
              <select
                value={releaseFormData.reason}
                onChange={(e) => setReleaseFormData(prev => ({ ...prev, reason: e.target.value }))}
                required
                className="w-full h-11 px-4 rounded-xl border border-glass-border bg-glass-primary/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all appearance-none"
              >
                <option value="cancelacion_cliente">Cancelación por parte del cliente</option>
                <option value="falta_pago">Falta de pago / Incumplimiento</option>
                <option value="error_registro">Error en el registro</option>
                <option value="otro">Otro motivo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-primary">Observaciones adicionales</label>
              <textarea
                value={releaseFormData.observations}
                onChange={(e) => setReleaseFormData(prev => ({ ...prev, observations: e.target.value }))}
                className="w-full h-24 p-4 rounded-xl border border-glass-border bg-glass-primary/50 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all resize-none"
                placeholder="Explica brevemente el motivo..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-glass-border">
            <Button type="button" variant="outline" onClick={() => setIsReleaseModalOpen(false)} className="glass-button">
              No, mantener reserva
            </Button>
            <Button type="submit" disabled={isSubmitting} className="glass-button bg-accent-red text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Liberando...
                </>
              ) : (
                'Confirmar Liberación'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
