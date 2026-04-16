'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  LogOut,
  PhoneCall,
  Plus,
  Settings,
  Upload,
  Users,
  X,
  User,
  Settings as SettingsIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import {
  adminNavItems,
  filterAdminNavItems,
  type AdminNavRole,
} from '@/lib/adminNavItems'

const MOBILE_DOCK_VISIBLE = 4

const iosEase = [0.32, 0.72, 0, 1] as const

const sheetSpring = {
  type: 'spring' as const,
  damping: 32,
  stiffness: 420,
  mass: 0.78,
}

const sheetExitSpring = {
  type: 'spring' as const,
  damping: 36,
  stiffness: 520,
  mass: 0.72,
}

export function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAdminAuthStore()
  const [moreOpen, setMoreOpen] = useState(false)

  const userRole = (admin?.role || 'agent') as AdminNavRole
  const filtered = filterAdminNavItems(
    adminNavItems,
    userRole,
    admin?.activeModules
  )
  const withoutLogout = filtered.filter((i) => i.href !== 'logout')
  const dockItems = withoutLogout.slice(0, MOBILE_DOCK_VISIBLE)
  const moreItems = withoutLogout.slice(MOBILE_DOCK_VISIBLE)
  const logoutItem = filtered.find((i) => i.href === 'logout')
  const showMoreTab = moreItems.length > 0

  useEffect(() => {
    setMoreOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const moreContainsActive = moreItems.some((item) => isActive(item.href))

  const handleLogout = () => {
    logout()
    router.push('/admin/login')
  }

  const renderTab = (item: (typeof filtered)[0]) => {
    const Icon = item.icon
    const active = isActive(item.href)

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMoreOpen(false)}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl transition-all duration-300 relative',
          'px-2 py-2 min-h-[56px] min-w-[52px] flex-1 max-w-[20vw]',
          'hover:scale-105 active:scale-95',
          active ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
        )}
      >
        {active && (
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-accent-blue rounded-full" />
        )}
        <div className={cn('relative mb-0.5', active && 'drop-shadow-glow')}>
          <Icon className={cn('w-5 h-5 transition-all duration-300', active && 'scale-110')} />
          {active && (
            <div className="absolute inset-0 bg-accent-blue/20 rounded-full scale-150 blur-sm -z-10" />
          )}
        </div>
        <span
          className={cn(
            'text-[10px] sm:text-xs font-medium text-center leading-tight truncate w-full',
            active ? 'text-accent-blue' : 'text-text-secondary'
          )}
        >
          {item.label}
        </span>
      </Link>
    )
  }

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              key="admin-more-backdrop"
              type="button"
              aria-label="Cerrar menú de navegación"
              className="fixed inset-0 z-[45] bg-dark-primary/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.34, ease: iosEase }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="admin-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-more-sheet-title"
            className={cn(
              'fixed left-2 right-2 z-[48] lg:hidden rounded-2xl border border-glass-border origin-bottom',
              'bg-dark-primary/95 backdrop-blur-glass shadow-glow',
              'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] max-h-[min(70vh,28rem)] flex flex-col overflow-hidden'
            )}
            initial={{ y: 56, scale: 0.94, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{
              y: 80,
              scale: 0.96,
              opacity: 0,
              transition: {
                y: sheetExitSpring,
                scale: sheetExitSpring,
                opacity: { duration: 0.2, ease: iosEase },
              },
            }}
            transition={{
              y: sheetSpring,
              scale: sheetSpring,
              opacity: { duration: 0.26, ease: iosEase },
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border flex-shrink-0">
              <div className="flex items-center gap-2 text-text-primary" id="admin-more-sheet-title">
                <LayoutDashboard className="w-5 h-5 text-accent-blue" />
                <span className="text-sm font-semibold">Más opciones</span>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-xl glass-button hover:bg-glass-secondary min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 grid grid-cols-3 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-200',
                      'min-h-[88px] active:scale-[0.98]',
                      active
                        ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue'
                        : 'border-glass-border glass-button hover:border-accent-blue/30'
                    )}
                  >
                    <Icon className={cn('w-6 h-6', active ? 'text-accent-blue' : 'text-text-secondary')} />
                    <span className="text-xs font-medium text-center text-text-primary leading-tight line-clamp-2">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
              {logoutItem && (
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    handleLogout()
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-200',
                    'min-h-[88px] active:scale-[0.98] col-span-1',
                    'border-glass-border glass-button hover:border-accent-red/40 hover:bg-accent-red/10 text-accent-red'
                  )}
                >
                  <LogOut className="w-6 h-6" />
                  <span className="text-xs font-medium text-center leading-tight">{logoutItem.label}</span>
                </button>
              )}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="absolute inset-0 bg-dark-primary/80 backdrop-blur-glass border-t border-glass-border" />
        <div className="relative flex items-stretch justify-around py-1.5 gap-0.5 px-1">
          {dockItems.map((item) => renderTab(item))}
          {showMoreTab && (
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                'relative flex flex-col items-center justify-center px-2 py-2 rounded-xl transition-all duration-300 min-h-[56px] flex-1 max-w-[20vw]',
                'hover:scale-105 active:scale-95',
                moreOpen || moreContainsActive ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
              )}
              aria-expanded={moreOpen}
              aria-label="Más opciones de navegación"
            >
              {(moreOpen || moreContainsActive) && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-blue rounded-full pointer-events-none" />
              )}
              <div
                className={cn(
                  'relative mb-0.5 w-9 h-9 rounded-full border flex items-center justify-center',
                  moreOpen || moreContainsActive
                    ? 'border-accent-blue/50 bg-accent-blue/15'
                    : 'border-glass-border bg-glass-primary/40'
                )}
              >
                <motion.span
                  animate={{ rotate: moreOpen ? 45 : 0 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 400, mass: 0.6 }}
                  className="inline-flex"
                >
                  <Plus className="w-5 h-5" />
                </motion.span>
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-medium',
                  moreOpen || moreContainsActive ? 'text-accent-blue' : 'text-text-secondary'
                )}
              >
                Más
              </span>
            </button>
          )}
        </div>
        <div className="h-safe-area-inset-bottom bg-dark-primary/80" />
      </nav>
    </>
  )
}

