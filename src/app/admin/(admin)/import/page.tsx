'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Eye,
  Users,
  MapPin,
  FileText,
  DollarSign
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatsCardSkeleton, ModalContentSkeleton } from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/adminApi'

interface ImportResult {
  success: boolean
  message?: string
  summary: {
    totalRows: number
    firmadoRows: number
    clientsCreated: number
    clientsUpdated: number
    lotsCreated: number
    contractsCreated: number
    paymentsRegistered: number
    rowsSkipped: number
    rowsProcessed: number
  }
  errors: string[]
  warnings: string[]
}

interface ImportProgress {
  isImporting: boolean
  progress: number
  currentStep: string
  result?: ImportResult
}

export default function ImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    isImporting: false,
    progress: 0,
    currentStep: ''
  })
  const [showResultModal, setShowResultModal] = useState(false)
  const [showErrorsModal, setShowErrorsModal] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock import steps and progress
  const importSteps = [
    'Validando archivo...',
    'Procesando clientes...',
    'Creando lotes...',
    'Generando contratos...',
    'Registrando pagos...',
    'Finalizando importación...'
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelection = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no debe superar los 10MB')
      return
    }
    
    toast.success('Archivo cargado correctamente')

    setSelectedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const performRealImport = async () => {
    if (!selectedFile) return

    setImportProgress({
      isImporting: true,
      progress: 0,
      currentStep: 'Preparando archivo...'
    })

    try {
      // Create FormData with the file
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Update progress
      setImportProgress(prev => ({
        ...prev,
        progress: 20,
        currentStep: 'Subiendo archivo al servidor...'
      }))

      // Call the real API
      const response = await adminApi.uploadExcel(formData)
      const result: ImportResult = response.data

      // Update progress
      setImportProgress(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'Importación completada',
        result: result
      }))

      // Show results
      setLoadingResults(true)
      setShowResultModal(true)
      
      // Simulate loading time for results processing
      setTimeout(() => {
        setLoadingResults(false)
        if (result.success) {
          toast.success(`Importación completada: ${result.summary.clientsCreated} clientes procesados`)
        } else {
          toast.error(result.message || 'Error en la importación')
        }
      }, 1000)

    } catch (error: any) {
      console.error('Error en importación:', error)
      
      // Handle different error cases
      let errorMessage = 'Error desconocido en la importación'
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      const errorResult: ImportResult = {
        success: false,
        message: errorMessage,
        summary: {
          totalRows: 0,
          firmadoRows: 0,
          clientsCreated: 0,
          clientsUpdated: 0,
          lotsCreated: 0,
          contractsCreated: 0,
          paymentsRegistered: 0,
          rowsSkipped: 0,
          rowsProcessed: 0
        },
        errors: [errorMessage],
        warnings: []
      }

      setImportProgress({
        isImporting: false,
        progress: 0,
        currentStep: 'Error en la importación',
        result: errorResult
      })

      setLoadingResults(true)
      setShowResultModal(true)
      
      setTimeout(() => {
        setLoadingResults(false)
        toast.error(errorMessage)
      }, 500)
    }
  }

  const handleStartImport = () => {
    if (!selectedFile) return
    performRealImport()
  }

  const resetImport = () => {
    setSelectedFile(null)
    setImportProgress({
      isImporting: false,
      progress: 0,
      currentStep: ''
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    // In a real app, this would download an actual Excel template
    toast.success('Descargando plantilla Excel...')
    // Simulate download delay
    setTimeout(() => {
      toast.success('Plantilla descargada correctamente')
    }, 1000)
  }

  const handleExportData = async () => {
    try {
      toast.loading('Generando archivo de exportación...', { id: 'export-toast' })
      const response = await adminApi.exportExcel()
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `export-cobranza-${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Datos exportados correctamente', { id: 'export-toast' })
    } catch (error) {
      console.error('Error al exportar:', error)
      toast.error('Error al exportar los datos', { id: 'export-toast' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Importar Datos</h1>
          <p className="text-text-secondary mt-2">
            Importa clientes, lotes, contratos y pagos desde archivos Excel o CSV
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={downloadTemplate} className="glass-button">
            <Download className="w-4 h-4 mr-2" />
            Descargar Plantilla
          </Button>
          <Button 
            variant="primary" 
            onClick={handleExportData}
            className="bg-accent-purple/20 text-accent-purple border-accent-purple/30 hover:bg-accent-purple/30"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Datos (DB)
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-text-primary mb-3">Instrucciones de Importación</h3>
          <div className="space-y-3 text-sm text-text-secondary">
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-accent-blue/15 text-accent-blue rounded-full flex items-center justify-center text-xs font-medium mr-3">
                1
              </span>
              <div>
                <p className="font-medium text-text-primary">Descarga la plantilla</p>
                <p>Usa la plantilla Excel proporcionada para asegurar el formato correcto</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-accent-blue/15 text-accent-blue rounded-full flex items-center justify-center text-xs font-medium mr-3">
                2
              </span>
              <div>
                <p className="font-medium text-text-primary">Completa la información</p>
                <p>Llena todas las columnas obligatorias: Cliente, Cédula, Teléfono, Proyecto, Lote, etc.</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-accent-blue/15 text-accent-blue rounded-full flex items-center justify-center text-xs font-medium mr-3">
                3
              </span>
              <div>
                <p className="font-medium text-text-primary">Sube el archivo</p>
                <p>Arrastra y suelta el archivo o usa el botón de carga. Máximo 10MB.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          {!selectedFile ? (
            <div
              className={`
                drag-drop-area p-8 text-center transition-all duration-300
                ${dragActive ? 'drag-active' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-glass-primary/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-glass-border">
                    <Upload className="w-8 h-8 text-text-muted" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-responsive-lg font-medium text-text-primary mb-1">
                    Arrastra y suelta tu archivo aquí
                  </h3>
                  <p className="text-text-secondary">
                    o <button className="text-accent-blue hover:text-accent-blue/80 font-medium transition-colors">
                      haz clic para seleccionar
                    </button>
                  </p>
                </div>
                
                <p className="text-sm text-text-muted">
                  Archivos soportados: Excel (.xlsx, .xls) y CSV • Máximo 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* Selected File */}
              <div className="flex items-center justify-between p-4 bg-glass-primary/30 backdrop-blur-glass border border-glass-border rounded-lg">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-8 h-8 text-accent-green mr-3" />
                  <div>
                    <p className="font-medium text-text-primary">{selectedFile.name}</p>
                    <p className="text-sm text-text-muted">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={resetImport}
                  disabled={importProgress.isImporting}
                  className="glass-button min-h-[44px] min-w-[44px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Import Progress */}
              {importProgress.isImporting && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {importProgress.currentStep}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {Math.round(importProgress.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-glass-primary/30 rounded-full h-2">
                    <div 
                      className="bg-accent-blue h-2 rounded-full transition-all duration-500"
                      style={{ width: `${importProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Import Button */}
              {!importProgress.isImporting && !importProgress.result && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleStartImport}
                    size="lg"
                    className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/30 min-h-[44px]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Iniciar Importación
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Resultado de la Importación"
        size="lg"
      >
        {loadingResults ? (
          <div className="space-y-6">
            <StatsCardSkeleton className="h-20" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCardSkeleton className="h-24" />
              <StatsCardSkeleton className="h-24" />
              <StatsCardSkeleton className="h-24" />
              <StatsCardSkeleton className="h-24" />
            </div>
            <StatsCardSkeleton className="h-16" />
          </div>
        ) : importProgress.result ? (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="flex items-center p-4 bg-accent-green/15 border border-accent-green/20 rounded-lg">
              <CheckCircle className="w-8 h-8 text-accent-green mr-3" />
              <div>
                <h3 className="font-medium text-text-primary">
                  ¡Importación Completada Exitosamente!
                </h3>
                <p className="text-sm text-text-secondary">
                  Los datos se han importado correctamente al sistema
                </p>
              </div>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card hover:shadow-glow rounded-lg p-4 text-center">
                <Users className="w-8 h-8 text-accent-blue mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">
                  {importProgress.result.summary.clientsCreated}
                </p>
                <p className="text-sm text-text-secondary">Clientes</p>
              </div>
              
              <div className="bg-accent-green/15 border border-accent-green/20 rounded-lg p-4 text-center">
                <MapPin className="w-8 h-8 text-accent-green mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">
                  {importProgress.result.summary.lotsCreated}
                </p>
                <p className="text-sm text-text-secondary">Lotes</p>
              </div>
              
              <div className="glass-card hover:shadow-glow rounded-lg p-4 text-center">
                <FileText className="w-8 h-8 text-accent-purple mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">
                  {importProgress.result.summary.contractsCreated}
                </p>
                <p className="text-sm text-text-secondary">Contratos</p>
              </div>
              
              <div className="glass-card hover:shadow-glow rounded-lg p-4 text-center">
                <DollarSign className="w-8 h-8 text-accent-yellow mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">
                  {importProgress.result.summary.paymentsRegistered}
                </p>
                <p className="text-sm text-text-secondary">Pagos</p>
              </div>
            </div>

            {/* Errors Summary */}
            {(importProgress.result.errors.length > 0 || importProgress.result.warnings.length > 0) && (
              <div className="space-y-3">
                {importProgress.result.errors.length > 0 && (
                  <div className="bg-accent-red/15 border border-accent-red/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-accent-red mr-2" />
                        <span className="font-medium text-accent-red">
                          {importProgress.result.errors.length} errores encontrados
                        </span>
                      </div>
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => setShowErrorsModal(true)}
                        className="glass-button text-accent-red hover:text-accent-red/80 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalles
                      </Button>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Se encontraron errores críticos durante la importación
                    </p>
                  </div>
                )}
                
                {importProgress.result.warnings.length > 0 && (
                  <div className="bg-accent-yellow/15 border border-accent-yellow/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-accent-yellow mr-2" />
                        <span className="font-medium text-accent-yellow">
                          {importProgress.result.warnings.length} advertencias
                        </span>
                      </div>
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => setShowErrorsModal(true)}
                        className="glass-button text-accent-yellow hover:text-accent-yellow/80 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalles
                      </Button>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Algunos datos se ajustaron automáticamente
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-glass-border">
              <Button
                variant="glass"
                onClick={resetImport}
                className="min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Nueva Importación
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowResultModal(false)}
                className="min-h-[44px]"
              >
                Finalizar
              </Button>
            </div>
          </div>
        ) : (
          <ModalContentSkeleton />
        )}
      </Modal>

      {/* Errors Detail Modal */}
      <Modal
        isOpen={showErrorsModal}
        onClose={() => setShowErrorsModal(false)}
        title="Errores de Importación"
        size="xl"
      >
        {importProgress.result ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-glass-primary/20 border border-glass-border rounded-lg p-4">
              <h4 className="font-medium text-text-primary mb-2">Resumen de Procesamiento</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Total de filas:</span>
                  <span className="ml-2 font-medium text-text-primary">{importProgress.result.summary.totalRows}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Filas FIRMADO:</span>
                  <span className="ml-2 font-medium text-text-primary">{importProgress.result.summary.firmadoRows}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Filas procesadas:</span>
                  <span className="ml-2 font-medium text-text-primary">{importProgress.result.summary.rowsProcessed}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Filas omitidas:</span>
                  <span className="ml-2 font-medium text-text-primary">{importProgress.result.summary.rowsSkipped}</span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {importProgress.result.errors.length > 0 && (
              <div className="space-y-4">
                <div className="bg-accent-red/15 border border-accent-red/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-accent-red mr-2" />
                    <span className="font-medium text-accent-red">
                      {importProgress.result.errors.length} errores encontrados
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Errores críticos que impidieron el procesamiento
                  </p>
                </div>

                <div className="space-y-2">
                  {importProgress.result.errors.map((error, index) => (
                    <div key={index} className="bg-accent-red/10 border border-accent-red/20 rounded p-3">
                      <p className="text-sm text-accent-red font-mono">{error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {importProgress.result.warnings.length > 0 && (
              <div className="space-y-4">
                <div className="bg-accent-yellow/15 border border-accent-yellow/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-accent-yellow mr-2" />
                    <span className="font-medium text-accent-yellow">
                      {importProgress.result.warnings.length} advertencias
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    Datos que se ajustaron automáticamente durante el procesamiento
                  </p>
                </div>

                <div className="space-y-2">
                  {importProgress.result.warnings.map((warning, index) => (
                    <div key={index} className="bg-accent-yellow/10 border border-accent-yellow/20 rounded p-3">
                      <p className="text-sm text-accent-yellow">{warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-glass-border">
              <Button onClick={() => setShowErrorsModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <ModalContentSkeleton />
        )}
      </Modal>
    </div>
  )
}