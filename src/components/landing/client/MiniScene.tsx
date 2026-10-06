'use client'

import { useEffect, useRef } from 'react'
import { mountMiniScene } from '../miniScenes'

/** Small 3D vignette ("secure" or "close") from the approved prototype. */
export default function MiniScene({ kind, className }: { kind: 'secure' | 'close' | 'home'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? mountMiniScene(ref.current, kind) : undefined), [kind])
  return <div className={className} data-mini={kind} ref={ref} aria-hidden="true" />
}
