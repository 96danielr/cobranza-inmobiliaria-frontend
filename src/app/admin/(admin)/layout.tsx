'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { useThemeStore } from '@/stores/themeStore'
import { LogOut, Building2, ChevronRight, User, Settings as SettingsIcon, ChevronsUpDown, Check, ChevronLeft, Menu, HelpCircle, Sparkles, BookOpen, LifeBuoy, PlayCircle, MessageSquare } from 'lucide-react'
import { BottomNavigation, QuickActionFAB, MobileBreadcrumbs, MobileHeader } from '@/components/ui/BottomNavigation'
import { cn } from '@/lib/utils'
import { adminNavItems, filterAdminNavItems, type AdminNavRole } from '@/lib/adminNavItems'
import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useClickAway } from '@/hooks/useClickAway'
import toast from 'react-hot-toast'
import { adminApi } from '@/lib/adminApi'
import { GuidedTourWidget } from '@/components/onboarding/GuidedTourWidget'
import { useGuidedTourStore } from '@/stores/guidedTourStore'

const roleLabels: Record<AdminNavRole, string> = {
  superadmin: 'Super Admin',
  tenant_admin: 'Admin Tenant',
  company_admin: 'Admin Empresa',
  agent: 'Agente (Legacy)',
  vendedor: 'Vendedor (Legacy)',
  cliente: 'Cliente',
  cobrador: 'Cobrador',
  administrador: 'Administrador',
  gerente: 'Gerente',
  jefe_cartera: 'Jefe de Cartera',
  auxiliar_cartera: 'Auxiliar de Cartera',
  contador: 'Contador',
  auxiliar_contable: 'Auxiliar Contable',
  ejecutivo_comercial: 'Ejecutivo Comercial',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, _hasHydrated, admin, logout, selectedCompanyId, selectedCompanyName, setSelectedCompany } = useAdminAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const { theme } = useThemeStore()
  const [mounted, setMounted] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && theme === 'light'
    ? '/PERFIL FONDO BLANCO.jpeg'
    : '/PERFIL PARA FONDOS OSCUROS SOLO NOMBRE EMPRESA.png'
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useClickAway(profileRef, () => setIsProfileOpen(false))

  // Help Menu Dropdown State
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  useClickAway(helpRef, () => setIsHelpOpen(false))

  // Project Selector State
  const [companies, setCompanies] = useState<any[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

  useClickAway(selectorRef, () => setIsSelectorOpen(false))

  const loadCompanies = async () => {
    if (!isAuthenticated || admin?.role === 'cliente') return
    try {
      const response = admin?.role === 'superadmin'
        ? await adminApi.getAllTenants()
        : await adminApi.getCompanies()
      if (response.data.success) {
        const data = admin?.role === 'superadmin' 
          ? response.data.data.tenants 
          : response.data.data.companies
        setCompanies(data.filter((c: any) => c.status === 'active'))
      }
    } catch (error) {
      console.error('Error loading companies for selector:', error)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [isAuthenticated, admin?.role])

  useEffect(() => {
    const handleProjectsUpdated = () => {
      loadCompanies()
    }
    window.addEventListener('projects-updated', handleProjectsUpdated)
    return () => {
      window.removeEventListener('projects-updated', handleProjectsUpdated)
    }
  }, [isAuthenticated, admin?.role])

  const handleSelectCompanyInHeader = (companyId: string, companyName: string) => {
    setSelectedCompany(companyId, companyName)
    setIsSelectorOpen(false)
    toast.success(`Proyecto seleccionado: ${companyName}`)
    window.location.href = '/admin/dashboard'
  }

  // Auto-start Guided Tour in-vivo for new users or first access
  useEffect(() => {
    if (!isAuthenticated || !admin?.id || admin?.role === 'cliente') return
    const storageKey = `live_tour_completed_${admin.id}`
    const hasCompleted = localStorage.getItem(storageKey)
    if (!hasCompleted) {
      // Small delay to let page mount cleanly, then launch Live Tour immediately
      const timer = setTimeout(() => {
        useGuidedTourStore.getState().startTour(0)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, admin?.id, admin?.role])

  useEffect(() => {
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.push('/admin/login')
      return
    }

    // If a client accidentally enters the admin area, redirect to portal
    if (admin?.role === 'cliente') {
      router.push('/portal/dashboard')
    }
  }, [isAuthenticated, _hasHydrated, admin, router])

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const currentPageInfo = getCurrentPageInfo()
  const userRole = (admin?.role || 'agent') as AdminNavRole

  // Filter items using centralized permission logic
  const filteredNavItems = filterAdminNavItems(
    adminNavItems,
    admin?.role,
    admin?.activeModules
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Mobile Header */}
      <MobileHeader
        title={currentPageInfo.title}
        subtitle={selectedCompanyName || currentPageInfo.subtitle}
        onLogout={handleLogout}
      />
      
      {/* Mobile Breadcrumbs */}
      <MobileBreadcrumbs breadcrumbs={getBreadcrumbs()} />
 
      <div className="flex w-full">
        {/* Enhanced Sidebar */}
        <div className={cn("sidebar-admin transition-all duration-300", isCollapsed ? "lg:w-0 lg:border-r-0 lg:opacity-0 lg:pointer-events-none lg:overflow-hidden" : "lg:w-64")}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header - System Name */}
            <div className="flex items-center justify-between border-b border-glass-border min-h-[70px] px-6">
              <div className="w-36 h-12 rounded-xl overflow-hidden p-1 flex items-center justify-center animate-fade-in">
                <img 
                  src={logoSrc} 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
 
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-0 lg:space-y-2">
                {filteredNavItems
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
                        'flex items-center rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 min-h-[48px] relative',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        isActive 
                          ? 'bg-gradient-primary text-white shadow-glow' 
                          : 'glass-button hover:shadow-glow hover:text-accent-blue hover:bg-accent-blue/10',
                        item.href === 'logout' && 'hover:text-accent-red hover:bg-accent-red/10',
                        isCollapsed ? 'lg:justify-center lg:px-0' : 'px-3 sm:px-4 py-3'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {/* Active indicator (Desktop only) */}
                      {isActive && !isCollapsed && (
                        <div className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                      )}
                      
                      <Icon className={cn(
                        'w-6 h-6 lg:w-5 lg:h-5 mb-2 lg:mb-0 transition-colors flex-shrink-0',
                        isActive ? 'text-white' : 'text-text-secondary',
                        item.href === 'logout' && 'group-hover:text-accent-red',
                        isCollapsed ? 'lg:mr-0' : 'lg:mr-3'
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
 
            {/* Technical Info (Important for reviews/audits) */}
            <div className="p-5 border-t border-glass-border">
              <div className="flex flex-col space-y-2 opacity-80">
                <div className={cn("flex flex-col", isCollapsed && "lg:items-center")}>
                  <div className="flex items-center mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-blue mr-2 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    <span className={cn("text-xs text-text-primary font-bold uppercase tracking-widest", isCollapsed && "lg:hidden")}>
                      {roleLabels[userRole]}
                    </span>
                  </div>
                </div>
                <div className={cn("flex flex-col", isCollapsed && "lg:hidden")}>
                  <span className="text-[10px] text-text-secondary font-mono truncate bg-background/30 px-2 py-1.5 rounded border border-glass-border/30">
                    {admin?.id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Main Content Area */}
        <div className={cn("flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300", isCollapsed ? "lg:ml-0 lg:w-full" : "lg:ml-64 lg:w-[calc(100%-16rem)]")}>
          <header className="admin-header flex-shrink-0 hidden lg:block sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-4 relative">
              {/* Left Side: Breadcrumbs & Toggle */}
              <div className="flex items-center space-x-4 min-w-0">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-xl glass-button hover:shadow-glow transition-all duration-300 min-h-[40px] min-w-[40px] flex items-center justify-center text-text-primary mr-2"
                  title={isCollapsed ? "Mostrar Menú" : "Ocultar Menú"}
                >
                  <Menu className="w-5 h-5 text-text-primary" />
                </button>
                
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
            </div>

              {/* Center: Company Name Selector */}
              {selectedCompanyName && (
                <div ref={selectorRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                  <button
                    onClick={() => {
                      if (companies.length > 1) {
                        setIsSelectorOpen(!isSelectorOpen)
                      }
                    }}
                    title={companies.length > 1 ? "Cambiar de proyecto" : undefined}
                    disabled={companies.length <= 1}
                    className={cn(
                      "flex items-center justify-center bg-accent-blue/5 px-4 py-2 rounded-2xl border border-glass-border shadow-md shadow-accent-blue/5 transition-all duration-300 group select-none",
                      companies.length > 1 ? "hover:bg-accent-blue/15 hover:border-accent-blue/30 cursor-pointer" : "cursor-default"
                    )}
                  >
                    <Building2 className="w-4 h-4 text-accent-blue/70 group-hover:text-accent-blue group-hover:scale-105 transition-all duration-300" />
                    <span className="text-xs font-bold text-accent-blue/80 tracking-wider uppercase mx-2 text-company-highlight group-hover:text-accent-blue transition-colors">
                      {selectedCompanyName.replace('Empresa Principal - ', '')}
                    </span>
                    {companies.length > 1 && (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-accent-blue/50 group-hover:text-accent-blue transition-colors duration-300" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isSelectorOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                        exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
                        className="absolute left-1/2 mt-2 w-64 glass-card p-2 z-[60] shadow-glow max-h-60 overflow-y-auto"
                      >
                        <div className="px-3 py-1.5 border-b border-glass-border mb-1">
                          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Mis Proyectos</p>
                        </div>
                        {companies.map((company) => (
                          <button
                            key={company._id}
                            onClick={() => handleSelectCompanyInHeader(company._id, company.name)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all duration-200 border border-transparent",
                              selectedCompanyId === company._id
                                ? "bg-gradient-primary text-white border-accent-blue/20"
                                : "text-text-primary hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue/30"
                            )}
                          >
                            <span className="truncate">{company.name}</span>
                            {selectedCompanyId === company._id && (
                              <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
                
              {/* Right Side: Ayuda + User Profile */}
              <div className="flex items-center space-x-3 ml-auto z-10">
                {/* Menú Desplegable de Ayuda y Tutoriales */}
                <div ref={helpRef} className="relative">
                  <button
                    onClick={() => setIsHelpOpen(!isHelpOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-glass-primary/30 hover:bg-accent-blue/15 text-text-secondary hover:text-accent-blue border border-glass-border/60 hover:border-accent-blue/40 text-xs font-semibold transition-all duration-200 shadow-sm"
                    title="Centro de Ayuda y Tutoriales"
                  >
                    <HelpCircle className="w-4 h-4 text-accent-yellow" />
                    <span className="hidden md:inline">Ayuda</span>
                  </button>

                  <AnimatePresence>
                    {isHelpOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-72 glass-card p-2 z-[60] shadow-glow"
                      >
                        <div className="px-3 py-2 border-b border-glass-border/50 mb-1">
                          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Centro de Ayuda</p>
                          <p className="text-xs text-text-secondary font-medium">Recursos y guías para tu equipo</p>
                        </div>

                        {/* Opción Principal: Recorrido Guiado en Vivo */}
                        <button
                          onClick={() => {
                            setIsHelpOpen(false)
                            useGuidedTourStore.getState().startTour(0)
                          }}
                          className="w-full flex items-start p-2.5 rounded-xl bg-accent-blue/10 hover:bg-accent-blue/20 text-left transition-all duration-200 group border border-accent-blue/30 mb-1"
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent-blue text-white flex items-center justify-center shrink-0 mr-2.5 mt-0.5 group-hover:scale-105 transition-transform shadow-sm">
                            <Sparkles className="w-4 h-4 text-accent-yellow animate-pulse" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-accent-blue flex items-center gap-1.5">
                              Recorrido en Vivo (Paso a Paso)
                            </p>
                            <p className="text-[11px] text-text-secondary leading-tight mt-0.5">
                              Te llevamos pantalla por pantalla mostrándote cada sección y botón real.
                            </p>
                          </div>
                        </button>

                        {/* Opción: Documentación / Parámetros */}
                        <Link
                          href="/admin/settings"
                          onClick={() => setIsHelpOpen(false)}
                          className="w-full flex items-start p-2.5 rounded-xl hover:bg-glass-primary/50 text-left transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent-purple/20 text-accent-purple flex items-center justify-center shrink-0 mr-2.5 mt-0.5 group-hover:scale-105 transition-transform">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-text-primary group-hover:text-accent-purple transition-colors">
                              Parámetros del Sistema
                            </p>
                            <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                              Revisa bancos, comisiones, bonos y auditoría general.
                            </p>
                          </div>
                        </Link>

                        {/* Opción: Reiniciar Tour Forzado */}
                        <button
                          onClick={() => {
                            if (admin?.id) {
                              localStorage.removeItem(`live_tour_completed_${admin.id}`)
                            }
                            setIsHelpOpen(false)
                            useGuidedTourStore.getState().startTour(0)
                            toast.success('Tour en vivo reiniciado desde el paso 1')
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 mt-1 rounded-lg border border-glass-border/40 bg-glass-primary/20 hover:bg-glass-primary/40 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-accent-yellow" />
                            Reiniciar Recorrido Guiado
                          </span>
                          <ChevronRight className="w-3 h-3 text-text-muted" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Side: User Profile Dropdown */}
                <div ref={profileRef} className="relative flex items-center border-l border-glass-border pl-4 flex-shrink-0">
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
                  <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center shadow-glow flex-shrink-0 border-2 border-transparent group-hover:border-accent-blue/50 transition-all duration-300 overflow-hidden">
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
                      <button
                        onClick={() => {
                          setIsProfileOpen(false)
                          useGuidedTourStore.getState().startTour(0)
                        }}
                        className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm text-accent-blue hover:bg-accent-blue/10 transition-all duration-200"
                      >
                        <Sparkles className="w-4 h-4 mr-3 text-accent-yellow" />
                        Recorrido Guiado en Vivo
                      </button>
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
            </div>
          </header>

          {/* Main Content with padding for mobile navigation */}
          <main className="flex-1 overflow-y-auto px-2 py-4 md:p-6 pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* Interactive Guided Tour Widget (Live Walkthrough) */}
      <GuidedTourWidget />

      {/* Mobile Bottom Navigation */}
      <BottomNavigation />
      
      {/* Quick Action FAB */}
      <QuickActionFAB />
    </div>
  )
}