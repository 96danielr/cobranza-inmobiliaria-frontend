import type { Metadata } from 'next'
import '@/components/landing/landing.css'
import HeaderBar from '@/components/landing/client/HeaderBar'
import Footer from '@/components/landing/sections/Footer'
import LegalDoc from '@/components/legal/LegalDoc'
import { terms } from '@/components/legal/terms'

export const metadata: Metadata = {
  title: 'Términos y condiciones · Operix',
  description: 'Términos y condiciones de uso de la plataforma Operix.',
}

export default function TermsPage() {
  return (
    <main className="landing">
      <HeaderBar />
      <LegalDoc markdown={terms} />
      <Footer />
    </main>
  )
}
