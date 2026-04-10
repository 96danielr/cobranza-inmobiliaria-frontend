'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Building2, 
  Upload, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  Download,
  Loader2
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
import toast from 'react-hot-toast'

export default function BanksPage() {
  const { admin } = useAdminAuthStore()
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Server-side pagination
  const fetchBanks = useCallback(async (page: number, limit: number, search?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') => {
    const response = await adminApi.getBanks(page, limit, search, sortBy, sortOrder)
    if (response.data.success) {
      return {
        data: response.data.data.banks,
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        limit: response.data.data.pagination.limit,
        pages: response.data.data.pagination.pages
      }
    }
    throw new Error('Error al cargar bancos')
  }, [])

  const pagination = useServerPagination({
    initialLimit: 50,
    fetchData: fetchBanks
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const response = await adminApi.uploadBanksExcel(formData)
      if (response.data.success) {
        setImportResult(response.data.summary)
        toast.success('Bancos importados correctamente')
        pagination.refresh()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al importar bancos')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteBank = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este banco?')) return
    try {
      await adminApi.deleteBank(id)
      toast.success('Banco eliminado')
      pagination.refresh()
    } catch (error) {
      toast.error('Error al eliminar banco')
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Gestión de Bancos</h1>
          <p className="text-text-secondary mt-2">
            Administra los bancos de tu empresa y consulta el listado oficial.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="glass-button border-glass-border"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Carga Masiva
          </Button>
          <Button 
            className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30"
            onClick={() => {
              setEditingBank(null)
              setIsAddModalOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Banco
          </Button>
        </div>
      </div>

      <Card variant="interactive">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, código o sigla..."
                value={pagination.search}
                onChange={(e) => pagination.handleSearch(e.target.value)}
                icon={Search}
                className="glass-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated" className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-20">
                <SortHeader 
                  label="TIPO" 
                  field="type" 
                  currentSortBy={pagination.sortBy} 
                  currentSortOrder={pagination.sortOrder} 
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                />
                <SortHeader 
                  label="CÓDIGO" 
                  field="code" 
                  currentSortBy={pagination.sortBy} 
                  currentSortOrder={pagination.sortOrder} 
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                />
                <SortHeader 
                  label="SIGLA" 
                  field="acronym" 
                  currentSortBy={pagination.sortBy} 
                  currentSortOrder={pagination.sortOrder} 
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                />
                <SortHeader 
                  label="DENOMINACIÓN SOCIAL" 
                  field="socialDenomination" 
                  currentSortBy={pagination.sortBy} 
                  currentSortOrder={pagination.sortOrder} 
                  onSort={pagination.handleSort}
                  className="text-left py-3 px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border"
                />
                <th className="text-left py-3 px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border">DELEGATURA</th>
                <th className="text-left py-3 px-6 font-semibold text-text-primary bg-glass-primary/95 backdrop-blur-glass border-b border-glass-border text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {pagination.loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))
              ) : pagination.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Building2 className="w-12 h-12 text-text-disabled" />
                      <p className="text-lg font-medium text-text-secondary">No hay bancos registrados</p>
                      <Button variant="glass" onClick={() => setIsImportModalOpen(true)}>Importar desde Excel</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                pagination.data.map((bank: any) => (
                  <tr key={bank._id} className="border-b border-glass-border hover:bg-glass-primary/10 transition-colors">
                    <td className="py-4 px-6 text-sm text-text-secondary">{bank.type}</td>
                    <td className="py-4 px-6 font-bold text-text-primary">{bank.code}</td>
                    <td className="py-4 px-6 text-sm text-accent-blue font-medium">{bank.acronym || '---'}</td>
                    <td className="py-4 px-6 font-medium text-text-primary">{bank.socialDenomination}</td>
                    <td className="py-4 px-6 text-xs text-text-muted">{bank.competentDelegation}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {(!bank.tenantId && admin?.role === 'superadmin') || bank.tenantId ? (
                          <Button 
                            variant="glass" 
                            size="sm" 
                            onClick={() => handleDeleteBank(bank._id)} 
                            className="text-accent-red hover:bg-accent-red/20"
                            title={!bank.tenantId ? 'Desactivar Banco Global' : 'Eliminar Banco'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-text-muted italic">Global</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-glass-border px-4 py-3">
          <PaginationControls
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={pagination.goToPage}
            onLimitChange={pagination.changeLimit}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
          />
        </div>
      </Card>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          setSelectedFile(null)
          setImportResult(null)
        }}
        title="Importar Bancos (SFC)"
        size="md"
      >
        <div className="space-y-6">
          {!importResult ? (
            <>
              <div className="p-6 border-2 border-dashed border-glass-border rounded-xl text-center hover:border-accent-blue transition-colors relative group">
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-accent-blue" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {selectedFile ? selectedFile.name : 'Selecciona el archivo Excel'}
                    </h4>
                    <p className="text-xs text-text-secondary mt-1">Formatos soportados: .xlsx, .xls</p>
                  </div>
                </div>
              </div>

              <div className="bg-glass-primary/30 rounded-lg p-4 text-xs text-text-secondary leading-relaxed">
                <p className="font-bold mb-2 flex items-center text-accent-yellow">
                  <AlertCircle className="w-4 h-4 mr-1" /> Requisitos del archivo:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Columnas esperadas: <strong>TIPO, CÓDIGO, DELEGATURA COMPETENTE, DENOMINACIÓN SOCIAL, SIGLA</strong>.</li>
                  <li>El sistema evitará duplicados basados en el CÓDIGO del banco.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="glass" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                <Button 
                  disabled={!selectedFile || isImporting} 
                  onClick={handleImport}
                  className="bg-accent-blue text-white shadow-glow"
                >
                  {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Procesar archivo
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-6 text-center py-4">
              <div className="w-20 h-20 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-accent-green" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">¡Importación Completada!</h3>
                <p className="text-text-secondary mt-1">Los bancos han sido procesados correctamente.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-glass-primary/20 p-4 rounded-xl border border-glass-border">
                  <p className="text-2xl font-black text-accent-green">{importResult.created}</p>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Creados</p>
                </div>
                <div className="bg-glass-primary/20 p-4 rounded-xl border border-glass-border">
                  <p className="text-2xl font-black text-accent-yellow">{importResult.skipped}</p>
                  <p className="text-xs text-text-secondary uppercase tracking-wider">Omitidos/Duplicados</p>
                </div>
              </div>

              <Button className="w-full" onClick={() => setIsImportModalOpen(false)}>Cerrar y Ver Resultados</Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingBank ? 'Editar Banco' : 'Nuevo Banco'}
        size="md"
      >
        <form onSubmit={async (e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const data = Object.fromEntries(formData.entries())
          try {
            if (editingBank) {
              await adminApi.updateBank(editingBank._id, data)
              toast.success('Banco actualizado')
            } else {
              await adminApi.createBank(data)
              toast.success('Banco creado')
            }
            setIsAddModalOpen(false)
            pagination.refresh()
          } catch (error) {
            toast.error('Error al guardar banco')
          }
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sigla (ID Único)</label>
              <Input name="acronym" defaultValue={editingBank?.acronym} placeholder="BCOL" required className="glass-input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Código</label>
              <Input name="code" defaultValue={editingBank?.code} placeholder="007" required className="glass-input" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Denominación Social</label>
            <Input name="socialDenomination" defaultValue={editingBank?.socialDenomination} placeholder="BANCO COLCUOTAS" required className="glass-input" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Input name="type" defaultValue={editingBank?.type || 'ESTABLECIMIENTO BANCARIO'} className="glass-input" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Delegatura</label>
            <Input name="competentDelegation" defaultValue={editingBank?.competentDelegation} className="glass-input" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="glass" type="button" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-accent-blue text-white shadow-glow">
              {editingBank ? 'Actualizar' : 'Crear'} Banco
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
