'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, CreditCard, Upload, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Inicio',
    href: '/home',
    icon: Home
  },
  {
    name: 'Pagos',
    href: '/payments',
    icon: CreditCard
  },
  {
    name: 'Reportar',
    href: '/report-payment',
    icon: Upload
  },
  {
    name: 'Perfil',
    href: '/profile',
    icon: User
  }
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <div className="nav-mobile md:hidden">
      <div className="grid grid-cols-4 h-20">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                'flex flex-col items-center justify-center px-2 text-xs transition-all duration-300 min-h-[44px] touch-target',
                isActive
                  ? 'text-accent-blue'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <div className={cn(
                'p-2 rounded-xl mb-1 transition-all duration-300',
                isActive
                  ? 'bg-accent-blue/20 shadow-[0_0_10px_rgba(96,165,250,0.3)]'
                  : 'bg-glass-primary hover:bg-glass-secondary'
              )}>
                <Icon 
                  className={cn(
                    'w-5 h-5',
                    isActive ? 'text-accent-blue' : 'text-text-secondary'
                  )} 
                />
              </div>
              <span className="font-medium">{item.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}