'use client'

import { useState, useEffect } from 'react'
import { 
  Map, 
  MapPin, 
  Ruler, 
  DollarSign, 
  Building2,
  Layers,
  ImagePlus,
  Eye,
  Search
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TableRowSkeleton } from '@/components/ui/LoadingSpinner'
import { portalApi } from '@/lib/portalApi'
import { formatCurrency, cn } from '@/lib/utils'

export default function MyLotsPage() {
  const [loading, setLoading] = useState(true)
  const [lots, setLots] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await portalApi.getLots()
        if (response.data.success) {
          setLots(response.data.data.lots)
        }
      } catch (error) {
        console.error('Error fetching my lots:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLots()
  }, [])

  const filteredLots = lots.filter(lot => 
    lot.lotNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.stage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.nomenclature?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-glass-secondary animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <TableRowSkeleton columns={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header matching Admin Style */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-responsive-2xl font-bold text-text-primary">Mis Propiedades</h1>
          <p className="text-text-secondary mt-2">
            Consulta el estado, área e imágenes de tus lotes adquiridos
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="glass-card px-4 py-2 border-accent-blue/30 rounded-xl flex items-center shadow-glow">
            <Layers className="w-4 h-4 text-accent-blue mr-2" />
            <span className="text-sm font-bold text-text-primary">{lots.length} Lotes Totales</span>
          </div>
        </div>
      </div>

      {/* Search matching Admin Style */}
      <Card variant="interactive" className="animate-fade-in-up animate-fade-in-up-delay">
        <CardContent className="p-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por etapa, nomenclatura o número de lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input"
              icon={Search}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lots Table - CLONED FROM ADMIN */}
      <Card variant="elevated" className="overflow-hidden animate-fade-in-up animate-fade-in-up-delay">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-20">
                <th className="text-left py-4 px-8 font-semibold text-text-primary bg-dark-secondary/80 backdrop-blur-md border-b border-glass-border">Lote / Etapa</th>
                <th className="text-left py-4 px-8 font-semibold text-text-primary bg-dark-secondary/80 backdrop-blur-md border-b border-glass-border">Área</th>
                <th className="text-left py-4 px-8 font-semibold text-text-primary bg-dark-secondary/80 backdrop-blur-md border-b border-glass-border">Precio Pactado</th>
                <th className="text-left py-4 px-8 font-semibold text-text-primary bg-dark-secondary/80 backdrop-blur-md border-b border-glass-border">Estado</th>
                <th className="text-left py-4 px-8 font-semibold text-text-primary bg-dark-secondary/80 backdrop-blur-md border-b border-glass-border">Imágenes</th>
                <th className="text-right py-4 px-8 font-semibold text-text-primary bg-dark-secondary/80 backdrop-blur-md border-b border-glass-border">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-text-muted">
                    <div className="flex flex-col items-center space-y-3">
                      <Building2 className="w-12 h-12 text-text-disabled opacity-20" />
                      <p className="text-lg font-medium">No se encontraron lotes registrados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => (
                  <tr key={lot._id} className="hover:bg-glass-primary/10 transition-colors group">
                    <td className="py-5 px-8">
                      <div>
                        <p className="font-bold text-text-primary group-hover:text-accent-blue transition-colors">
                          {lot.stage || '-'} - {lot.lotNumber}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                          Nomenclatura: {lot.nomenclature || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-text-secondary font-medium">
                      {lot.area ? `${lot.area} m²` : '-'}
                    </td>
                    <td className="py-5 px-8 text-text-primary font-black">
                      {lot.price ? formatCurrency(lot.price) : '-'}
                    </td>
                    <td className="py-5 px-8">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        lot.status === 'vendido' ? 'bg-accent-red/20 text-accent-red border-accent-red/30' :
                        lot.status === 'separado' ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30' :
                        lot.status === 'apartado' ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30' :
                        'bg-accent-green/20 text-accent-green border-accent-green/30'
                      )}>
                        {lot.status}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center">
                        {lot.images && lot.images.length > 0 ? (
                          <div className="flex -space-x-3">
                            {lot.images.slice(0, 3).map((img: string, i: number) => (
                              <div key={i} className="w-10 h-10 rounded-xl border-2 border-dark-primary overflow-hidden bg-glass-primary shadow-lg transition-transform group-hover:scale-110">
                                <img src={img} alt="lot" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {lot.images.length > 3 && (
                              <div className="w-10 h-10 rounded-xl border-2 border-dark-primary bg-glass-secondary flex items-center justify-center text-[10px] font-black text-text-primary backdrop-blur-md">
                                +{lot.images.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest italic">Sin fotos</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <Button
                        variant="glass"
                        size="sm"
                        className="h-10 w-10 rounded-xl border-accent-blue/20 text-accent-blue hover:bg-accent-blue/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Section matching Admin style cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
         <Card variant="elevated" className="bg-dark-secondary/50 border-dashed border-2 border-glass-border">
            <CardContent className="p-6 flex items-start space-x-4">
               <div className="p-3 bg-accent-blue/10 rounded-2xl text-accent-blue">
                  <MapPin className="w-6 h-6" />
               </div>
               <div>
                  <h4 className="font-bold text-text-primary">Detalles de Ubicación</h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Puedes solicitar la geolocalización exacta de tu lote y los planos de urbanismo a través de la línea de soporte.
                  </p>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}
