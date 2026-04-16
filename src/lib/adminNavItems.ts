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

export type AdminNavRole =
  | 'superadmin'
  | 'tenant_admin'
  | 'company_admin'
  | 'agent'
  | 'vendedor'

export interface AdminNavItem {
  icon: LucideIcon
  label: string
  href: string
  roles: AdminNavRole[]
  module?: string
}

export const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', roles: ['superadmin', 'tenant_admin', 'company_admin', 'agent', 'vendedor'] },
  { icon: Building2, label: 'Empresas', href: '/admin/select-company', roles: ['superadmin', 'tenant_admin'] },
  { icon: ScrollText, label: 'Logs', href: '/admin/system-logs', roles: ['superadmin'] },
  { icon: CreditCard, label: 'Pagos', href: '/admin/payments', roles: ['tenant_admin', 'company_admin', 'agent', 'vendedor'] },
  { icon: Users, label: 'Cartera', href: '/admin/portfolio', roles: ['tenant_admin', 'company_admin', 'agent', 'vendedor'] },
  { icon: Users, label: 'Clientes', href: '/admin/clients', roles: ['tenant_admin', 'company_admin', 'agent', 'vendedor'] },
  { icon: Building2, label: 'Lotes', href: '/admin/lots', roles: ['tenant_admin', 'company_admin', 'vendedor'] },
  { icon: PhoneCall, label: 'Cobranzas', href: '/admin/collections', roles: ['tenant_admin', 'company_admin', 'agent', 'vendedor'], module: 'cobranzas' },
  { icon: Upload, label: 'Importar', href: '/admin/import', roles: ['tenant_admin', 'company_admin'] },
  { icon: Shield, label: 'Equipo', href: '/admin/users', roles: ['tenant_admin'] },
  { icon: PhoneCall, label: 'Chat IA', href: '/admin/ai-chat', roles: ['tenant_admin', 'company_admin'] },
  { icon: Building2, label: 'Bancos', href: '/admin/banks', roles: ['superadmin', 'tenant_admin', 'company_admin'] },
  { icon: Settings, label: 'Configuración', href: '/admin/settings', roles: ['tenant_admin'] },
  { icon: LogOut, label: 'Cerrar Sesión', href: 'logout', roles: ['superadmin', 'tenant_admin', 'company_admin', 'agent', 'vendedor'] },
]

export function filterAdminNavItems(
  items: AdminNavItem[],
  role: AdminNavRole,
  activeModules?: string[] | null
): AdminNavItem[] {
  return items.filter((item) => {
    if (!item.roles.includes(role)) return false
    if (item.module && !activeModules?.includes(item.module)) return false
    return true
  })
}
