'use client'

/** Small 3D vignette ("secure" or "close"). The engine is mounted in Task 5. */
export default function MiniScene({ kind, className }: { kind: 'secure' | 'close'; className?: string }) {
  return <div className={className} data-mini={kind} aria-hidden="true" />
}
