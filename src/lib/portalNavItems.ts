import { LayoutDashboard, Map, CreditCard, User, LogOut } from 'lucide-react'

export interface PortalNavItem {
  label: string
  href: string
  icon: any
}

export const portalNavItems: PortalNavItem[] = [
  {
    label: 'Inicio',
    href: '/portal/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Mis Lotes',
    href: '/portal/lots',
    icon: Map,
  },
  {
    label: 'Mis Pagos',
    href: '/portal/payments',
    icon: CreditCard,
  },
  {
    label: 'Mi Perfil',
    href: '/portal/profile',
    icon: User,
  },
  {
    label: 'Cerrar Sesión',
    href: 'logout',
    icon: LogOut,
  },
]
