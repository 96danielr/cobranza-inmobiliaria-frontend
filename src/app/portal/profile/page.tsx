'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { User, Mail, Phone, Shield, MapPin } from 'lucide-react'

export default function PortalProfilePage() {
  const { admin } = useAdminAuthStore()

  if (!admin) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Mi Perfil</h1>
        <p className="text-text-secondary">Gestiona tu información personal y de acceso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <Card variant="elevated" className="text-center">
            <CardContent className="p-8">
              <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto flex items-center justify-center text-white text-3xl font-black shadow-glow mb-4">
                {admin.fullName.charAt(0)}
              </div>
              <h3 className="text-lg font-bold text-text-primary">{admin.fullName}</h3>
              <p className="text-xs text-text-muted uppercase tracking-widest mt-1">Cliente Verificado</p>
              
              <div className="mt-6 pt-6 border-t border-glass-border">
                <div className="flex items-center justify-center text-xs text-text-secondary">
                  <Shield className="w-3 h-3 mr-1 text-accent-green" />
                  Cuenta Protegida
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details Form */}
        <div className="md:col-span-2 space-y-6">
          <Card variant="elevated">
            <CardContent className="p-6 md:p-8">
              <h4 className="font-bold text-text-primary mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-accent-blue" />
                Información Personal
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input 
                  label="Nombre Completo"
                  value={admin.fullName}
                  disabled
                  icon={User}
                />
                <Input 
                  label="Correo Electrónico"
                  value={admin.email}
                  disabled
                  icon={Mail}
                />
              </div>

              <div className="mt-8 pt-8 border-t border-glass-border space-y-4">
                <p className="text-sm text-text-muted italic">
                  Para modificar tus datos de contacto o actualizar tu correo, por favor contacta a la administración de la inmobiliaria.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" className="flex-1">Cambiar Contraseña</Button>
                  <Button variant="primary" className="flex-1" disabled>Solicitar Cambio de Datos</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="p-6">
              <h4 className="font-bold text-text-primary mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-accent-purple" />
                Sedes Vinculadas
              </h4>
              <div className="p-4 glass-card border border-glass-border rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-text-primary">{admin.tenantName || 'Principal'}</p>
                  <p className="text-[10px] text-text-muted uppercase">Sede Activa</p>
                </div>
                <div className="px-3 py-1 bg-accent-purple/10 text-accent-purple text-[10px] font-black rounded-full border border-accent-purple/20">
                  ACTIVO
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
