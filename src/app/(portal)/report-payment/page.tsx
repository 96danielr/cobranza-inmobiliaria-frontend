'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, CreditCard, Upload, AlertCircle } from 'lucide-react'

import { apiClient } from '@/lib/api'
import { PortalHomeData } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FileUpload } from '@/components/ui/FileUpload'
import { CardSkeleton } from '@/components/ui/LoadingSpinner'

const bancos = [
  { value: 'Bancolombia', label: 'Bancolombia' },
  { value: 'Davivienda', label: 'Davivienda' },
  { value: 'Nequi', label: 'Nequi' },
  { value: 'Daviplata', label: 'Daviplata' },
  { value: 'Caja Social', label: 'Caja Social' },
  { value: 'Banco Agrario', label: 'Banco Agrario' },
  { value: 'Banco de Bogotá', label: 'Banco de Bogotá' },
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Otro', label: 'Otro' }
]

const reportPaymentSchema = z.object({
  contractId: z.string().min(1, 'Selecciona un contrato'),
  cuotaNumber: z.number().min(1, 'Selecciona una cuota'),
  amount: z.number().positive('El monto debe ser positivo'),
  banco: z.string().min(1, 'Selecciona el banco'),
  bancoOtro: z.string().optional(),
  fechaPago: z.string().min(1, 'Selecciona la fecha de pago')
}).refine((data) => {
  if (data.banco === 'Otro' && !data.bancoOtro) {
    return false
  }
  return true
}, {
  message: 'Especifica el banco',
  path: ['bancoOtro']
})

type ReportPaymentFormData = z.infer<typeof reportPaymentSchema>

interface CuotaOption {
  value: number
  label: string
  monto: number
  status: string
  diasMora?: number
}

