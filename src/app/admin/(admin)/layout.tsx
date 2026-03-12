'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  PhoneCall, 
  Upload, 
  Settings,
  Menu,
  X,
  LogOut,
  Building2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { BottomNavigation, QuickActionFAB, MobileBreadcrumbs, MobileHeader } from '@/components/ui/BottomNavigation'
import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: CreditCard, label: 'Pagos', href: '/admin/payments' },
  { icon: Users, label: 'Cartera', href: '/admin/portfolio' },
  { icon: Users, label: 'Clientes', href: '/admin/clients' },
  { icon: PhoneCall, label: 'Cobranzas', href: '/admin/collections' },
  { icon: Upload, label: 'Importar', href: '/admin/import' },
  { icon: Settings, label: 'Configuración', href: '/admin/settings' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isAuthenticated, admin, logout } = useAdminAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login')
    }
  }, [isAuthenticated, router])

  const getBreadcrumbs = () => {
    const path = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    breadcrumbs.push({ label: 'Inicio', href: '/admin/dashboard' })
    
    if (path.length > 1) {
      const currentPage = path[path.length - 1]
      const navItem = navItems.find(item => item.href.includes(currentPage))
      // Only add current page if it's different from dashboard
      if (navItem && pathname !== '/admin/dashboard') {
        breadcrumbs.push({ label: navItem.label, href: pathname })
      }
    }
    
    return breadcrumbs
  }

  const getCurrentPageInfo = () => {
    const currentPath = pathname
    const navItem = navItems.find(item => 
      item.href === currentPath || 
      (item.href !== '/admin/dashboard' && currentPath.startsWith(item.href))
    )
    
    return {
      title: navItem?.label || 'Dashboard',
      subtitle: admin?.fullName || 'Admin User'
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  if (!isAuthenticated) {
    return null
  }

  const currentPageInfo = getCurrentPageInfo()

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Enhanced Mobile Header */}
      <MobileHeader 
        title={currentPageInfo.title}
        subtitle={currentPageInfo.subtitle}
        onMenuToggle={() => setIsSidebarOpen(true)}
        isMenuOpen={isSidebarOpen}
      />
      
      {/* Mobile Breadcrumbs */}
      <MobileBreadcrumbs breadcrumbs={getBreadcrumbs()} />

      <div className="flex">
        {/* Enhanced Sidebar */}
        <div className={cn(
          'sidebar-admin',
          'transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header with enhanced branding */}
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-primary rounded-xl shadow-glow">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-text-primary">Admin Panel</h2>
                  <p className="text-sm text-text-secondary">Alicante Cobranza</p>
                </div>
              </div>
              
              {/* Enhanced close button for mobile */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-3 rounded-xl glass-button hover:text-accent-red hover:bg-accent-red/20 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Navigation with enhanced styling */}
            <nav className="flex-1 px-4 py-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={cn(
                        'flex items-center px-3 sm:px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 min-h-[48px] relative',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        isActive 
                          ? 'bg-gradient-primary text-white shadow-glow' 
                          : 'glass-button hover:shadow-glow hover:text-accent-blue hover:bg-accent-blue/10'
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                      )}
                      
                      <Icon className={cn(
                        'w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 transition-colors flex-shrink-0',
                        isActive ? 'text-white' : 'text-text-secondary'
                      )} />
                      <span className={cn(
                        'truncate',
                        isActive ? 'text-white' : 'text-text-primary'
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Enhanced User Profile Section */}
            <div className="p-4 border-t border-glass-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                    <span className="text-sm font-medium text-white">
                      {admin?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {admin?.fullName || 'Admin User'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {admin?.role || 'ADMIN'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-xl glass-button hover:text-accent-red hover:bg-accent-red/20 transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-dark-primary/90 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          {/* Desktop Header */}
          <header className="admin-header flex-shrink-0 hidden lg:block">
            <div className="flex items-center justify-between px-4 py-4">
              <nav className="overflow-hidden">
                <div className="flex items-center space-x-1 sm:space-x-2 text-sm">
                  {getBreadcrumbs().map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center flex-shrink-0">
                      {index > 0 && (
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-text-muted mx-1 sm:mx-2 flex-shrink-0" />
                      )}
                      <span className={cn(
                        'truncate text-xs sm:text-sm',
                        index === getBreadcrumbs().length - 1 
                          ? 'text-text-primary font-medium' 
                          : 'text-text-secondary hover:text-accent-blue'
                      )}>
                        {crumb.label}
                      </span>
                    </div>
                  ))}
                </div>
              </nav>

              <div className="flex items-center space-x-3">
                <div className="text-right min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {admin?.fullName || 'Admin User'}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {admin?.email}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-white">
                    {admin?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content with padding for mobile navigation */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
      
      {/* Quick Action FAB */}
      <QuickActionFAB />
    </div>
  )
}