import { apiAdmin } from './api'
import { useAdminAuthStore } from '@/stores/adminAuthStore'

const getCompanyId = (): string => {
  return useAdminAuthStore.getState().selectedCompanyId || ''
}

export const aiApi = {
  ask: async (question: string, history: any[] = [], signal?: AbortSignal) => {
    // Get token from the store (similar to how api.ts does it)
    const adminAuthData = localStorage.getItem('admin-auth-storage')
    let token = ''
    if (adminAuthData) {
      const parsed = JSON.parse(adminAuthData)
      token = parsed.state?.token || parsed.token
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    
    return fetch(`${API_URL}/ai/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        question,
        history,
        companyId: getCompanyId()
      }),
      signal
    })
  }
}
