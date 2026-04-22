import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  CreditCard,
  Users,
  PhoneCall,
  Upload,
  Settings,
  LogOut,
  Building2,
  Shield,
  ScrollText,
} from 'lucide-react'

import { PERMISSIONS, hasPermission, type Permission } from './permissions'

export interface AdminNavItem {
  icon: LucideIcon
  label: string
  href: string
  permission?: Permission
  module?: string
}

export const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' }, // Public for all logged in
  { icon: Building2, label: 'Empresas', href: '/admin/select-company', permission: PERMISSIONS.CONFIG_SUPER },
  { icon: ScrollText, label: 'Logs', href: '/admin/system-logs', permission: PERMISSIONS.CONFIG_SUPER },
  { icon: CreditCard, label: 'Pagos', href: '/admin/payments', permission: PERMISSIONS.PAGOS_VIEW },
  { icon: Users, label: 'Cartera', href: '/admin/portfolio', permission: PERMISSIONS.CARTERA_DASHBOARD },
  { icon: Users, label: 'Clientes', href: '/admin/clients', permission: PERMISSIONS.CLIENTES_VIEW },
  { icon: Building2, label: 'Lotes', href: '/admin/lots', permission: PERMISSIONS.LOTES_VIEW },
  { icon: PhoneCall, label: 'Cobranzas', href: '/admin/collections', permission: PERMISSIONS.CARTERA_FOLLOWUP, module: 'cobranzas' },
  { icon: Upload, label: 'Importar', href: '/admin/import', permission: PERMISSIONS.IMPORT_MANAGE },
  { icon: Shield, label: 'Equipo', href: '/admin/users', permission: PERMISSIONS.EQUIPO_VIEW },
  { icon: PhoneCall, label: 'Chat IA', href: '/admin/ai-chat', permission: PERMISSIONS.IA_CHAT },
  { icon: Building2, label: 'Bancos', href: '/admin/banks', permission: PERMISSIONS.BANCOS_VIEW },
  { icon: Settings, label: 'Configuración', href: '/admin/settings', permission: PERMISSIONS.CONFIG_TENANT },
  { icon: LogOut, label: 'Cerrar Sesión', href: 'logout' },
]

export function filterAdminNavItems(
  items: AdminNavItem[],
  role: string | undefined,
  activeModules?: string[] | null
): AdminNavItem[] {
  return items.filter((item) => {
    // If no permission specified, it's public for all logged-in users
    if (item.permission && !hasPermission(role, item.permission)) return false
    
    if (item.module && !activeModules?.includes(item.module)) return false
    return true
  })
}
