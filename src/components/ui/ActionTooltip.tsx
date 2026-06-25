import React from 'react'

export interface ActionTooltipProps {
  content: string
  children: React.ReactNode
}

export function ActionTooltip({ content, children }: ActionTooltipProps) {
  return (
    <div className="flex flex-col items-center justify-center min-w-[60px] text-center">
      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1 block select-none">
        {content}
      </span>
      {children}
    </div>
  )
}
