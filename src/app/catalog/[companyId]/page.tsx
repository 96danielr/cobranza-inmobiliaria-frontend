'use client'

import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { 
  Building2, 
  MapPin, 
  Maximize, 
  Search, 
  Bell,
  SlidersHorizontal,
  CheckCircle2,
  Home,
  Loader2,
  X,
  Heart,
  Bed,
  Bath,
  Car,
  User,
  ChevronLeft,
  Navigation2,
  Plus
} from 'lucide-react'
import { adminApi } from '@/lib/adminApi'
import { motion, AnimatePresence } from 'framer-motion'

interface Lot {
  _id: string
  stage: string
  nomenclature: string
  lotNumber: string
  area: number
  price?: number
  images?: string[]
}

// 1. Memoized Lot Card - Simplified SVG icons to reduce node count
const LotCard = memo(({ lot, onSelect, index }: { lot: Lot, onSelect: (l: Lot) => void, index: number }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div
      onClick={() => onSelect(lot)}
      className="cursor-pointer group"
    >
      <div className="bg-white rounded-[40px] p-4 shadow-xl shadow-gray-100 border border-gray-50 transition-all hover:shadow-2xl">
        <div className="relative aspect-[4/3] rounded-[30px] overflow-hidden mb-6 bg-gray-50">
          {lot.images && lot.images.length > 0 ? (
            <img 
              src={lot.images[0]} 
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
               <Building2 className="w-16 h-16" />
            </div>
          )}
          <div className="absolute top-5 left-5 bg-white/90 backdrop-blur px-5 py-2 rounded-2xl text-xs font-black text-gray-800 shadow-sm z-10">
             {lot.stage || 'Disponible'}
          </div>
        </div>
        <div className="px-2 mb-6 flex justify-between items-start">
           <div>
              <h3 className="text-xl font-black mb-1">Lote #{lot.lotNumber}</h3>
              <div className="flex items-center text-gray-400 text-sm font-bold">
                 <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                 <span className="truncate max-w-[120px]">Inmobiliaria</span>
              </div>
           </div>
           <div className="text-xl font-black text-gray-900">
              {lot.price ? formatCurrency(lot.price) : 'Consulte'}
           </div>
        </div>
        <div className="flex gap-4 px-2">
           <div className="flex items-center gap-2 bg-[#F5F5F7] px-4 py-2.5 rounded-2xl text-gray-900 font-bold text-xs uppercase tracking-wider">
              {lot.area}m²
           </div>
        </div>
      </div>
    </div>
  )
})

LotCard.displayName = 'LotCard'

