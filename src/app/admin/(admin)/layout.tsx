'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { LogOut, Building2, ChevronRight, User, Settings as SettingsIcon } from 'lucide-react'
import { BottomNavigation, QuickActionFAB, MobileBreadcrumbs, MobileHeader } from '@/components/ui/BottomNavigation'
import { cn } from '@/lib/utils'
import { adminNavItems, type AdminNavRole } from '@/lib/adminNavItems'
import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useClickAway } from '@/hooks/useClickAway'

const roleLabels: Record<AdminNavRole, string> = {
  superadmin: 'Super Admin',
  tenant_admin: 'Admin Tenant',
  company_admin: 'Admin Empresa',
  agent: 'Agente',
  vendedor: 'Vendedor',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, _hasHydrated, admin, logout, selectedCompanyId, selectedCompanyName } = useAdminAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useClickAway(profileRef, () => setIsProfileOpen(false))

  useEffect(() => {
    if (!_hasHydrated) return // wait for localStorage hydration

    if (!isAuthenticated) {

      router.push('/admin/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  const getBreadcrumbs = () => {
    const path = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    breadcrumbs.push({ label: 'Inicio', href: '/admin/dashboard' })
    
    if (path.length > 1) {
      const currentPage = path[path.length - 1]
      const navItem = adminNavItems.find((item) => item.href.includes(currentPage))
      if (navItem && pathname !== '/admin/dashboard') {
        breadcrumbs.push({ label: navItem.label, href: pathname })
      }
    }
    
    return breadcrumbs
  }

  const getCurrentPageInfo = () => {
    const currentPath = pathname
    const navItem = adminNavItems.find((item) => 
      item.href === currentPath || 
      (item.href !== '/admin/dashboard' && currentPath.startsWith(item.href))
    )
    
    return {
      title: navItem?.label || 'Dashboard',
      subtitle: admin?.fullName || 'Admin User',
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const currentPageInfo = getCurrentPageInfo()
  const userRole = (admin?.role || 'agent') as AdminNavRole

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Enhanced Mobile Header */}
      <MobileHeader
        title={currentPageInfo.title}
        subtitle={selectedCompanyName || currentPageInfo.subtitle}
        onLogout={handleLogout}
      />
      
      {/* Mobile Breadcrumbs */}
      <MobileBreadcrumbs breadcrumbs={getBreadcrumbs()} />

      <div className="flex">
        {/* Enhanced Sidebar */}
        <div className="sidebar-admin">
          <div className="flex flex-col h-full">
            {/* Sidebar Header - System Name */}
            <div className="flex items-center px-6 py-4 border-b border-glass-border min-h-[73px]">
              <div className="flex items-center overflow-hidden">
                <div className="p-2 bg-gradient-primary rounded-lg shadow-glow flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3 min-w-0">
                  <h2 className="text-sm font-black text-text-primary truncate uppercase tracking-tighter">
                    Sistema Cobranza
                  </h2>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-0 lg:space-y-2">
                {adminNavItems
                  .filter((item) => {
                    const hasRole = item.roles.includes(userRole)
                    if (!hasRole) return false
                    if (item.module && !admin?.activeModules?.includes(item.module)) return false
                    return true
                  })
                  .map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href === 'logout' ? '#' : item.href}
                      onClick={(e) => {
                        if (item.href === 'logout') {
                          e.preventDefault()
                          handleLogout()
                        }
                      }}
                      className={cn(
                        'flex items-center px-3 sm:px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 min-h-[48px] relative',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        isActive 
                          ? 'bg-gradient-primary text-white shadow-glow' 
                          : 'glass-button hover:shadow-glow hover:text-accent-blue hover:bg-accent-blue/10',
                        item.href === 'logout' && 'hover:text-accent-red hover:bg-accent-red/10'
                      )}
                    >
                      {/* Active indicator (Desktop only) */}
                      {isActive && (
                        <div className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                      )}
                      
                      <Icon className={cn(
                        'w-6 h-6 lg:w-5 lg:h-5 mb-2 lg:mb-0 lg:mr-3 transition-colors flex-shrink-0',
                        isActive ? 'text-white' : 'text-text-secondary',
                        item.href === 'logout' && 'group-hover:text-accent-red'
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

            {/* Technical Info (Important for reviews/audits) */}
            <div className="p-5 border-t border-glass-border">
              <div className="flex flex-col space-y-2 opacity-80">
                <div className="flex flex-col">
                  <div className="flex items-center mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mr-2 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className="text-xs text-text-primary font-bold uppercase tracking-widest">
                      {roleLabels[userRole]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary font-mono truncate bg-dark-primary/30 px-2 py-1.5 rounded border border-glass-border/30">
                    {admin?.id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
          <header className="admin-header flex-shrink-0 hidden lg:block sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Left Side: Breadcrumbs */}
              <nav className="overflow-hidden min-w-0">
                <div className="flex items-center space-x-1 sm:space-x-2 text-sm">
                  {getBreadcrumbs().map((crumb, index) => (
                    <div key={crumb.href} className="flex items-center flex-shrink-0">
                      {index > 0 && (
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-text-muted mx-1 sm:mx-2 flex-shrink-0" />
                      )}
                      <Link 
                        href={crumb.href}
                        className={cn(
                          'truncate text-xs sm:text-sm transition-colors',
                          index === getBreadcrumbs().length - 1 
                            ? 'text-text-primary font-medium cursor-default pointer-events-none' 
                            : 'text-text-secondary hover:text-accent-blue'
                        )}
                      >
                        {crumb.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </nav>

              {/* Center: Company Name (Absolutely Centered) */}
              {selectedCompanyName && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center bg-accent-blue/10 px-6 py-2.5 rounded-2xl border border-accent-blue/20 shadow-lg shadow-accent-blue/5">
                  <Building2 className="w-5 h-5 text-accent-blue mr-3" />
                  <span className="text-sm font-black text-accent-blue tracking-wide uppercase">
                    {selectedCompanyName}
                  </span>
                </div>
              )}
                
              {/* Right Side: User Profile Dropdown */}
              <div ref={profileRef} className="relative flex items-center border-l border-glass-border pl-6 ml-4 flex-shrink-0">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 group hover:opacity-80 transition-all duration-200"
                >
                  <div className="text-right min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate transition-colors group-hover:text-accent-blue">
                      {admin?.fullName || 'Admin User'}
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {admin?.email}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-dark-secondary rounded-full flex items-center justify-center shadow-glow flex-shrink-0 border-2 border-transparent group-hover:border-accent-blue/50 transition-all duration-300 overflow-hidden">
                    {admin?.profileImage ? (
                      <img 
                        src={admin.profileImage} 
                        alt={admin.fullName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-accent-blue">
                        {admin?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-[60] shadow-glow"
                    >
                      <div className="px-3 py-2 border-b border-glass-border mb-1">
                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Mi Cuenta</p>
                      </div>
                      <Link
                        href="/admin/profile"
                        className="flex items-center px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-accent-blue/10 hover:text-accent-blue transition-all duration-200"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Perfil
                      </Link>
                      {userRole !== 'superadmin' && (
                        <Link
                          href="/admin/settings"
                          className="flex items-center px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-accent-blue/10 hover:text-accent-blue transition-all duration-200"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <SettingsIcon className="w-4 h-4 mr-3" />
                          Configuración
                        </Link>
                      )}
                      <div className="h-px bg-glass-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm text-accent-red hover:bg-accent-red/10 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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