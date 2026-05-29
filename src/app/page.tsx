'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  ArrowUpRight, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Smartphone, 
  MessageSquare, 
  ShieldCheck, 
  ChevronRight, 
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react'
import { useAdminAuthStore } from '@/stores/adminAuthStore'
import { StarBorder } from '@/components/ui/StarBorder'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, admin } = useAdminAuthStore()
  const [mounted, setMounted] = useState(false)
  const [buttonHover, setButtonHover] = useState(false)

  useEffect(() => {
    setMounted(true)
    const htmlElement = document.documentElement
    const bodyElement = document.body
    const hadDark = htmlElement.classList.contains('dark')
    
    // Always ensure light mode is active on this specific view
    htmlElement.classList.remove('dark')
    htmlElement.classList.add('light')
    
    // Force body background color to light to prevent any black margin bleed-through
    bodyElement.style.backgroundColor = '#f8fafc'
    bodyElement.style.color = '#0f172a'
    
    return () => {
      bodyElement.style.backgroundColor = ''
      bodyElement.style.color = ''
      htmlElement.classList.remove('light')
      if (hadDark) {
        htmlElement.classList.add('dark')
      }
    }
  }, [])



  const stats = [
    {
      id: "stat-1",
      number: "120+",
      label: "Proyectos Inmobiliarios",
      description: "Optimizando carteras y acelerando la conciliación mensual.",
      bgColor: "bg-blue-600/5 border-blue-500/10",
      textColor: "text-blue-600"
    },
    {
      id: "stat-2",
      number: "100%",
      label: "Automatización",
      description: "Recibos de caja y alertas automáticas vía SMS y Correo.",
      bgColor: "bg-emerald-500/5 border-emerald-500/10",
      textColor: "text-emerald-600"
    },
    {
      id: "stat-3",
      number: "520k+",
      label: "Cuotas Procesadas",
      description: "Administración integral de plazos, iniciales y ordinarias.",
      bgColor: "bg-[#d4fc34]/10 border-[#d4fc34]/20",
      textColor: "text-lime-700"
    },
    {
      id: "stat-4",
      number: "20+",
      label: "Bancos Integrados",
      description: "Simplificación de medios de pago y reportes en un solo portal.",
      bgColor: "bg-purple-500/5 border-purple-500/10",
      textColor: "text-purple-600"
    }
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#075985] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-x-hidden selection:bg-sky-500 selection:text-white">
      {/* Hero + Nav wrapper with margin and rainbow glow */}
      <div className="p-4 relative overflow-hidden">
        {/* Rainbow glow overlay */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 rounded-[2.5rem] ${buttonHover ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#ff0000,#ff8800,#ffee00,#00ff88,#0088ff,#8800ff,#ff0088,#ff0000)] opacity-60 blur-3xl animate-spin-slow"></div>
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg,#ff0088,#8800ff,#0088ff,#00ff88,#ffee00,#ff8800,#ff0000,#ff0088)] opacity-60 blur-3xl animate-spin-slow-reverse"></div>
        </div>
      {/* 1. Header/Nav */}
      <header className="sticky top-0 z-50 bg-[#0284c7] backdrop-blur-md border-b border-[#38bdf8]/20 transition-all duration-300 rounded-t-[2.5rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 animate-fade-in-down">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md border border-white/20 p-0.5 bg-white">
              <img 
                src="/PERFIL FONDO BLANCO.jpeg" 
                alt="Logo" 
                className="w-full h-full object-cover rounded-lg" 
              />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase">
              OPERIX <span className="text-lime-300 font-medium text-xs tracking-wider block -mt-1 font-mono">COBRANZA</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-white/90">
            <a href="#inicio" className="hover:text-white transition-colors animate-fade-in-down">Inicio</a>
            <a href="#beneficios" className="hover:text-white transition-colors animate-fade-in-down-delay-1">Beneficios</a>
            <a href="#planes" className="hover:text-white transition-colors animate-fade-in-down-delay-2">Planes</a>
            <a href="#seguridad" className="hover:text-white transition-colors animate-fade-in-down-delay-3">Seguridad</a>
          </nav>

          {/* Action Button */}
          <div className="flex items-center space-x-4 animate-fade-in-down-delay-4">
            {isAuthenticated ? (
              <Link 
                href={admin?.role === 'cliente' ? '/portal/dashboard' : '/admin/dashboard'}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#d4fc34] hover:bg-[#c0e82c] text-slate-950 transition-all duration-300 shadow-lg shadow-lime-500/20 hover:scale-[1.03] active:scale-[0.97]"
              >
                Ir a mi Portal
              </Link>
            ) : (
              <Link 
                href="/login"
                className="group px-6 py-2.5 rounded-full text-sm font-bold bg-[#d4fc34] hover:bg-[#c0e82c] text-slate-950 transition-all duration-200 shadow-lg shadow-lime-500/20 hover:scale-[1.03] active:scale-[0.97] flex items-center"
              >
                Ingresar al Portal
                <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="inicio" className="relative bg-gradient-to-b from-[#0284c7] via-[#075985] to-[#0c4a6e] text-white pt-20 pb-0 px-4 sm:px-6 lg:px-8 overflow-visible rounded-b-[2.5rem] shadow-xl">
        {/* Self-contained Backdrop for blurs and gradients to allow the 3D carousel to overflow vertically */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[3.5rem] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.25)_0%,transparent_50%)] opacity-70" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-400/25 rounded-full filter blur-3xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-lime-400/10 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Main Slogan */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            <span className="block animate-fade-in-up" style={{ animationDelay: '0.8s' }}>Construyendo el futuro de la</span>
            <span className="block animate-fade-in-down" style={{ animationDelay: '0.8s' }}><span className="bg-gradient-to-b from-lime-300 via-lime-300 to-white/50 bg-clip-text text-transparent">cobranza inmobiliaria inteligente</span></span>
          </h1>
          
          <p className="text-lg sm:text-xl text-sky-100 max-w-3xl mx-auto mb-10 leading-relaxed font-medium animate-fade-in-up" style={{ animationDelay: '1.4s' }}>
            Automatizamos procesos de recaudo para reducir tareas manuales y mejorar la experiencia de pago.
          </p>

          {/* Call to action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-0 animate-fade-in-up" style={{ animationDelay: '2s' }}>
            <StarBorder
              as={Link}
              href="/login"
              color="white"
              speed="4s"
              thickness={2}
              className="w-full sm:w-auto"
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => setButtonHover(false)}
            >
              <span className="flex items-center justify-center px-8 py-4 rounded-full text-base font-bold bg-[#d4fc34] hover:bg-[#c0e82c] text-slate-950 transition-all duration-300 shadow-xl shadow-lime-500/20 hover:scale-[1.05] active:scale-[0.95]">
                Comenzar Ahora
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </span>
            </StarBorder>
            <a 
              href="#beneficios"
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center justify-center backdrop-blur-sm"
            >
              Ver Beneficios
            </a>
          </div>
        </div>
        {/* 3D Curved Photo Carousel - Expanded to Full Screen Width with Deep Curved 3D & Lateral Fade */}
        <div className="relative mt-0 w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-visible select-none pt-48 pb-20 [perspective:1500px] z-20 carousel-container-masked flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '2.6s' }}>
          <style>{`
            .carousel-container-masked {
              -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
              mask-image: linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%);
            }
            @keyframes rotate-cylinder {
              0% { 
                transform: rotateX(5deg) rotateY(0deg); 
              }
              100% { 
                transform: rotateX(5deg) rotateY(-360deg); 
              }
            }
            .carousel-track-curved-3d {
              position: relative;
              width: 150px;
              height: 150px;
              transform-style: preserve-3d;
              animation: rotate-cylinder 42s linear infinite;
              transition: transform 0.5s ease;
            }
            .carousel-track-curved-3d:hover {
              animation-play-state: paused;
            }
            .carousel-card-3d {
              position: absolute;
              inset: 0;
              border-radius: 1rem;
              overflow: hidden;
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
              border: 1.5px border-white/20;
              background: #075985; /* Solid backdrop matching the hero color theme */
              transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              transform-style: preserve-3d;
              backface-visibility: hidden; /* Hide elements rotating in the back half for a clean foreground-only curve */
            }
            /* Add high-fidelity gloss reflection overlay on hover */
            .carousel-card-3d::after {
              content: '';
              position: absolute;
              inset: 0;
              background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%);
              opacity: 0;
              transition: opacity 0.5s ease;
              pointer-events: none;
            }
            .carousel-card-3d:hover::after {
              opacity: 1;
            }
            .carousel-card-3d:hover {
              transform: rotateY(var(--card-rot)) translateZ(700px) scale(1.15) !important;
              z-index: 100;
              box-shadow: 0 25px 50px -10px rgba(212, 252, 52, 0.6), 0 0 20px 6px rgba(212, 252, 52, 0.35);
              border-color: rgba(212, 252, 52, 0.9);
            }
          `}</style>
          
          <div className="carousel-track-curved-3d">
            {[
              { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop" },
              { src: "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?q=80&w=600&auto=format&fit=crop" }
            ].map((image, idx) => (
              <div 
                key={`carousel-img-${idx}`}
                className="carousel-card-3d cursor-pointer"
                style={{
                  transform: `rotateY(${idx * 20}deg) translateZ(640px)`,
                  // Custom property used by pure CSS hover scaling
                  ['--card-rot' as any]: `${idx * 20}deg`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent z-10 pointer-events-none" />
                <img 
                  src={image.src} 
                  alt={`Proyecto ${idx}`} 
                  className="w-full h-full object-cover filter brightness-95 contrast-105" 
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* 3. Partner / Trust Banner */}
      <section className="py-16 bg-white border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-lime-600 mb-8">
            CONFIADO POR LÍDERES DEL SECTOR INMOBILIARIO
          </p>
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee gap-8 w-max">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex gap-8">
                  {['ALFASUR S.A.', 'INMOBILIARIA ALAMEDA', 'CONSTRUCTORA DEL BOSQUE', 'INVERSIONES PACÍFICO', 'GRUPO INMOBILIARIO', 'DESARROLLOS DEL SUR'].map((name, i) => (
                    <div key={`${setIdx}-${i}`} className="px-8 py-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0">
                      <span className="text-lg font-bold font-mono tracking-tighter text-slate-700 whitespace-nowrap">{name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. About Us / Benefits Section */}
      <section id="beneficios" className="py-24 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Subtitle Accent */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 max-w-4xl mx-auto">
              Tu <span className="text-blue-600">recaudo más ágil</span>, tu <span className="text-[#a3e635] drop-shadow-sm filter brightness-90">cartera más sana</span>
            </h2>
          </div>

          {/* Stats & Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div 
                key={stat.id} 
                className="p-6 rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:border-lime-300/50 hover:scale-[1.02] flex flex-col justify-between group"
              >
                <div>
                  <span className="text-4xl font-extrabold text-lime-500 block mb-3 group-hover:text-lime-600 transition-colors">
                    {stat.number}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {stat.label}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mt-4">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          {/* Detail Mockup Card with a Customer Testimonial style */}
          <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Card: Customer Focused */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white flex flex-col justify-between relative overflow-hidden group shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-2xl group-hover:bg-blue-500/15 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="p-3 bg-white/10 rounded-2xl max-w-max mb-6 backdrop-blur-sm border border-white/10">
                  <Layers className="w-6 h-6 text-lime-300" />
                </div>
                <h3 className="text-2xl font-bold mb-4 leading-tight">
                  Controla cuotas, iniciales y ordinarias desde cualquier lugar
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                  Nuestro sistema te permite automatizar la programación de cuotas iniciales y ordinarias. Administra con precisión los valores de separación, descuentos, bonos y plazos de financiación de cada lote individual.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-6 relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white shadow-glow">
                    AJ
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Alfonso Jiménez</p>
                    <p className="text-[10px] text-slate-400">Director Administrativo, Alfasur</p>
                  </div>
                </div>
                <span className="text-xs text-lime-300 font-mono font-bold">CONCILIADO 100%</span>
              </div>
            </div>

            {/* Right Card: Features Summary */}
            <div className="bg-[#d4fc34] rounded-[2rem] p-8 text-slate-950 flex flex-col justify-between shadow-xl">
              <div>
                <div className="p-3 bg-slate-950/5 rounded-2xl max-w-max mb-6 border border-slate-950/10">
                  <Clock className="w-6 h-6 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black mb-4 leading-tight">
                  Recibos de caja digitales en segundos
                </h3>
                <p className="text-slate-800 text-sm leading-relaxed font-medium">
                  Una vez el pago es aprobado por tu equipo de cartera, el sistema genera automáticamente un recibo de caja digital con validez de auditoría y se lo entrega al cliente en su celular.
                </p>
              </div>

              <Link 
                href="/login"
                className="mt-8 px-6 py-3.5 bg-slate-950 text-white rounded-full text-sm font-bold hover:bg-slate-900 transition-all duration-300 hover:scale-[1.03] flex items-center justify-center"
              >
                Ingresar al Sistema
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Security & Trust Section */}
      <section id="seguridad" className="relative py-32 sm:py-40 bg-gradient-to-b from-[#0284c7] via-[#075985] to-[#0c4a6e] text-white px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Inverted white wave at top */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] rotate-180">
          <svg className="relative block w-full h-[80px] sm:h-[120px]" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,40 C360,120 720,0 1080,40 C1260,60 1350,50 1440,60 L1440,120 L0,120 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.25)_0%,transparent_50%)] opacity-70" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-400/25 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-lime-400/10 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="p-3 bg-white/10 rounded-full max-w-max mx-auto mb-6 border border-white/20 backdrop-blur-sm">
            <ShieldCheck className="w-10 h-10 text-lime-300" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 bg-gradient-to-br from-white via-white to-[#0284c7] bg-clip-text text-transparent leading-tight">
            Tus datos y transacciones están 100% seguros
          </h2>
          <p className="text-sky-100 text-base sm:text-lg mb-10 leading-relaxed font-medium max-w-2xl mx-auto">
            Utilizamos protocolos de encriptación de nivel militar para almacenar soportes de pago, contratos y bases de datos de clientes, garantizando la privacidad de tu equipo comercial y tus compradores.
          </p>
          <div className="inline-flex flex-wrap justify-center gap-6 text-sm font-bold text-white/80">
            <span className="flex items-center"><CheckCircle className="w-4 h-4 text-lime-300 mr-1.5" /> Encriptación SSL/TLS</span>
            <span className="flex items-center"><CheckCircle className="w-4 h-4 text-lime-300 mr-1.5" /> Copias de seguridad automáticas</span>
            <span className="flex items-center"><CheckCircle className="w-4 h-4 text-lime-300 mr-1.5" /> Cumplimiento de datos personales</span>
          </div>
        </div>
        {/* White wave divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-[80px] sm:h-[120px]" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,40 C360,120 720,0 1080,40 C1260,60 1350,50 1440,60 L1440,120 L0,120 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* 5.5 Planes Section */}
      <section id="planes" className="py-24 bg-slate-50 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative glow in background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-10 w-72 h-72 bg-lime-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight max-w-4xl mx-auto mt-6">
              Planes a tu medida, <span className="text-blue-600">sin sorpresas</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mt-4 leading-relaxed font-medium">
              Escala tu negocio inmobiliario pagando únicamente por lo que usas. Todos los beneficios incluidos desde el primer día.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Premium pricing card with interactive glow and custom borders */}
            <div className="relative group p-0.5 rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-sky-400 to-[#d4fc34] shadow-2xl transition-all duration-500 hover:scale-[1.03] hover:shadow-lime-500/10">
              {/* Card Glow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-sky-400 to-[#d4fc34] opacity-20 blur-xl rounded-[2.5rem] pointer-events-none group-hover:opacity-35 transition-opacity" />
              
              <div className="relative bg-white rounded-[2.4rem] p-8 sm:p-10 flex flex-col justify-between h-full">
                {/* Popularity Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center shadow-lg border border-slate-800 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400 mr-2 animate-ping" />
                  Plan Único Pro
                </div>

                <div>
                  <div className="text-center pb-6 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Acceso Completo</p>
                    <div className="mt-4 flex items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 tracking-tight">$10.000</span>
                      <span className="text-lg font-semibold text-slate-500 ml-2">COP / lote al mes</span>
                    </div>
                    <p className="text-xs font-medium text-slate-400 mt-2 italic">+ IVA cobrado mensualmente</p>
                  </div>

                  <div className="py-8 space-y-4">
                    <p className="text-sm font-bold text-slate-900 mb-2">Incluye acceso ilimitado a todos los módulos:</p>
                    {[
                      'Módulo completo de lotes e inventario interactivo',
                      'Gestión inteligente de contratos y cuotas',
                      'Pasarelas de recaudo digital e integración bancaria',
                      'Portal del cliente 24/7 para consulta y pagos',
                      'Automatización de recordatorios vía WhatsApp y Correo',
                      'Recibos de caja digitales con auditoría legal',
                      'Soporte técnico prioritario y actualizaciones sin costo',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-emerald-500 drop-shadow-sm flex-shrink-0 mr-3 mt-0.5" />
                        <span className="text-sm text-slate-600 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link 
                  href="/login"
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-base font-bold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center shadow-xl shadow-slate-950/10"
                >
                  Comenzar ahora
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New White Wave Section */}
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 leading-tight max-w-4xl mx-auto">
              Menos planillas, más <span className="text-blue-600">cobranza efectiva</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto mt-6 leading-relaxed font-medium">
              Deja atrás los procesos manuales y los archivos Excel. Nuestra plataforma centraliza toda tu gestión de cobranza en un solo lugar, ahorrándote horas de trabajo cada semana.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: '80%', label: 'Menos tareas manuales', desc: 'Automatiza recordatorios, recibos y conciliaciones. Tu equipo se enfoca en lo importante.' },
              { number: '24/7', label: 'Portal del cliente activo', desc: 'Tus clientes consultan su estado de cuenta, descargan recibos y realizan pagos desde cualquier dispositivo.' },
              { number: '100%', label: 'Trazabilidad garantizada', desc: 'Cada pago, notificación y movimiento queda registrado con auditoría completa para tu tranquilidad.' },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:border-lime-300/50 transition-all duration-300 group">
                <span className="text-5xl font-black text-lime-500 block mb-3 group-hover:text-lime-600 transition-colors">{item.number}</span>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{item.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 sm:p-12 text-white text-center shadow-xl">
            <p className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">¿Listo para transformar tu cobranza?</p>
            <p className="text-slate-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto font-medium">Únete a las inmobiliarias que ya optimizan sus recaudos con nuestra plataforma.</p>
            <Link 
              href="/login"
              className="inline-flex items-center px-10 py-4 rounded-full text-base font-bold bg-[#d4fc34] text-slate-950 hover:bg-[#c0e82c] transition-all duration-300 shadow-xl shadow-lime-500/20 hover:scale-[1.05]"
            >
              Comenzar ahora
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Benefits Section */}
      <section id="beneficios-detalle" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-[#0284c7] via-[#075985] to-[#0c4a6e]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(56,189,248,0.25)_0%,transparent_50%)] opacity-70" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-400/25 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-lime-400/10 rounded-full filter blur-3xl opacity-30 animate-pulse" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black mt-6 leading-tight max-w-4xl mx-auto drop-shadow-lg">
              <span className="text-white">Beneficios que transforman</span><br />
              <span className="text-white">tu</span> <span className="bg-gradient-to-b from-lime-300 via-lime-300 to-white/50 bg-clip-text text-transparent">gestión de cobranza</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mt-6 leading-relaxed font-medium drop-shadow">
              Automatización inteligente que reduce costos operativos y mejora la experiencia de pago de tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <MessageSquare className="w-7 h-7" />, title: 'Recordatorios Inteligentes', desc: 'Programa notificaciones automáticas vía WhatsApp y email. Reduce tareas manuales hasta un 80%.' },
              { icon: <TrendingUp className="w-7 h-7" />, title: 'Dashboard en Tiempo Real', desc: 'Visualiza el estado de tu cartera, mora, recaudos y proyecciones con reportes exportables a Excel y PDF.' },
              { icon: <ShieldCheck className="w-7 h-7" />, title: 'Seguridad y Auditoría', desc: 'Cada transacción queda registrada con trazabilidad completa. Recibos digitales con validez legal y respaldo.' },
              { icon: <DollarSign className="w-7 h-7" />, title: 'Múltiples Medios de Pago', desc: 'Integración con transferencias, link de pago y pasarelas. Tus clientes pagan desde donde prefieran, sin fricción.' },
              { icon: <Smartphone className="w-7 h-7" />, title: 'Portal del Cliente', desc: 'Cada cliente tiene acceso a su historial de pagos, recibos digitales y estado de cuenta desde su celular 24/7.' },
              { icon: <CheckCircle className="w-7 h-7" />, title: 'Conciliación Automática', desc: 'Los pagos se concilian al instante sin intervención manual. Elimina errores humanos y acelera tu cierre contable.' },
            ].map((item, i) => (
              <div 
                key={i} 
                className="bg-white rounded-[2rem] p-8 text-slate-900 flex flex-col justify-between shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group border border-white/20"
              >
                <div>
                  <div className="p-3 bg-slate-100 rounded-2xl max-w-max mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
                <div className="mt-6 w-full flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold bg-[#d4fc34] text-slate-950 hover:bg-[#c0e82c] transition-all duration-300 shadow-sm hover:shadow-md group-hover:gap-2">
                  Saber más <ChevronRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link 
              href="/login"
              className="inline-flex items-center px-10 py-4 rounded-full text-base font-bold bg-[#d4fc34] hover:bg-[#c0e82c] text-slate-950 transition-all duration-300 shadow-xl shadow-lime-500/20 hover:scale-[1.05] active:scale-[0.95]"
            >
              Comenzar ahora
              <ArrowUpRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 p-0.5 bg-white">
              <img 
                src="/PERFIL FONDO BLANCO.jpeg" 
                alt="Logo" 
                className="w-full h-full object-cover rounded" 
              />
            </div>
            <span className="text-white font-black uppercase text-sm tracking-widest">
              OPERIX COBRANZA
            </span>
          </div>

          <div className="text-center md:text-right text-xs text-slate-500">
            <p className="mb-2">© 2026 Operix Cobranza Inmobiliaria. Todos los derechos reservados.</p>
            <p>Diseño premium optimizado e independiente de tema.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}