// 2. Memoized Categories to avoid re-rendering list on filter modal toggle
const CategorySelector = memo(({ activeCategory, setActiveCategory }: any) => (
  <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-none mb-8">
    {['Cualquiera', 'Venta', 'Preventa', 'Lotes', 'Casas'].map(cat => (
      <button
        key={cat}
        onClick={() => setActiveCategory(cat)}
        className={`px-8 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border ${
          activeCategory === cat 
          ? 'bg-[#121212] text-white shadow-xl border-black' 
          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
))
CategorySelector.displayName = 'CategorySelector'

export default function CatalogPage() {
  const { companyId } = useParams()
  const [lots, setLots] = useState<Lot[]>([])
  const [company, setCompany] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Cualquiera')
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    department: '',
    municipality: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    nearMe: false
  })

  // Optimize Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearch(search) }, 400)
    return () => clearTimeout(handler)
  }, [search])

  useEffect(() => {
    if (!companyId) return
    adminApi.getCompanyPublic(companyId as string).then(res => {
      if (res.data.success) setCompany(res.data.data)
    })
  }, [companyId])

  useEffect(() => {
    if (!companyId) return
    const fetchLots = async () => {
      try {
        if (lots.length === 0) setLoading(true)
        const res = await adminApi.getLotsPublic(companyId as string, debouncedSearch)
        if (res.data.success) setLots(res.data.data)
      } catch (err) {

      } finally {
        setLoading(false)
      }
    }
    fetchLots()
  }, [companyId, debouncedSearch])

  const handleSelectLot = useCallback((lot: Lot) => { setSelectedLot(lot) }, [])

  // 3. Memoize the entire Lots List to prevent re-evaluation on modal toggle
  const MemoizedLotsList = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 min-h-[400px]">
      {lots.map((lot, index) => (
        <LotCard key={lot._id} lot={lot} index={index} onSelect={handleSelectLot} />
      ))}
    </div>
  ), [lots, handleSelectLot])

  if (loading && lots.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-black animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 pb-24 md:pb-12 overflow-x-hidden transition-colors duration-500">
      <AnimatePresence mode="wait">
        {!selectedLot ? (
          <motion.div 
            key="catalog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} // Very fast transition
            className="max-w-7xl mx-auto px-6 md:px-12 pt-8"
          >
            <div className="flex justify-between items-center mb-8">
               <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A]">Explorar</h1>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm relative">
                    <Bell className="w-6 h-6 text-gray-700" />
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  </div>
               </div>
            </div>

            <div className="flex gap-4 mb-8 max-w-2xl">
              <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input 
                  type="text" 
                  placeholder="Busca tu lote ideal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#F5F5F7] border-none rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-2 focus:ring-black/5 transition-all text-gray-800 font-medium placeholder:text-gray-400"
                />
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
              >
                 <SlidersHorizontal className="w-6 h-6" />
              </button>
            </div>

            <CategorySelector activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-bold">Mejores Ofertas</h2>
               <button className="text-sm font-semibold text-gray-400">Ver todos</button>
            </div>

            {MemoizedLotsList}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col min-h-screen bg-[#FDFDFD]"
          >
             <div className="max-w-4xl mx-auto w-full px-6 pt-8 pb-4 flex justify-between items-center bg-[#FDFDFD]/80 backdrop-blur sticky top-0 z-20">
                <button onClick={() => setSelectedLot(null)} className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm text-gray-800 active:scale-90 transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-lg font-bold">Detalle del Lote</h2>
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm text-gray-800">
                  <Heart className="w-6 h-6" />
                </div>
             </div>

             <div className="max-w-4xl mx-auto w-full px-6 overflow-y-auto pb-20 scrollbar-none">
                <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl mb-10 bg-gray-100">
                   {selectedLot.images && selectedLot.images.length > 0 ? (
                     <img src={selectedLot.images[0]} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-32 h-32 text-white/50" />
                     </div>
                   )}
                </div>

                <div className="flex justify-between items-start mb-8">
                   <div>
                       <h3 className="text-3xl font-black mb-1">{`Lote #${selectedLot.lotNumber}`}</h3>
                      <div className="flex items-center text-gray-400 font-bold">
                         <MapPin className="w-5 h-5 mr-1" />
                         Etapa {selectedLot.stage} - {company?.name || 'Inmobiliaria'}
                      </div>
                   </div>
                   <p className="text-3xl font-black text-gray-900">
                      {selectedLot.price ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(selectedLot.price) : 'Consulte'}
                   </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                   {[
                     { icon: Bed, val: "0", label: "Habitaciones" },
                     { icon: Bath, val: "0", label: "Baños" },
                     { icon: Car, val: "0", label: "Garaje" },
                     { icon: Maximize, val: selectedLot.area, label: "m² Área" }
                   ].map((feat, i) => (
                     <div key={i} className="bg-white border border-gray-100 p-6 rounded-[35px] flex flex-col items-center justify-center shadow-xl shadow-gray-50 transition-all hover:translate-y-[-4px]">
                        <feat.icon className="w-6 h-6 text-gray-300 mb-3" />
                        <p className="font-black text-xl">{feat.val}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{feat.label}</p>
                     </div>
                   ))}
                </div>

                <div className="mb-10">
                   <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Agente Inmobiliario</h4>
                   <div className="bg-white border border-gray-100 shadow-2xl shadow-gray-50 p-6 rounded-[40px] flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-[#F5F5F7] rounded-3xl flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-300" />
                         </div>
                         <div>
                             <p className="font-black text-lg">{company?.name || 'Inmobiliaria'}</p>
                             <p className="text-gray-400 text-sm font-bold italic">Asesor Autorizado</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => {
                          const msg = `Hola, me interesa el lote ${selectedLot.lotNumber}`
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
                        }}
                        className="bg-black text-white px-8 py-4 rounded-3xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Contactar
                      </button>
                  </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters Modal - Optimized for performance */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900">Filtros</h3>
                  <button onClick={() => setIsFilterModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full active:scale-90 transition-all">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
                  {/* ... same filter content with slight optimizations ... */}
                  <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={filters.department}
                      onChange={(e) => setFilters({...filters, department: e.target.value, municipality: ''})}
                      className="w-full bg-black text-white rounded-2xl py-4 px-4 outline-none font-bold text-sm cursor-pointer"
                    >
                      <option value="" className="bg-white text-black">Departamento</option>
                      {[{ code: '41', name: 'Huila' }, { code: '05', name: 'Antioquia' }].map(d => <option key={d.code} value={d.code} className="bg-white text-black">{d.name}</option>)}
                    </select>
                    <select 
                      value={filters.municipality}
                      onChange={(e) => setFilters({...filters, municipality: e.target.value})}
                      disabled={!filters.department}
                      className="w-full bg-black text-white rounded-2xl py-4 px-4 outline-none font-bold text-sm disabled:opacity-30 cursor-pointer"
                    >
                      <option value="" className="bg-white text-black">Municipio</option>
                      {filters.department === '41' && [{ code: '41551', name: 'Pitalito' }].map(m => <option key={m.code} value={m.code} className="bg-white text-black">{m.name}</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => setFilters({...filters, nearMe: !filters.nearMe})}
                    className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all active:scale-[0.98] ${
                      filters.nearMe ? 'border-black bg-black text-white shadow-xl' : 'border-gray-100 bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${filters.nearMe ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <Navigation2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm text-left">Lotes cerca de mí</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-10 flex gap-4">
                  <button onClick={() => setIsFilterModalOpen(false)} className="flex-[2] py-5 rounded-3xl font-black text-sm text-white bg-black active:scale-95 transition-all">
                    Aplicar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-50 md:hidden">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-full border border-white/20 shadow-2xl flex justify-between items-center">
          <button className={`flex-1 flex items-center justify-center h-14 rounded-full ${!selectedLot ? 'bg-black text-white' : 'text-gray-400'}`}>
             <Home className="w-6 h-6" />
          </button>
          <div className="w-16 h-14 flex items-center justify-center">
             <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white shadow-glow">
                <Plus className="w-6 h-6" />
             </div>
          </div>
          <button className="flex-1 flex items-center justify-center h-14 text-gray-400">
             <User className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
