import { apiClient } from './api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest, ChangePinRequest } from '@/types'

export const authService = {
  async login(credentials: LoginRequest) {
    const { login } = useAuthStore.getState()
    return await login(credentials.cedula, credentials.pin)
  },

  async changePin(data: ChangePinRequest) {
    try {
      const response = await apiClient.changePin(data.currentPin, data.newPin)
      return {
        success: response.data.success,
        message: response.data.message
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error cambiando PIN'
      }
    }
  },

  logout() {
    const { logout } = useAuthStore.getState()
    logout()
  },

  getToken(): string | null {
    return useAuthStore.getState().token
  },

  isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated
  },

  getClient() {
    return useAuthStore.getState().client
  }
}