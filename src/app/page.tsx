import type { Metadata } from 'next'
import '@/components/landing/landing.css'
import HeaderBar from '@/components/landing/client/HeaderBar'
import LandingEffects from '@/components/landing/client/LandingEffects'
import Hero from '@/components/landing/sections/Hero'
import Logos from '@/components/landing/sections/Logos'
import HowItWorks from '@/components/landing/sections/HowItWorks'
import Interlude from '@/components/landing/sections/Interlude'
import Benefits from '@/components/landing/sections/Benefits'
import Quote from '@/components/landing/sections/Quote'
import Security from '@/components/landing/sections/Security'
import Plans from '@/components/landing/sections/Plans'
import Contact from '@/components/landing/sections/Contact'
import Footer from '@/components/landing/sections/Footer'
import { landing } from '@/components/landing/content'

export const metadata: Metadata = {
  title: 'Operix · Cobranza inmobiliaria para venta de lotes a plazos',
  description: 'Tu comprador sube el comprobante, tú apruebas con un clic y Operix genera el recibo y suma lo recaudado de cada lote.',
  openGraph: {
    title: 'Operix · Cobranza inmobiliaria',
    description: 'Cobranza de cuotas para inmobiliarias que venden lotes a plazos.',
    locale: 'es_CO',
    type: 'website',
  },
}

export default function Home() {
  return (
    <main className="landing">
      {/* without JavaScript, content that normally fades in on scroll is shown right away */}
      <noscript><style>{'.landing .rv{opacity:1;transform:none}'}</style></noscript>
      <HeaderBar />
      <Hero />
      <Logos />
      <HowItWorks />
      <Interlude lines={landing.interludes.afterHow} />
      <Benefits />
      <Quote />
      <Security />
      <Interlude lines={landing.interludes.beforePlans} />
      <Plans />
      <Contact />
      <Footer />
      <LandingEffects />
    </main>
  )
}
