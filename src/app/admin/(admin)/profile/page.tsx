'use client'

import { useState, useRef } from 'react'
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  CheckCircle,
  AlertCircle,
  Key
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CropImageModal } from '@/components/ui/CropImageModal'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { adminApi } from '@/lib/adminApi'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { admin, updateAdmin } = useAdminAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    fullName: admin?.fullName || '',
    email: admin?.email || '',
  })

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileForm.fullName.trim()) {
      toast.error('El nombre no puede estar vacío')
      return
    }

    setIsSaving(true)
    try {
      const response = await adminApi.updateProfile({
        fullName: profileForm.fullName
      })
      
      if (response.data.success) {
        updateAdmin({ fullName: profileForm.fullName })
        toast.success('Perfil actualizado correctamente')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await adminApi.changeMyPassword(passwordForm.newPassword)
      
      if (response.data.success) {
        toast.success('Contraseña actualizada correctamente')
        setPasswordForm({
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar la contraseña')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validations
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecciona una imagen válida')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    // Convert blob to file for the FormData
    const file = new File([croppedImageBlob], 'profile-photo.jpg', { type: 'image/jpeg' })
    
    const formData = new FormData()
    formData.append('image', file)
    
    setIsUploadingPhoto(true)
    setSelectedImage(null) // Close modal
    
    try {
      const response = await adminApi.uploadProfileImage(formData)
      if (response.data.success) {
        updateAdmin({ profileImage: response.data.data.profileImage })
        toast.success('Foto de perfil actualizada')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir la foto')
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 pb-24 lg:pb-6">
      <div className="animate-fade-in-up">
        <h1 className="text-responsive-2xl font-bold text-text-primary">Mi Perfil</h1>
        <p className="text-text-secondary mt-2">
          Gestiona tu información personal y seguridad de la cuenta
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="elevated" className="overflow-hidden animate-fade-in-up animate-fade-in-up-delay">
            <div className="h-24 bg-gradient-primary relative" />
            <CardContent className="p-6 pt-0 flex flex-col items-center">
              <div className="relative -mt-12 mb-4 group">
                <div className="w-24 h-24 rounded-full border-4 border-dark-primary bg-dark-secondary flex items-center justify-center overflow-hidden shadow-glow">
                  {admin?.profileImage ? (
                    <img 
                      src={admin.profileImage} 
                      alt={admin.fullName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-black text-accent-blue">
                      {admin?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  onClick={handlePhotoClick}
                  className="absolute bottom-0 right-0 p-2 bg-accent-blue text-white rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95 border-2 border-dark-primary"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-text-primary text-center">
                {admin?.fullName}
              </h2>
              <p className="text-xs text-accent-blue font-bold uppercase tracking-widest mt-1 text-center">
                {admin?.role}
              </p>
              
              <div className="w-full h-px bg-glass-border my-6" />
              
              <div className="w-full space-y-4">
                <div className="flex items-center text-sm text-text-secondary">
                  <Mail className="w-4 h-4 mr-3 text-text-muted flex-shrink-0" />
                  <span className="truncate">{admin?.email}</span>
                </div>
                <div className="flex items-center text-sm text-text-secondary">
                  <CheckCircle className="w-4 h-4 mr-3 text-accent-green flex-shrink-0" />
                  <span>Cuenta Activa</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive" className="animate-fade-in-up animate-fade-in-up-delay-200">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="p-2 bg-accent-blue/10 rounded-lg">
                <Key className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">Plan Actual</p>
                <p className="text-sm text-text-secondary capitalize">{admin?.plan || 'Standard'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Forms Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="elevated" className="animate-fade-in-up animate-fade-in-up-delay">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-primary flex items-center">
                  <User className="w-5 h-5 mr-3 text-accent-blue" />
                  Información General
                </h3>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Nombre Completo</label>
                    <Input 
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Tu nombre"
                      className="glass-input"
                    />
                  </div>
                  <div className="space-y-2 opacity-70">
                    <label className="text-sm font-medium text-text-secondary">Correo Electrónico</label>
                    <Input 
                      value={profileForm.email}
                      disabled
                      icon={Mail}
                      className="glass-input bg-dark-secondary cursor-not-allowed"
                    />
                    <p className="text-[10px] text-text-muted italic px-1">
                      El correo no puede ser cambiado por el usuario.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    loading={isSaving}
                    className="glass-button bg-accent-blue/20 text-accent-blue border-accent-blue/30 hover:bg-accent-blue/40 min-w-[140px]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card variant="elevated" className="animate-fade-in-up animate-fade-in-up-delay-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-text-primary flex items-center mb-6">
                <Lock className="w-5 h-5 mr-3 text-accent-red" />
                Seguridad
              </h3>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Nueva Contraseña</label>
                    <Input 
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                      className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">Confirmar Nueva Contraseña</label>
                    <Input 
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repite la contraseña"
                      className="glass-input"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    loading={isChangingPassword}
                    variant="outline"
                    className="glass-button border-accent-red/30 text-accent-red hover:bg-accent-red/10 min-w-[140px]"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Actualizar Contraseña
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="p-4 bg-accent-yellow/10 border border-accent-yellow/20 rounded-2xl flex items-start animate-fade-in-up animate-fade-in-up-delay-300">
            <AlertCircle className="w-5 h-5 text-accent-yellow mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-accent-yellow uppercase tracking-wider">Nota Importante</p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Si detectas actividad sospechosa en tu cuenta o has olvidado tus credenciales de acceso anteriores, contacta con el administrador de la plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Crop Modal */}
      {selectedImage && (
        <CropImageModal
          image={selectedImage}
          onCropComplete={handleCropComplete}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  )
}
