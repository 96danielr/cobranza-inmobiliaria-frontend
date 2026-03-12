'use client'

import { useRef, useState } from 'react'
import { Camera, Upload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  error?: string
  value?: File | null
}

export function FileUpload({
  onFileSelect,
  accept = '.jpg,.jpeg,.png,.pdf',
  maxSizeMB = 5,
  error,
  value
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setPreview(null)
      onFileSelect(null)
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      onFileSelect(null)
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    onFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileChange(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    handleFileChange(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {value ? (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {preview ? (
                <div className="relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-xl border border-glass-border"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/20 to-transparent rounded-xl" />
                </div>
              ) : (
                <div className="w-16 h-16 glass-card flex items-center justify-center">
                  <FileText className="w-8 h-8 text-accent-blue" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-text-primary truncate max-w-48">
                  {value.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatFileSize(value.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 hover:bg-glass-secondary rounded-xl border border-glass-border transition-all duration-300 min-h-[44px] min-w-[44px]"
            >
              <X className="w-5 h-5 text-text-secondary hover:text-accent-red transition-colors" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'glass-card border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 min-h-[120px] flex items-center justify-center',
            isDragging 
              ? 'border-accent-blue/50 bg-accent-blue/10 shadow-glow' 
              : error
              ? 'border-accent-red/50 bg-accent-red/10'
              : 'border-glass-border hover:border-glass-border-hover hover:bg-glass-secondary'
          )}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-glass border transition-all duration-300',
              isDragging 
                ? 'bg-accent-blue/20 border-accent-blue/30 shadow-[0_0_10px_rgba(96,165,250,0.3)]' 
                : error 
                ? 'bg-accent-red/20 border-accent-red/30' 
                : 'bg-glass-primary border-glass-border hover:bg-glass-secondary'
            )}>
              {isDragging ? (
                <Upload className={cn('w-6 h-6', error ? 'text-accent-red' : 'text-accent-blue')} />
              ) : (
                <Camera className={cn('w-6 h-6', error ? 'text-accent-red' : 'text-text-secondary')} />
              )}
            </div>
            <div>
              <p className={cn(
                'text-sm font-medium',
                error ? 'text-accent-red' : 'text-text-primary'
              )}>
                {isDragging 
                  ? 'Suelta tu comprobante aquí' 
                  : 'Arrastra tu comprobante aquí o toca para seleccionar'
                }
              </p>
              <p className={cn(
                'text-xs mt-1',
                error ? 'text-accent-red' : 'text-text-muted'
              )}>
                JPG, PNG o PDF (máx. {maxSizeMB}MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-accent-red flex items-center">
          <span className="mr-1">⚠</span>
          {error}
        </p>
      )}
    </div>
  )
}