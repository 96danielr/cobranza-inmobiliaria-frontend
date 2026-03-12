# Portal del Cliente - Sistema de Cobranza Inmobiliaria

Portal web desarrollado con **Next.js 14** para que los clientes puedan gestionar sus pagos y contratos inmobiliarios de forma autónoma.

## 🚀 Características Principales

- **Autenticación segura** con cédula y PIN
- **Dashboard interactivo** con notificaciones inteligentes
- **Gestión de pagos** con carga de comprobantes
- **Historial completo** de pagos con descarga de recibos
- **Detalle de contratos** con plan de pagos completo
- **Diseño responsive** optimizado para móviles
- **Notificaciones en tiempo real** sobre vencimientos y mora

## 🛠️ Tecnologías

- **Next.js 14** con App Router
- **TypeScript** para tipado estático
- **Tailwind CSS** para styling
- **Zustand** para gestión de estado
- **React Hook Form + Zod** para formularios y validación
- **Axios** para peticiones HTTP
- **dayjs** para manejo de fechas
- **Lucide React** para iconografía

## 📱 Páginas Implementadas

### 🔐 Autenticación
- **Login** - Ingreso con cédula y PIN de 4 dígitos

### 🏠 Portal Protegido
- **Home** - Dashboard con contratos, notificaciones y acciones rápidas
- **Detalle de Contrato** - Plan de pagos completo con estados y acciones
- **Reportar Pago** - Formulario con carga de comprobantes (drag & drop)
- **Historial de Pagos** - Lista filtrable con descarga de recibos
- **Perfil** - Datos personales y cambio de PIN

## 🎨 Componentes UI

### Componentes Base
- `Button` - Múltiples variantes y estados de carga
- `Input` - Con validación visual y labels
- `Card` - Header, Content, Footer modulares
- `Badge` - Estados con colores semánticos
- `Select` - Dropdown con opciones
- `ProgressBar` - Barras de progreso dinámicas
- `FileUpload` - Drag & drop con preview
- `Modal` - Modales con confirmación
- `LoadingSpinner` - Estados de carga y skeletons

### Componentes Especializados
- `ContractCard` - Cards del dashboard principal
- `NotificationCard` - Alertas con iconos y colores
- `PlanPagosTable` - Tabla responsive del plan de pagos
- `PaymentCard` - Cards del historial de pagos
- `Navbar` - Navegación superior
- `Sidebar` - Navegación lateral (desktop)
- `MobileNav` - Navegación inferior (móvil)

## 🔧 Configuración

### 1. Instalación
\`\`\`bash
npm install
\`\`\`

### 2. Variables de Entorno
Copia `.env.local.example` a `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
\`\`\`

### 3. Desarrollo
\`\`\`bash
npm run dev
\`\`\`

El portal estará disponible en `http://localhost:3002`

### 4. Producción
\`\`\`bash
npm run build
npm start
\`\`\`

## 📋 Funcionalidades por Página

### 🏠 Home Dashboard
- **Saludo personalizado** con fecha actual
- **Notificaciones inteligentes**:
  - 🟡 Cuotas por vencer (≤5 días)
  - 🔴 Cuotas en mora
  - 🔵 Pagos en revisión
  - 🔴 Pagos rechazados
- **Cards de contratos** con:
  - Progreso visual de pagos
  - Información financiera
  - Estados de vencimiento
  - Acciones rápidas

### 📋 Detalle de Contrato
- **Información completa** del lote y proyecto
- **Resumen financiero** en grid responsive
- **Plan de pagos** completo con tabla/cards
- **Estados por cuota**:
  - ✅ PAGADA (con descarga de recibo)
  - ⏳ PENDIENTE
  - 🔴 VENCIDA (con botón pagar)
  - 🟡 EN_REVISION
- **Próxima cuota** resaltada

### 💰 Reportar Pago
- **Formulario inteligente** con pre-llenado
- **Selección de contrato** y cuota automática
- **Carga de archivos** drag & drop:
  - JPG, PNG, PDF (máx 5MB)
  - Preview de imágenes
  - Validación en tiempo real
- **Bancos predefinidos** + opción "Otro"
- **Validación de fechas** (no futuras, max 30 días atrás)

### 📊 Historial de Pagos
- **Filtros por estado** con contadores
- **Cards responsive** con toda la información
- **Descargas de recibos** para pagos aprobados
- **Motivos de rechazo** visibles
- **Estados de revisión** con iconos

### 👤 Perfil
- **Datos personales** (solo lectura)
- **Cambio de PIN**:
  - Validación de PIN actual
  - Confirmación de nuevo PIN
  - Toggle para mostrar/ocultar
- **Cierre de sesión** con confirmación

## 🎨 Diseño y UX

### Paleta de Colores
- **Primary**: `#2563eb` (azul)
- **Success**: `#16a34a` (verde)
- **Warning**: `#eab308` (amarillo)
- **Danger**: `#dc2626` (rojo)
- **Background**: `#f8fafc` (gris claro)

### Responsive Design
- **Mobile First**: Optimizado para celulares
- **Breakpoints**:
  - `sm`: 640px+
  - `md`: 768px+
  - `lg`: 1024px+
  - `xl`: 1280px+

### Navegación
- **Desktop**: Sidebar fijo + navbar superior
- **Mobile**: Bottom navigation + hamburger menu
- **Estados activos** con colores y animaciones
- **Transiciones suaves** entre páginas

## 🔐 Autenticación y Seguridad

- **JWT tokens** con refresh automático
- **Interceptors** para logout automático en 401
- **Validación client-side** con Zod
- **Persistencia** en localStorage (solo datos necesarios)
- **Rutas protegidas** with layout verification

## 📱 Optimizaciones Móviles

- **Touch-friendly** buttons y inputs
- **Navegación inferior** fija
- **Cards apilables** en lugar de tablas
- **Drag & drop** optimizado para móvil
- **Loading states** específicos para móvil
- **Botones fijos** para acciones principales

## 🌐 Integración con Backend

### Endpoints Consumidos
- `POST /api/auth/client/login` - Login
- `POST /api/auth/client/change-pin` - Cambiar PIN
- `GET /api/portal/home` - Dashboard
- `GET /api/portal/contract/:id` - Detalle contrato
- `GET /api/portal/payments` - Historial pagos
- `POST /api/portal/report-payment` - Reportar pago
- `GET /api/portal/receipt/:paymentId` - Descargar recibo

### Manejo de Errores
- **Interceptors** para errores HTTP
- **Toasts** para feedback al usuario
- **Fallbacks** para estados de error
- **Redirects** automáticos en errores críticos

## 🚀 Próximos Pasos

Para un lanzamiento completo, considera:

1. **Tests unitarios** con Jest + Testing Library
2. **E2E tests** con Playwright
3. **PWA capabilities** para instalación móvil
4. **Push notifications** para vencimientos
5. **Offline support** para funciones críticas
6. **Analytics** para métricas de uso
7. **SEO optimization** si hay páginas públicas

## 📞 Soporte

Para soporte técnico o reportar bugs, contacta al equipo de desarrollo.

---

**Portal del Cliente v1.0** - Sistema de Cobranza Inmobiliaria 🏠