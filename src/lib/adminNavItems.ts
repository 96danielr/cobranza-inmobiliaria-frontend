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
  BarChart3,
  MessageSquare,
  MailCheck,
  BookOpen,
  PhoneForwarded,
  BadgeDollarSign,
  Map,
  Home,
  Store,
  type LucideIcon,
} from 'lucide-react'

import { PERMISSIONS, hasPermission, type Permission } from './permissions'
import { PropertyType, getPropertyConfig } from './propertyTypes'

export type AdminNavRole = 'superadmin' | 'tenant_admin' | 'company_admin' | 'agent' | 'vendedor' | 'cliente' | 'cobrador' | 'administrador' | 'gerente' | 'jefe_cartera' | 'auxiliar_cartera' | 'contador' | 'auxiliar_contable' | 'ejecutivo_comercial'

export interface AdminNavItem {
  icon: LucideIcon
  label: string
  href: string
  permission?: Permission
  module?: string
}

export const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' }, // Public for all logged in
  { icon: Building2, label: 'Proyectos', href: '/admin/select-company', permission: PERMISSIONS.CONFIG_TENANT },
  { icon: ScrollText, label: 'Logs Sistema', href: '/admin/system-logs', permission: PERMISSIONS.SYSTEM_LOGS },
  { icon: CreditCard, label: 'Pagos', href: '/admin/payments', permission: PERMISSIONS.PAGOS_VIEW },
  { icon: BarChart3, label: 'Reportes', href: '/admin/reports', permission: PERMISSIONS.REPORTES_VIEW },
  { icon: Users, label: 'Cartera', href: '/admin/portfolio', permission: PERMISSIONS.CARTERA_DASHBOARD },
  { icon: Users, label: 'Clientes', href: '/admin/clients', permission: PERMISSIONS.CLIENTES_VIEW },
  { icon: Building2, label: 'Lotes', href: '/admin/lots', permission: PERMISSIONS.LOTES_VIEW },
  { icon: PhoneCall, label: 'Cobranzas', href: '/admin/collections', permission: PERMISSIONS.CARTERA_FOLLOWUP, module: 'cobranzas' },
  { icon: MessageSquare, label: 'Mensajes', href: '/admin/messages', permission: PERMISSIONS.CARTERA_FOLLOWUP },
  { icon: MailCheck, label: 'Plantillas WA', href: '/admin/whatsapp-templates', permission: PERMISSIONS.CARTERA_FOLLOWUP },
  { icon: Upload, label: 'Importar', href: '/admin/import', permission: PERMISSIONS.IMPORT_MANAGE },
  { icon: BadgeDollarSign, label: 'Comisiones', href: '/admin/commissions', permission: PERMISSIONS.COMISIONES_VIEW },
  { icon: Shield, label: 'Equipo', href: '/admin/users', permission: PERMISSIONS.EQUIPO_VIEW },
  { icon: PhoneCall, label: 'Chat IA', href: '/admin/ai-chat', permission: PERMISSIONS.IA_CHAT },
  { icon: BookOpen, label: 'FAQ Agente', href: '/admin/faq', permission: PERMISSIONS.IA_CHAT },
  { icon: PhoneForwarded, label: 'Llamadas Asesor', href: '/admin/escalations', permission: PERMISSIONS.CARTERA_FOLLOWUP },
  { icon: Settings, label: 'Configuración', href: '/admin/settings', permission: PERMISSIONS.CONFIG_TENANT },
  { icon: LogOut, label: 'Cerrar Sesión', href: 'logout' },
]

export function getDynamicAdminNavItems(propertyType?: PropertyType | string | null): AdminNavItem[] {
  const cfg = getPropertyConfig(propertyType)
  
  let PropertyIcon = Building2
  if (cfg.icon === 'Map') PropertyIcon = Map
  else if (cfg.icon === 'Home') PropertyIcon = Home
  else if (cfg.icon === 'Store') PropertyIcon = Store
  else if (cfg.icon === 'Building2') PropertyIcon = Building2

  return adminNavItems.map((item) => {
    if (item.href === '/admin/lots') {
      return {
        ...item,
        label: cfg.plural,
        icon: PropertyIcon,
      }
    }
    return item
  })
}

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

