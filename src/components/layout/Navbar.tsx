'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, User, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/Button'

interface NavbarProps {
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function Navbar({ onMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const router = useRouter()
  const { client, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="backdrop-blur-glass shadow-glass border-b border-glass-border sticky top-0 z-40" style={{backgroundColor: 'rgba(255, 255, 255, 0.08)'}}>
      <div className="px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Menu Toggle */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-xl glass-button hover:shadow-glow transition-all duration-300 min-h-[44px] min-w-[44px]"
            >
              {isMobileMenuOpen ? <X size={24} className="text-text-primary" /> : <Menu size={24} className="text-text-primary" />}
            </button>
            
            <div className="flex items-center ml-2 md:ml-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl mr-3 shadow-glow">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block text-lg font-semibold text-text-primary text-company-highlight">
                Portal Cliente
              </span>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-text-primary">
                {client?.fullName}
              </p>
              <p className="text-xs text-text-secondary">
                C.C. {client?.cedula}
              </p>
            </div>

            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-full shadow-glow">
              <span className="text-sm font-medium text-white">
                {client?.fullName?.charAt(0).toUpperCase()}
              </span>
            </div>

            <Button
              variant="glass"
              size="sm"
              onClick={handleLogout}
              className="flex hover:text-accent-red hover:border-accent-red/30 transition-colors px-2 xs:px-3 sm:px-4"
            >
              <LogOut size={16} className="sm:mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}