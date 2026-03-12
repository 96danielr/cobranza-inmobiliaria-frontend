'use client'

import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  FileText, 
  CreditCard, 
  Upload, 
  User, 
  LogOut 
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

const navigation = [
  {
    name: 'Inicio',
    href: '/home',
    icon: Home,
    description: 'Dashboard principal'
  },
  {
    name: 'Mis Pagos',
    href: '/payments',
    icon: CreditCard,
    description: 'Historial de pagos'
  },
  {
    name: 'Reportar Pago',
    href: '/report-payment',
    icon: Upload,
    description: 'Subir comprobante'
  },
  {
    name: 'Mi Perfil',
    href: '/profile',
    icon: User,
    description: 'Configuración de cuenta'
  }
]

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, client } = useAuthStore()

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose?.()
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'nav-desktop',
          'md:flex',
          isOpen ? 'flex' : 'hidden md:flex'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-glass-border">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 glass-card mr-3 shadow-glow">
                <Home className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Portal Cliente
                </h2>
                <p className="text-sm text-text-secondary">
                  Sistema Inmobiliario
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-glass-border md:hidden">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full mr-3 shadow-glow">
                <span className="text-lg font-medium text-white">
                  {client?.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {client?.fullName}
                </p>
                <p className="text-sm text-text-secondary">
                  C.C. {client?.cedula}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      'w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-300 group min-h-[56px]',
                      isActive
                        ? 'bg-gradient-primary text-white shadow-glow'
                        : 'glass-button hover:shadow-glow'
                    )}
                  >
                    <Icon 
                      className={cn(
                        'w-5 h-5 mr-3 transition-colors',
                        isActive ? 'text-white' : 'text-text-secondary group-hover:text-accent-blue'
                      )} 
                    />
                    <div>
                      <p className={cn(
                        'font-medium',
                        isActive ? 'text-white' : 'text-text-primary'
                      )}>{item.name}</p>
                      <p className={cn(
                        'text-xs',
                        isActive ? 'text-white/80' : 'text-text-muted'
                      )}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-glass-border">
            <Button
              variant="glass"
              className="w-full justify-start hover:text-accent-red hover:border-accent-red/30"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}