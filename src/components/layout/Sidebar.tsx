'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  FileText, 
  CreditCard, 
  Upload, 
  User, 
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
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
  },
  {
    name: 'Cerrar Sesión',
    href: 'logout',
    icon: LogOut,
    description: 'Salir de la cuenta'
  }
]

export function Sidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, client } = useAuthStore()
  const { theme } = useThemeStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && theme === 'light'
    ? '/PERFIL FONDO BLANCO.jpeg'
    : '/PERFIL PARA FONDOS OSCUROS SOLO NOMBRE EMPRESA.png'

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
          'md:flex transition-all duration-300',
          isOpen ? 'flex' : 'hidden md:flex',
          isCollapsed ? 'md:w-0 md:border-r-0 md:opacity-0 md:pointer-events-none md:overflow-hidden' : 'md:w-64'
        )}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">
          <div className="p-4 border-b border-glass-border flex justify-between items-center min-h-[73px]">
            <div className="w-36 h-12 rounded-xl overflow-hidden glass-card shadow-glow border border-glass-border p-1 flex items-center justify-center animate-fade-in">
              <img 
                src={logoSrc} 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          <div className={cn("p-4 border-b border-glass-border md:hidden", isCollapsed && "md:hidden")}>
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

          <div className="flex-1 p-4 overflow-y-auto">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      if (item.href === 'logout') {
                        handleLogout()
                      } else {
                        handleNavigation(item.href)
                      }
                    }}
                    className={cn(
                      'w-full flex items-center rounded-xl transition-all duration-300 group min-h-[48px]',
                      isActive
                        ? 'bg-gradient-primary text-white shadow-glow'
                        : 'glass-button hover:shadow-glow',
                      item.href === 'logout' && 'hover:text-accent-red hover:bg-accent-red/10',
                      isCollapsed ? 'md:justify-center md:px-0' : 'px-4 py-3'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon 
                      className={cn(
                        'w-5 h-5 transition-colors shrink-0',
                        isActive ? 'text-white' : 'text-text-secondary group-hover:text-accent-blue',
                        item.href === 'logout' && 'group-hover:text-accent-red',
                        isCollapsed ? 'md:mr-0' : 'mr-3'
                      )} 
                    />
                    <div className={cn("text-left transition-all duration-300 w-full overflow-hidden", isCollapsed ? "md:hidden" : "block")}>
                      <p className={cn(
                        'font-medium text-sm leading-tight truncate',
                        isActive ? 'text-white' : 'text-text-primary'
                      )}>{item.name}</p>
                      {item.description && !isCollapsed && (
                        <p className={cn(
                          'text-[10px] truncate mt-0.5',
                          isActive ? 'text-white/80' : 'text-text-muted'
                        )}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-glass-border">
            <Button
              variant="glass"
              className={cn("w-full hover:text-accent-red hover:border-accent-red/30", isCollapsed ? "md:justify-center md:px-0" : "justify-start")}
              onClick={handleLogout}
              title={isCollapsed ? 'Cerrar Sesión' : undefined}
            >
              <LogOut className={cn("w-4 h-4", isCollapsed ? "md:mr-0" : "mr-2")} />
              <span className={cn(isCollapsed && "md:hidden")}>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}