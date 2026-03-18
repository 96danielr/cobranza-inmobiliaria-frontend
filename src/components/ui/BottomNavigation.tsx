'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  PhoneCall, 
  Upload,
  Settings,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useAdminAuthStore } from '@/stores/adminAuthStore'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  shortLabel: string
  roles: ('tenant_admin' | 'company_admin' | 'agent')[]
}

const bottomNavItems: NavItem[] = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    href: '/admin/dashboard',
    shortLabel: 'Inicio',
    roles: ['tenant_admin', 'company_admin', 'agent']
  },
  { 
    icon: CreditCard, 
    label: 'Pagos', 
    href: '/admin/payments',
    shortLabel: 'Pagos',
    roles: ['tenant_admin', 'company_admin', 'agent']
  },
  { 
    icon: Building2, 
    label: 'Cartera', 
    href: '/admin/portfolio',
    shortLabel: 'Cartera',
    roles: ['tenant_admin', 'company_admin', 'agent']
  },
  { 
    icon: Users, 
    label: 'Clientes', 
    href: '/admin/clients',
    shortLabel: 'Clientes',
    roles: ['tenant_admin', 'company_admin', 'agent']
  },
  { 
    icon: PhoneCall, 
    label: 'Cobranzas', 
    href: '/admin/collections',
    shortLabel: 'Cobranzas',
    roles: ['tenant_admin', 'company_admin']
  }
]

export function BottomNavigation() {
  const pathname = usePathname()
  const { admin } = useAdminAuthStore()

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-dark-primary/80 backdrop-blur-glass border-t border-glass-border" />
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around py-2">
        {bottomNavItems
          .filter(item => item.roles.includes(admin?.role as any))
          .map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 min-h-[56px] min-w-[56px] relative',
                'hover:scale-105 active:scale-95',
                active
                  ? 'text-accent-blue'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {/* Active indicator */}
              {active && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-accent-blue rounded-full animate-fade-in" />
              )}
              
              {/* Icon with glow effect when active */}
              <div className={cn(
                'relative mb-1',
                active && 'drop-shadow-glow'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-all duration-300',
                  active && 'scale-110'
                )} />
                
                {/* Subtle glow background for active state */}
                {active && (
                  <div className="absolute inset-0 bg-accent-blue/20 rounded-full scale-150 blur-sm -z-10" />
                )}
              </div>
              
              {/* Label with responsive text */}
              <span className={cn(
                'text-xs font-medium transition-all duration-300 text-center',
                active ? 'text-accent-blue' : 'text-text-secondary',
                'max-w-[48px] leading-tight'
              )}>
                <span className="hidden xs:inline">{item.shortLabel}</span>
                <span className="xs:hidden">{item.shortLabel.slice(0, 4)}</span>
              </span>
            </Link>
          )
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-dark-primary/80" />
    </nav>
  )
}

// Enhanced Floating Action Button for quick actions
export function QuickActionFAB() {
  const pathname = usePathname()
  
  // Show different quick actions based on current page
  const getQuickAction = () => {
    if (pathname.startsWith('/admin/payments')) {
      return {
        icon: Upload,
        label: 'Subir Comprobante',
        action: () => console.log('Upload payment proof'),
        color: 'bg-accent-green hover:bg-accent-green/80'
      }
    }
    
    if (pathname.startsWith('/admin/collections')) {
      return {
        icon: PhoneCall,
        label: 'Nueva Campaña',
        action: () => console.log('New campaign'),
        color: 'bg-accent-purple hover:bg-accent-purple/80'
      }
    }
    
    if (pathname.startsWith('/admin/clients')) {
      return {
        icon: Users,
        label: 'Nuevo Cliente',
        action: () => console.log('New client'),
        color: 'bg-accent-blue hover:bg-accent-blue/80'
      }
    }
    
    // Default action
    return {
      icon: Settings,
      label: 'Configuración',
      action: () => console.log('Settings'),
      color: 'bg-glass-primary hover:bg-glass-secondary'
    }
  }
  
  const quickAction = getQuickAction()
  const Icon = quickAction.icon
  
  return (
    <button
      onClick={quickAction.action}
      className={cn(
        'fixed bottom-20 right-4 z-40 lg:hidden',
        'w-14 h-14 rounded-full shadow-glow',
        'flex items-center justify-center',
        'transition-all duration-300 hover:scale-110 active:scale-95',
        'border border-glass-border backdrop-blur-glass',
        quickAction.color
      )}
      title={quickAction.label}
    >
      <Icon className="w-6 h-6 text-white" />
    </button>
  )
}

// Mobile breadcrumbs component
export function MobileBreadcrumbs({ breadcrumbs }: { breadcrumbs: Array<{ label: string, href: string }> }) {
  if (breadcrumbs.length <= 1) return null
  
  return (
    <div className="lg:hidden px-4 py-2 border-b border-glass-border bg-dark-primary/50 backdrop-blur-glass">
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center flex-shrink-0">
            {index > 0 && (
              <div className="w-2 h-2 bg-text-muted rounded-full mx-2 opacity-50" />
            )}
            <span className={cn(
              'text-sm px-3 py-1.5 rounded-full whitespace-nowrap min-h-[36px] flex items-center',
              index === breadcrumbs.length - 1
                ? 'text-accent-blue bg-accent-blue/20 font-medium'
                : 'text-text-secondary bg-glass-primary/30'
            )}>
              {crumb.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Enhanced mobile header
export function MobileHeader({ 
  title, 
  subtitle,
  onMenuToggle,
  isMenuOpen 
}: { 
  title: string
  subtitle?: string
  onMenuToggle: () => void
  isMenuOpen: boolean
}) {
  return (
    <div className="lg:hidden bg-dark-primary/80 backdrop-blur-glass border-b border-glass-border sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Menu toggle with enhanced animation */}
        <button
          onClick={onMenuToggle}
          className={cn(
            'p-3 rounded-xl transition-all duration-300 min-h-[44px] min-w-[44px]',
            'flex items-center justify-center relative',
            'glass-button hover:shadow-glow',
            isMenuOpen && 'bg-accent-blue/20 text-accent-blue'
          )}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {/* Animated hamburger icon */}
          <div className="w-6 h-6 flex flex-col justify-center items-center relative">
            <span className={cn(
              'block h-0.5 w-6 bg-current transition-all duration-300 absolute',
              isMenuOpen ? 'rotate-45' : '-translate-y-1.5'
            )} />
            <span className={cn(
              'block h-0.5 w-6 bg-current transition-all duration-300',
              isMenuOpen ? 'opacity-0' : 'opacity-100'
            )} />
            <span className={cn(
              'block h-0.5 w-6 bg-current transition-all duration-300 absolute',
              isMenuOpen ? '-rotate-45' : 'translate-y-1.5'
            )} />
          </div>
        </button>
        
        {/* Title and subtitle */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-lg font-bold text-text-primary truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Right side placeholder for balance */}
        <div className="w-[44px]" />
      </div>
    </div>
  )
}