export function QuickActionFAB() {
  const pathname = usePathname()

  const getQuickAction = () => {
    if (pathname.startsWith('/admin/payments')) {
      return {
        icon: Upload,
        label: 'Subir Comprobante',
        action: () => {},
        color: 'bg-accent-green hover:bg-accent-green/80',
      }
    }
    if (pathname.startsWith('/admin/collections')) {
      return {
        icon: PhoneCall,
        label: 'Nueva Campaña',
        action: () => {},
        color: 'bg-accent-purple hover:bg-accent-purple/80',
      }
    }
    if (pathname.startsWith('/admin/clients')) {
      return {
        icon: Users,
        label: 'Nuevo Cliente',
        action: () => {},
        color: 'bg-accent-blue hover:bg-accent-blue/80',
      }
    }
    return {
      icon: Settings,
      label: 'Configuración',
      action: () => {},
      color: 'bg-glass-primary hover:bg-glass-secondary',
    }
  }

  const quickAction = getQuickAction()
  const Icon = quickAction.icon

  return (
    <button
      type="button"
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

export function MobileBreadcrumbs({ breadcrumbs }: { breadcrumbs: Array<{ label: string; href: string }> }) {
  if (breadcrumbs.length <= 1) return null

  return (
    <div className="lg:hidden px-4 py-2 border-b border-glass-border bg-dark-primary/50 backdrop-blur-glass">
      <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center flex-shrink-0">
            {index > 0 && <div className="w-2 h-2 bg-text-muted rounded-full mx-2 opacity-50" />}
            <Link
              href={crumb.href}
              className={cn(
                'text-sm px-3 py-1.5 rounded-full whitespace-nowrap min-h-[36px] flex items-center transition-all duration-300',
                index === breadcrumbs.length - 1
                  ? 'text-accent-blue bg-accent-blue/20 font-medium cursor-default pointer-events-none'
                  : 'text-text-secondary bg-glass-primary/30 hover:bg-glass-secondary'
              )}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MobileHeader({
  title,
  subtitle,
  onLogout,
}: {
  title: string
  subtitle?: string
  onLogout?: () => void
}) {
  const { admin } = useAdminAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="lg:hidden bg-dark-primary/80 backdrop-blur-glass border-b border-glass-border sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Empty space to balance the header */}
        <div className="w-10 h-10 flex-shrink-0" />

        <div className="flex-1 text-center px-4 overflow-hidden">
          <h1 className="text-md font-bold text-text-primary truncate">{title}</h1>
          {subtitle && <p className="text-[10px] text-text-secondary truncate uppercase tracking-widest">{subtitle}</p>}
        </div>

        {/* Right: User Profile Dropdown */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 bg-dark-secondary rounded-full flex items-center justify-center shadow-glow border border-glass-border transition-transform active:scale-95 overflow-hidden"
          >
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
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 glass-card p-2 z-[60] shadow-glow"
              >
                <div className="px-3 py-2 border-b border-glass-border mb-1">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Mi Cuenta</p>
                  <p className="text-[10px] text-text-secondary truncate mt-0.5">{admin?.fullName}</p>
                </div>
                <Link
                  href="/admin/profile"
                  className="flex items-center px-3 py-2.5 rounded-xl text-sm text-text-primary active:bg-accent-blue/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4 mr-3 text-accent-blue" />
                  Mi Perfil
                </Link>
                {admin?.role !== 'superadmin' && (
                  <Link
                    href="/admin/settings"
                    className="flex items-center px-3 py-2.5 rounded-xl text-sm text-text-primary active:bg-accent-blue/20 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <SettingsIcon className="w-4 h-4 mr-3 text-accent-blue" />
                    Ajustes
                  </Link>
                )}
                <div className="h-px bg-glass-border my-1" />
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-xl text-sm text-accent-red active:bg-accent-red/10 transition-colors"
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
  )
}
