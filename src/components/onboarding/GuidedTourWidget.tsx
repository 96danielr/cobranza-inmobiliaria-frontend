'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle2, 
  Building2, 
  Users, 
  MapPin, 
  CreditCard,
  Compass,
  MousePointerClick
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useGuidedTourStore, TOUR_STEPS } from '@/stores/guidedTourStore'
import { useAdminAuthStore } from '@/stores/adminAuthStore'

interface HighlightBox {
  top: number
  left: number
  width: number
  height: number
}

export function GuidedTourWidget() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { admin } = useAdminAuthStore()
  const { isActive, currentStepIndex, nextStep, prevStep, endTour, goToStep } = useGuidedTourStore()
  const [highlightRect, setHighlightRect] = useState<HighlightBox | null>(null)
  const [targetFound, setTargetFound] = useState(false)

  const handleEndTour = () => {
    // Remove previous spotlight class from DOM
    document.querySelectorAll('.tour-spotlight-active').forEach(el => {
      el.classList.remove('tour-spotlight-active')
    })
    endTour(admin?.id)
  }

  const currentStep = TOUR_STEPS[currentStepIndex]

  // Detect when user needs to be navigated to the step's route
  useEffect(() => {
    if (!isActive || !currentStep) return

    const targetUrl = new URL(currentStep.route, window.location.origin)
    const targetPath = targetUrl.pathname
    const targetTab = targetUrl.searchParams.get('tab')
    const currentTab = searchParams.get('tab')

    const isDifferentPath = pathname !== targetPath
    const isDifferentTab = targetTab && targetTab !== currentTab

    if (isDifferentPath || isDifferentTab) {
      router.push(currentStep.route)
    }
  }, [isActive, currentStepIndex, pathname, searchParams, currentStep, router])

  // Locate and highlight target elements dynamically on screen
  useEffect(() => {
    if (!isActive || !currentStep) {
      setHighlightRect(null)
      return
    }

    // Clean up previous spotlights
    document.querySelectorAll('.tour-spotlight-active').forEach(el => {
      el.classList.remove('tour-spotlight-active')
    })

    const checkElement = () => {
      if (!currentStep.targetSelector) return

      const selectors = currentStep.targetSelector.split(',').map(s => s.trim())
      let targetEl: HTMLElement | null = null

      // Apply spotlight glow to ALL matching visible elements
      for (const sel of selectors) {
        const found = document.querySelector(sel) as HTMLElement
        if (found && found.offsetParent !== null) {
          found.classList.add('tour-spotlight-active')
          // Use the first visible element for badge positioning
          if (!targetEl) targetEl = found
        }
      }

      if (targetEl) {
        setTargetFound(true)
        
        const rect = targetEl.getBoundingClientRect()
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        })

        // Smooth scroll to the target element if out of viewport
        if (rect.top < 100 || rect.bottom > window.innerHeight - 150) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        setTargetFound(false)
        setHighlightRect(null)
      }
    }

    // Run immediately and after a short delay for dynamic content to render
    checkElement()
    const timer1 = setTimeout(checkElement, 350)
    const timer2 = setTimeout(checkElement, 1000)

    const handleResizeOrScroll = () => {
      checkElement()
    }

    window.addEventListener('resize', handleResizeOrScroll)
    window.addEventListener('scroll', handleResizeOrScroll)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', handleResizeOrScroll)
      window.removeEventListener('scroll', handleResizeOrScroll)
      document.querySelectorAll('.tour-spotlight-active').forEach(el => {
        el.classList.remove('tour-spotlight-active')
      })
    }
  }, [isActive, currentStepIndex, pathname, searchParams, currentStep])

  if (!isActive || !currentStep) return null

  const getStepIcon = (key: string) => {
    switch (key) {
      case 'company_info': return Building2
      case 'company_project': return MapPin
      case 'company_logos': return Sparkles
      case 'company_banks': return CreditCard
      case 'users': return Users
      case 'lots': return MapPin
      case 'payments': return CreditCard
      default: return Sparkles
    }
  }

  const Icon = getStepIcon(currentStep.key)
  const isLast = currentStepIndex === TOUR_STEPS.length - 1

  return (
    <>
      {/* Target Callout Indicator Floating Anchored to Target Card */}
      {highlightRect && (
        <motion.div
          key={`badge-${currentStepIndex}`}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: Math.max(10, highlightRect.top - 48),
            left: Math.max(10, highlightRect.left + Math.min(20, highlightRect.width / 4)),
            zIndex: 9999,
          }}
          className="pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-gray-900 shadow-2xl border-2 border-blue-400/60 text-xs font-black tour-badge-bounce ring-2 ring-blue-300/40"
        >
          <span>{currentStep.calloutText}</span>
        </motion.div>
      )}

      {/* FLOATING INTERACTIVE CONTROLLER CARD */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-4 sm:right-8 z-[9999] w-[92vw] sm:w-[420px] max-w-[440px] shadow-2xl rounded-2xl overflow-hidden border-2 border-accent-blue/60 bg-surface/95 backdrop-blur-2xl ring-2 ring-accent-blue/20"
        >
          {/* HEADER BAR */}
          <div className="bg-gradient-to-r from-accent-blue/30 via-accent-purple/25 to-accent-blue/10 px-4 py-3 border-b border-glass-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-accent-blue/20 text-accent-blue">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </span>
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Tour Guiado en Vivo
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-blue text-white shadow-sm">
                {currentStep.badge}
              </span>
            </div>

            <button
              onClick={handleEndTour}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
              title="Finalizar Tour Guiado"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* BODY CONTENT */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 text-accent-blue flex items-center justify-center shrink-0 mt-0.5 border border-accent-blue/40 shadow-sm">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-text-primary leading-tight">
                  {currentStep.title}
                </h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>


            {/* STEPPER DOTS */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.key}
                    onClick={() => goToStep(idx)}
                    title={s.title}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-7 bg-accent-blue shadow-glow'
                        : idx < currentStepIndex
                        ? 'w-2 bg-accent-green'
                        : 'w-2 bg-glass-border/60 hover:bg-glass-border'
                    }`}
                  />
                ))}
              </div>

              <span className="text-[10px] text-text-muted font-medium">
                Paso {currentStepIndex + 1} de {TOUR_STEPS.length}
              </span>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="px-4 py-3 bg-glass-primary/30 border-t border-glass-border/40 flex items-center justify-between">
            <button
              onClick={handleEndTour}
              className="text-[11px] text-text-muted hover:text-text-primary font-medium px-2 py-1"
            >
              Salir
            </button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="text-xs h-8 px-2.5"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Anterior
              </Button>

              {isLast ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleEndTour}
                  className="bg-accent-green hover:bg-accent-green/90 text-white text-xs font-bold h-8 px-3 shadow-glow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ¡Completar Tour!
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={nextStep}
                  className="bg-accent-blue hover:bg-accent-blue/90 text-white text-xs font-bold h-8 px-3 shadow-glow"
                >
                  Siguiente Sección <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
