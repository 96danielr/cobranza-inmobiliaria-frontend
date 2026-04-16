'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, ZoomIn, ZoomOut, Check, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './Button'
import getCroppedImg from '@/lib/cropImage'

interface CropImageModalProps {
  image: string
  onCropComplete: (croppedImage: Blob) => void
  onClose: () => void
}

export function CropImageModal({ image, onCropComplete, onClose }: CropImageModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation)
      if (croppedImage) {
        onCropComplete(croppedImage)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-dark-secondary rounded-3xl overflow-hidden shadow-2xl border border-glass-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
            <h3 className="text-lg font-bold text-text-primary">Ajustar Foto</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-glass-primary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Cropper Container */}
          <div className="relative h-80 w-full bg-black">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={setRotation}
              onCropComplete={onCropAreaComplete}
              cropShape="round"
              showGrid={false}
              classes={{
                containerClassName: 'cursor-move',
                cropAreaClassName: 'border-2 border-accent-blue shadow-[0_0_0_9999em_rgba(0,0,0,0.7)]',
              }}
            />
          </div>

          {/* Controls */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <ZoomOut className="w-4 h-4 text-text-muted" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-accent-blue"
                />
                <ZoomIn className="w-4 h-4 text-text-muted" />
              </div>

              <div className="flex items-center gap-4">
                <RotateCcw className="w-4 h-4 text-text-muted" />
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 accent-accent-blue"
                />
                <span className="text-xs font-mono text-text-muted w-8">{rotation}°</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 glass-button"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDone}
                className="flex-1 glass-button bg-accent-blue text-white hover:bg-accent-blue/80"
              >
                <Check className="w-4 h-4 mr-2" />
                Aplicar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
