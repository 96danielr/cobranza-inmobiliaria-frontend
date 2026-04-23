'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/themeStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Apply theme on mount
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
