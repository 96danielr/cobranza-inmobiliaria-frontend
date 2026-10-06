import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // absolute base for share images and other relative metadata URLs
  metadataBase: new URL('https://operix.com.co'),
  title: 'Portal Cliente - Sistema de gestión y automatización inmobiliaria',
  description: 'Portal del cliente para gestión de pagos, contratos e inmobiliarias',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

import { ThemeProvider } from '@/components/layout/ThemeProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#16a34a',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </body>
    </html>
  )
}