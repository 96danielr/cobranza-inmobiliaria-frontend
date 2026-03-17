import { create } from 'zustand'
import { adminApi } from '@/lib/adminApi'

interface Client {
  _id: string
  name: string
  idNumber: string
  phone: string
  email?: string
  address?: string
  behavior: string
  excelRowId?: number
  createdAt: string
  _count?: {
    contracts: number
  }
}

interface ClientStore {
  clients: Client[]
  totalClients: number
  loading: boolean
  lastFetched: number | null
  
  // Actions
  setClients: (clients: Client[], total: number) => void
  fetchClientsIfNeeded: (force?: boolean) => Promise<void>
  clearCache: () => void
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  totalClients: 0,
  loading: false,
  lastFetched: null,

  setClients: (clients, total) => set({ 
    clients, 
    totalClients: total, 
    lastFetched: Date.now() 
  }),

  fetchClientsIfNeeded: async (force = false) => {
    const { lastFetched, loading } = get()
    
    // Cache for 5 minutes unless forced
    const CACHE_TIME = 5 * 60 * 1000
    const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_TIME)

    if (isCacheValid && !force) return
    if (loading) return

    set({ loading: true })
    try {
      // Use a high limit to get "all" (or at least a large first batch for dashboard counts)
      const response = await adminApi.getClients(1, 1000)
      if (response.data.success) {
        set({ 
          clients: response.data.data.clients, 
          totalClients: response.data.data.pagination.total,
          lastFetched: Date.now()
        })
      }
    } catch (error) {
      console.error('Error fetching clients for store:', error)
    } finally {
      set({ loading: false })
    }
  },

  clearCache: () => set({ clients: [], totalClients: 0, lastFetched: null }),
}))
