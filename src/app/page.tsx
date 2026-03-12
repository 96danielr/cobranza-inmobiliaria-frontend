'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { FullPageLoading } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/home')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return <FullPageLoading message="Redirigiendo..." />
}