import React from 'react'

interface StarBorderProps {
  as?: React.ElementType
  className?: string
  color?: string
  speed?: string
  thickness?: number
  children?: React.ReactNode
  [key: string]: unknown
}

export const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}) => {
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-full ${className}`}
      style={{
        padding: `${thickness}px 0`,
        ...(rest.style as React.CSSProperties)
      }}
      {...rest}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-80 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
          filter: 'blur(1px)'
        }}
      ></div>
      <div
        className="absolute w-[300%] h-[50%] opacity-80 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
          filter: 'blur(1px)'
        }}
      ></div>
      <div className="relative z-[1] w-full h-full">
        {children}
      </div>
    </Component>
  )
}
