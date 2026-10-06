import type { Metadata } from 'next'
import '@/components/landing/landing.css'
import HeaderBar from '@/components/landing/client/HeaderBar'
import Footer from '@/components/landing/sections/Footer'
import LegalDoc from '@/components/legal/LegalDoc'
import { privacy } from '@/components/legal/privacy'

export const metadata: Metadata = {
  title: 'Política de tratamiento de datos personales · Operix',
  description: 'Cómo Operix trata los datos personales, conforme a la Ley 1581 de 2012.',
}

export default function PrivacyPage() {
  return (
    <main className="landing">
      <HeaderBar />
      <LegalDoc markdown={privacy} />
      <Footer />
    </main>
  )
}