export default function ReportPaymentPage() {
  const [homeData, setHomeData] = useState<PortalHomeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string>('')
  const [cuotasDisponibles, setCuotasDisponibles] = useState<CuotaOption[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const contractIdParam = searchParams.get('contractId')
  const cuotaParam = searchParams.get('cuota')

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<ReportPaymentFormData>({
    resolver: zodResolver(reportPaymentSchema),
    defaultValues: {
      contractId: contractIdParam || '',
      cuotaNumber: cuotaParam ? parseInt(cuotaParam) : undefined,
      fechaPago: new Date().toISOString().split('T')[0]
    }
  })

  const watchedContractId = watch('contractId')
  const watchedBanco = watch('banco')
  const watchedAmount = watch('amount')

  useEffect(() => {
    loadHomeData()
  }, [])

  useEffect(() => {
    if (homeData && watchedContractId) {
      updateCuotasDisponibles(watchedContractId)
    }
  }, [homeData, watchedContractId])

  const loadHomeData = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getHome()
      
      if (response.data.success) {
        setHomeData(response.data.data)
      } else {
        toast.error('Error cargando contratos')
        router.push('/home')
      }
    } catch (error) {
      toast.error('Error de conexión')
      router.push('/home')
    } finally {
      setIsLoading(false)
    }
  }

  const updateCuotasDisponibles = (contractId: string) => {
    const contract = homeData?.contracts.find(c => c.id === contractId)
    if (!contract) return

    const cuotas: CuotaOption[] = []
    const today = new Date()
    
    // Generate available cuotas (pending or overdue)
    for (let i = contract.cuotasPagadas + 1; i <= contract.totalCuotas; i++) {
      const fechaVencimiento = new Date()
      fechaVencimiento.setDate(contract.diaPago)
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + (i - contract.cuotasPagadas - 1))
      
      const diasMora = Math.max(0, Math.floor((today.getTime() - fechaVencimiento.getTime()) / (1000 * 3600 * 24)))
      const status = diasMora > 0 ? 'VENCIDA' : 'PENDIENTE'
      
      let label = `Cuota #${i} - `
      if (status === 'VENCIDA') {
        label += `Vencida (${diasMora} días de mora)`
      } else {
        label += `Vence ${formatDate(fechaVencimiento)}`
      }

      cuotas.push({
        value: i,
        label,
        monto: contract.valorCuota,
        status,
        diasMora: diasMora > 0 ? diasMora : undefined
      })
    }

    setCuotasDisponibles(cuotas)
    
    // Auto-select amount when cuota changes
    if (cuotas.length > 0) {
      const selectedCuota = cuotas.find(c => c.value === watch('cuotaNumber'))
      if (selectedCuota && !watchedAmount) {
        setValue('amount', selectedCuota.monto)
      }
    }
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setFileError('')

    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setFileError('Solo se permiten archivos JPG, PNG o PDF')
        setSelectedFile(null)
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('El archivo no puede ser mayor a 5MB')
        setSelectedFile(null)
        return
      }
    }
  }

  const onSubmit = async (data: ReportPaymentFormData) => {
    if (!selectedFile) {
      setFileError('Debes seleccionar un comprobante')
      return
    }

    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('contractId', data.contractId)
      formData.append('cuotaNumber', data.cuotaNumber.toString())
      formData.append('amount', data.amount.toString())
      formData.append('banco', data.banco === 'Otro' ? data.bancoOtro! : data.banco)
      formData.append('fechaPago', data.fechaPago)
      formData.append('comprobante', selectedFile)

      const response = await apiClient.reportPayment(formData)
      
      if (response.data.success) {
        toast.success('✅ Comprobante enviado correctamente. Lo revisaremos pronto.')
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/home')
        }, 2000)
      } else {
        toast.error(response.data.message || 'Error enviando el comprobante')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error de conexión')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    router.push('/home')
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in-up">
        <CardSkeleton lines={8} />
      </div>
    )
  }

  const contractOptions = homeData?.contracts.map(contract => ({
    value: contract.id,
    label: `Mz${contract.lote.manzana}-${contract.lote.nomenclatura} | Cuota ${formatCurrency(contract.valorCuota)}`
  })) || []

  const cuotaOptions = cuotasDisponibles.map(cuota => ({
    value: cuota.value.toString(),
    label: cuota.label
  }))

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 animate-fade-in-up">
        <Button
          variant="outline"
          onClick={handleGoBack}
          className="mb-4 glass-button min-h-[44px] touch-target"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex items-center">
          <Upload className="w-6 h-6 text-accent-blue mr-3" />
          <div>
            <h1 className="text-responsive-lg font-bold text-text-primary">
              Reportar Pago
            </h1>
            <p className="text-text-secondary text-responsive-base">
              Sube tu comprobante de pago para que lo revisemos
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card variant="elevated" className="glass-card animate-fade-in-up-delay">
        <CardHeader>
          <h2 className="text-responsive-base font-semibold text-text-primary">
            Información del Pago
          </h2>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Contract Selection */}
            <Controller
              name="contractId"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    label="Contrato"
                    options={contractOptions}
                    placeholder="Selecciona el contrato"
                    error={errors.contractId?.message}
                    className="glass-input"
                    {...field}
                  />
                </div>
              )}
            />

            {/* Cuota Selection */}
            <Controller
              name="cuotaNumber"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <div>
                  <Select
                    label="Número de Cuota"
                    options={cuotaOptions}
                    placeholder="Selecciona la cuota"
                    error={errors.cuotaNumber?.message}
                    value={value?.toString() || ''}
                    className="glass-input"
                    onChange={(e) => {
                      const cuotaNum = parseInt(e.target.value)
                      onChange(cuotaNum)
                      
                      // Auto-fill amount
                      const selectedCuota = cuotasDisponibles.find(c => c.value === cuotaNum)
                      if (selectedCuota) {
                        setValue('amount', selectedCuota.monto)
                      }
                    }}
                    {...field}
                  />
                </div>
              )}
            />

            {/* Amount */}
            <Controller
              name="amount"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <Input
                  label="Monto"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  error={errors.amount?.message}
                  value={value || ''}
                  onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                  helperText="Valor en pesos colombianos"
                  className="glass-input"
                  {...field}
                />
              )}
            />

            {/* Bank */}
            <Controller
              name="banco"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    label="Banco"
                    options={bancos}
                    placeholder="Selecciona el banco"
                    error={errors.banco?.message}
                    className="glass-input"
                    {...field}
                  />
                </div>
              )}
            />

            {/* Other Bank Input */}
            {watchedBanco === 'Otro' && (
              <Controller
                name="bancoOtro"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Especifica el banco"
                    placeholder="Nombre del banco"
                    error={errors.bancoOtro?.message}
                    className="glass-input"
                    {...field}
                  />
                )}
              />
            )}

            {/* Payment Date */}
            <Controller
              name="fechaPago"
              control={control}
              render={({ field }) => (
                <Input
                  label="Fecha del Pago"
                  type="date"
                  error={errors.fechaPago?.message}
                  max={new Date().toISOString().split('T')[0]}
                  min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="glass-input"
                  {...field}
                />
              )}
            />

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Comprobante de Pago *
              </label>
              <div className="glass-card p-4">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  value={selectedFile}
                  error={fileError}
                />
              </div>
            </div>

            {/* Info Alert */}
            <div className="glass-card border-accent-blue/20 p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-accent-blue mt-0.5 mr-3" />
                <div className="text-sm">
                  <p className="font-medium text-text-primary mb-1">
                    ¿Qué documentos puedo subir?
                  </p>
                  <ul className="text-text-secondary space-y-1">
                    <li>• Captura de pantalla del pago</li>
                    <li>• Recibo de consignación</li>
                    <li>• Comprobante de transferencia</li>
                    <li>• Foto del voucher (POS)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full glass-button shadow-glow min-h-[44px] touch-target"
              size="lg"
              loading={isSubmitting}
              disabled={!selectedFile}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Enviar Comprobante
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}