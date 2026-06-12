'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { LogOut, User, Building2, ChevronRight, ChevronLeft } from 'lucide-react'
import { BottomNavigation, QuickActionFAB, MobileBreadcrumbs, MobileHeader } from '@/components/ui/BottomNavigation'
import { cn } from '@/lib/utils'
import { portalNavItems } from '@/lib/portalNavItems'
import { AnimatePresence, motion } from 'framer-motion'
import { useClickAway } from '@/hooks/useClickAway'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, _hasHydrated, admin, logout } = useAdminAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useClickAway(profileRef, () => setIsProfileOpen(false))

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (admin?.role !== 'cliente') {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, _hasHydrated, admin, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (!_hasHydrated || !isAuthenticated || admin?.role !== 'cliente') {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin shadow-glow" />
      </div>
    )
  }

  const currentNavItem = portalNavItems.find(i => i.href === pathname)

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Mobile Header - USING SAME COMPONENT AS ADMIN */}
      <MobileHeader
        title={currentNavItem?.label || 'Portal'}
        subtitle={admin?.fullName || 'Cliente'}
        onLogout={handleLogout}
      />

      <div className="flex">
        {/* SIDEBAR - USING EXACT SAME CLASSES AS ADMIN */}
        <div className={cn("sidebar-admin transition-all duration-300", isCollapsed ? "lg:w-20" : "lg:w-64")}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border min-h-[73px]">
              <div className="flex items-center overflow-hidden">
                <div className="p-2 bg-gradient-primary rounded-lg shadow-glow flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                  <div className="ml-3 min-w-0 animate-fade-in">
                    <h2 className="text-sm font-black text-text-primary truncate uppercase tracking-tighter">
                      Portal Cliente
                    </h2>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex p-1.5 rounded-lg hover:bg-glass-secondary text-text-secondary hover:text-accent-blue transition-all"
                title={isCollapsed ? "Expandir" : "Colapsar"}
              >
                <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <div className="space-y-2">
                {portalNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  if (item.href === 'logout') return null

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-xl text-sm font-medium transition-all duration-300 min-h-[48px] relative group',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        isActive 
                          ? 'bg-gradient-primary text-white shadow-glow' 
                          : 'glass-button hover:shadow-glow hover:text-accent-blue hover:bg-accent-blue/10',
                        isCollapsed ? 'lg:justify-center lg:px-0' : 'px-4 py-3'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isActive && !isCollapsed && (
                        <div className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                      )}
                      
                      <Icon className={cn(
                        'w-5 h-5 transition-colors flex-shrink-0',
                        isActive ? 'text-white' : 'text-text-secondary group-hover:text-accent-blue',
                        isCollapsed ? 'lg:mr-0' : 'mr-3'
                      )} />
                      <span className={cn(
                        'truncate transition-all duration-300',
                        isActive ? 'text-white' : 'text-text-primary',
                        isCollapsed ? 'lg:hidden' : 'block'
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Bottom Section like Admin */}
            <div className="p-5 border-t border-glass-border">
              <div className="flex flex-col space-y-3">
                <div className={cn("flex items-center", isCollapsed && "lg:justify-center")}>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mr-2 shadow-glow" />
                  <span className={cn("text-[10px] text-text-primary font-bold uppercase tracking-widest", isCollapsed && "lg:hidden")}>
                    Cliente
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-all duration-300 glass-button group border-transparent hover:border-accent-red/30",
                    isCollapsed ? "lg:justify-center lg:px-0" : "px-4 py-3"
                  )}
                  title={isCollapsed ? "Cerrar Sesión" : undefined}
                >
                  <LogOut className={cn("w-5 h-5 transition-transform group-hover:-translate-x-1", isCollapsed ? "lg:mr-0" : "mr-3")} />
                  <span className={cn(isCollapsed && "lg:hidden")}>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - SAME STRUCTURE AS ADMIN */}
        <div className={cn("flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300", isCollapsed ? "lg:ml-20" : "lg:ml-64")}>
          {/* Header Desktop - SAME AS ADMIN */}
          <header className="admin-header flex-shrink-0 hidden lg:block sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Breadcrumbs Style */}
              <nav className="flex items-center space-x-2 text-sm">
                <span className="text-text-secondary hover:text-accent-blue transition-colors cursor-pointer">Portal</span>
                <ChevronRight className="w-4 h-4 text-text-muted opacity-50" />
                <span className="text-text-primary font-bold">
                  {currentNavItem?.label || 'Inicio'}
                </span>
              </nav>

              {/* Right Side Profile */}
              <div ref={profileRef} className="relative flex items-center border-l border-glass-border pl-6 ml-4">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 group hover:opacity-80 transition-all duration-200"
                >
                  <div className="text-right min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent-blue transition-colors">
                      {admin?.fullName}
                    </p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                      ID: {admin?.id?.substring(0, 8)}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-dark-secondary rounded-full flex items-center justify-center shadow-glow border-2 border-transparent group-hover:border-accent-blue/50 transition-all duration-300 overflow-hidden">
                    <span className="text-sm font-bold text-accent-blue">
                      {admin?.fullName?.charAt(0)?.toUpperCase()}
                    </span>
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
                      <Link href="/portal/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center px-3 py-2.5 rounded-xl text-sm text-text-primary hover:bg-accent-blue/10 hover:text-accent-blue transition-all">
                        <User className="w-4 h-4 mr-3" /> Perfil
                      </Link>
                      <div className="h-px bg-glass-border my-1" />
                      <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm text-accent-red hover:bg-accent-red/10 transition-all">
                        <LogOut className="w-4 h-4 mr-3" /> Cerrar Sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE REUSABLE COMPONENTS */}
      <BottomNavigation />
      <QuickActionFAB />
    </div>
  )
}
