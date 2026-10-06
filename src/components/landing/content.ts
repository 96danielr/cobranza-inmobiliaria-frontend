// All landing copy, figures and links in one place, so they can be edited without touching the layout.
// Values in [brackets] are pending from the commercial team (see ./PENDIENTES.md in the Operix folder).
import { money, monthlyPrice } from './lotFeed'

/** WhatsApp link with a prefilled message. Until the commercial number arrives, CTAs point to the contact section. */
const WHATSAPP_NUMBER: string | null = null
const WHATSAPP_TEXT = 'Hola, quiero conocer Operix para la cobranza de mis lotes.'
export const whatsappHref = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`
  : '#contacto'

export const landing = {
  nav: [
    { href: '/#como', label: 'Cómo funciona' },
    { href: '/#beneficios', label: 'Beneficios' },
    { href: '/#planes', label: 'Planes' },
    { href: '/#seguridad', label: 'Seguridad' },
  ],
  login: [
    { href: '/admin/login', label: 'Empresa', hint: 'Portal de tu inmobiliaria' },
    { href: '/login', label: 'Cliente', hint: 'Portal de tus compradores' },
  ],
  cta: { whatsapp: 'Hablar por WhatsApp', demo: 'Pide una demo' },
  hero: {
    eyebrow: ['Operix', 'Cobranza inmobiliaria'],
    title: 'Construyendo el futuro de la cobranza inmobiliaria inteligente',
    lead: 'Automatizamos procesos de recaudo para reducir tareas manuales y mejorar la experiencia de pago.',
    secondary: 'Ver cómo funciona',
  },
  logos: {
    title: 'Confiado por líderes del sector inmobiliario',
    names: ['ALFASUR S.A.', 'INMOBILIARIA ALAMEDA', 'CONSTRUCTORA DEL BOSQUE', 'INVERSIONES PACÍFICO', 'GRUPO INMOBILIARIO', 'DESARROLLOS DEL SUR'],
  },
  how: {
    eyebrow: 'Cómo funciona',
    title: 'Cada cuota, cobrada y registrada',
    lead: 'Tu comprador sube el comprobante. Tú apruebas con un clic. Operix genera el recibo y suma lo recaudado de cada lote.',
    more: 'Ver precios',
  },
  lots: [
    { lot: 'Lote 12', fee: 4500000 },
    { lot: 'Lote 7', fee: 3800000 },
    { lot: 'Lote 21', fee: 5200000 },
  ],
  interludes: {
    afterHow: ['Menos tiempo persiguiendo pagos.', 'Más tiempo vendiendo lotes.'],
    beforePlans: ['Sin costos de instalación.', 'Pagas solo por los lotes que cobras.'],
  },
  benefits: {
    eyebrow: 'Beneficios',
    title: 'Menos planillas, más recaudo',
    items: [
      { icon: 'calendar', title: 'Cada lote con su plan de pagos', text: 'Separación, cuota inicial y cuotas, con sus fechas.' },
      { icon: 'receipt', title: 'Recibos de caja al instante', text: 'Se genera al aprobar el pago y le llega a tu comprador por WhatsApp y correo.' },
    ],
    more: 'Ver planes y precios',
    stats: [
      { value: 120, suffix: '+', label: 'proyectos inmobiliarios' },
      { value: 100, suffix: '%', label: 'automatización' },
      { value: 520, suffix: 'k+', label: 'cuotas procesadas' },
      { value: 20, suffix: '+', label: 'bancos integrados' },
    ],
    // descriptions from the original landing (kept by product decision; see tarea-45 in the Mapa)
    features: [
      { icon: 'bell', label: 'Recordatorios inteligentes', text: 'Avisos antes de cada vencimiento.' },
      { icon: 'chart', label: 'Dashboard en tiempo real', text: 'Cartera, mora y recaudo al día.' },
      { icon: 'user', label: 'Portal del cliente', text: 'Pagos y recibos desde el celular.' },
      { icon: 'card', label: 'Múltiples medios de pago', text: 'Transferencia, link o pasarela.' },
      { icon: 'swap', label: 'Conciliación automática', text: 'Cada pago cruza con su cuota.' },
      { icon: 'shield', label: 'Seguridad y auditoría', text: 'Quién hizo qué y cuándo.' },
    ],
  },
  quote: {
    text: '[Cita pendiente: pedir a Alfasur unas palabras sobre su experiencia con Operix]',
    pending: true,
    // Proposed wording to send to Alfasur. It is not their words until they approve it: shown only in
    // local development (with a "draft" tag); production keeps the placeholder until `approved` is true.
    draft: 'Antes cuadrábamos la cartera en planillas y perseguíamos cada comprobante por WhatsApp. Con Operix cada pago llega con su soporte, lo aprobamos en un clic y el comprador recibe su recibo al instante.',
    approved: false,
    name: 'Alfonso Jiménez',
    role: 'Director Administrativo, Alfasur',
    initials: 'AJ',
  },
  security: {
    eyebrow: 'Seguridad',
    title: 'Tus datos y transacciones están 100% seguros',
    lead: 'Soportes de pago, contratos y datos de tus compradores, protegidos y respaldados.',
    items: [
      { icon: 'lock', label: 'Encriptación SSL/TLS' },
      { icon: 'database', label: 'Copias de seguridad automáticas' },
      { icon: 'shield', label: 'Cumplimiento de datos personales' },
    ],
  },
  plans: {
    eyebrow: 'Planes',
    title: 'Un solo plan, sin sorpresas',
    lead: 'Pagas solo por los lotes que tienes. Todo incluido desde el primer día.',
    price: '$10.000',
    unit: 'COP / lote al mes + IVA',
    example: `Ej.: 120 lotes = ${money(monthlyPrice(120))} al mes con IVA.`,
    includedTitle: 'Incluye todos los módulos',
    included: [
      'Módulo completo de lotes e inventario interactivo',
      'Gestión inteligente de contratos y cuotas',
      'Pasarelas de recaudo digital e integración bancaria',
      'Portal del cliente 24/7 para consulta y pagos',
      'Automatización de recordatorios vía WhatsApp y correo',
      'Recibos de caja digitales con auditoría legal',
      'Soporte técnico prioritario y actualizaciones sin costo',
    ],
  },
  contact: {
    eyebrow: 'Contacto',
    title: '¿Listo para transformar tu cobranza?',
    lead: 'Únete a las inmobiliarias que ya optimizan sus recaudos con nuestra plataforma.',
    email: null as string | null,
    emailPending: '[correo comercial pendiente]',
    consent: 'Al escribirnos aceptas nuestra',
    consentLink: 'política de tratamiento de datos personales',
  },
  footer: {
    about: 'Automatización inteligente que reduce costos operativos y mejora la experiencia de pago de tus clientes.',
    legal: [
      { href: '/terminos', label: 'Términos y condiciones' },
      { href: '/privacidad', label: 'Tratamiento de datos personales' },
    ],
    rights: `© ${new Date().getFullYear()} Operix`,
    madeIn: 'Hecho en Colombia',
  },
}
