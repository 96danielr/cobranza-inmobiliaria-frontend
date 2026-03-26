'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { FullPageLoading } from '@/components/ui/LoadingSpinner'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { isAuthenticated, client } = useAuthStore()

  useEffect(() => {
    // Small delay to prevent flash
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login')
      } else {
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, router])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    const { logout } = useAuthStore.getState()
    logout()
    router.push('/login')
  }

  if (isLoading) {
    return <FullPageLoading message="Verificando autenticación..." />
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-dark-primary flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={closeMobileMenu}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Mobile Header with Menu Toggle */}
        <div className="md:hidden backdrop-blur-glass border-b border-glass-border p-4 flex items-center justify-between" style={{backgroundColor: 'rgba(255, 255, 255, 0.08)'}}>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-xl glass-button hover:shadow-glow transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow mr-3">
              <span className="text-xs font-medium text-white">
                {client?.fullName?.charAt(0)?.toUpperCase() || 'C'}
              </span>
            </div>
            <div className="text-right mr-3 hidden xs:block">
              <p className="text-sm font-medium text-text-primary">{client?.fullName}</p>
              <p className="text-xs text-text-secondary">C.C. {client?.cedula}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl glass-button hover:text-accent-red hover:bg-accent-red/20 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}