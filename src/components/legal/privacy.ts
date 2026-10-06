import { company as c } from './company'

// Personal data processing policy (Ley 1581 de 2012, Decreto 1074 de 2015). Markdown rendered by LegalDoc.
export const privacy = `
# Política de tratamiento de datos personales

Última actualización: ${c.updated}

En cumplimiento de la **Ley 1581 de 2012**, el **Decreto 1074 de 2015** (que compila el Decreto 1377 de 2013) y demás normas que los modifiquen, **${c.name}** («Operix») adopta esta política para el tratamiento de los datos personales que recibe a través de la plataforma Operix y de sus canales de contacto.

## 1. Responsable del tratamiento

- **Razón social:** ${c.name}
- **NIT:** ${c.nit}
- **Domicilio:** ${c.address}
- **Correo para datos personales:** ${c.privacyEmail}
- **Teléfono:** ${c.phone}
- **Sitio web:** ${c.website}

## 2. A quién aplica y en qué calidad actúa Operix

| Titulares | Calidad de Operix |
|---|---|
| Inmobiliarias clientes, sus representantes y los usuarios del portal empresa | **Responsable** |
| Personas que nos contactan por WhatsApp, correo o el sitio web (prospectos comerciales) | **Responsable** |
| Compradores de las inmobiliarias (usuarios del portal cliente) | **Encargado**, por cuenta de la inmobiliaria, que es la Responsable |

Cuando Operix actúa como **Encargado**, trata los datos de los Compradores solo para prestar el servicio a la inmobiliaria y según sus instrucciones. Las consultas y reclamos sobre esos datos deben dirigirse en primer lugar a la inmobiliaria con la que el Comprador celebró su contrato; Operix la apoyará para responderlos.

## 3. Datos que tratamos

**De las inmobiliarias y sus usuarios:** nombre, documento de identidad, correo, teléfono, cargo o rol, foto de perfil (opcional), credenciales de acceso (la contraseña se guarda cifrada), códigos de verificación y registros de actividad (fecha, acción, dirección IP y navegador) para auditoría y seguridad.

**De los Compradores (por cuenta de la inmobiliaria):** nombre, número y lugar de expedición del documento de identidad, teléfonos, correo, dirección, lotes o inmuebles comprados, contratos, planes de pago, cuotas, pagos, comprobantes de pago (imágenes o archivos), recibos, mensajes intercambiados por WhatsApp con la inmobiliaria, y registros de las llamadas atendidas por el agente de voz (duración, intención, promesas de pago y transcripción).

**De los prospectos:** nombre, empresa, teléfono, correo y el contenido de su mensaje.

Operix **no solicita datos sensibles** (como datos de salud, biométricos u orientación política) ni datos de menores de edad. Si un titular los incluye voluntariamente en un mensaje o archivo, no está obligado a hacerlo y Operix los tratará con especial reserva.

## 4. Finalidades

1. Prestar el servicio de gestión de cobranza contratado por la inmobiliaria: registrar compradores y contratos, generar planes de pago, recibir y aprobar reportes de pago, generar recibos y estados de cuenta, y calcular comisiones.
2. Enviar a los Compradores notificaciones relacionadas con su obligación (recibos, estados de cuenta, recordatorios y avisos) por WhatsApp, SMS, correo o llamada, según lo configure la inmobiliaria.
3. Permitir el acceso seguro a los portales, verificar la identidad con códigos de un solo uso y prevenir fraudes y accesos no autorizados.
4. Atender solicitudes de soporte, consultas, peticiones, quejas y reclamos.
5. Ofrecer funciones de inteligencia artificial y agente de voz que la inmobiliaria active, para responder preguntas sobre su información o atender llamadas de cobro y soporte.
6. Facturar, cobrar el servicio y cumplir obligaciones legales, contables y tributarias.
7. Contactar a prospectos que nos escriben para presentarles Operix, y enviar a los clientes información sobre el servicio. El titular puede pedir en cualquier momento que no se le envíe información comercial.
8. Generar estadísticas agregadas y anónimas para mejorar la plataforma.

## 5. Derechos de los titulares

Como titular de datos personales usted tiene derecho a:

1. Conocer, actualizar y rectificar sus datos.
2. Solicitar prueba de la autorización otorgada, salvo cuando no se requiera según la ley.
3. Ser informado sobre el uso que se ha dado a sus datos.
4. Presentar quejas ante la **Superintendencia de Industria y Comercio (SIC)** por infracciones a la ley, una vez agotado el trámite de consulta o reclamo ante el Responsable o el Encargado.
5. Revocar la autorización y pedir la supresión de sus datos cuando no exista un deber legal o contractual de conservarlos.
6. Acceder en forma gratuita a sus datos.

## 6. Cómo ejercer sus derechos

Envíe su solicitud al correo **${c.privacyEmail}** indicando: nombre completo y documento de identidad, la descripción de la solicitud, la dirección o correo para responderle, y los documentos que quiera hacer valer. Si actúa en representación de otra persona, adjunte el poder o el documento que lo acredite.

- **Consultas:** se responden en un máximo de diez (10) días hábiles desde su recibo. Si no es posible, le informaremos el motivo y la nueva fecha, que no superará cinco (5) días hábiles adicionales.
- **Reclamos** (corrección, actualización, supresión o incumplimiento): se responden en un máximo de quince (15) días hábiles desde el día siguiente a su recibo. Si el reclamo está incompleto, le pediremos completarlo dentro de los cinco (5) días siguientes; si pasan dos (2) meses sin respuesta, se entenderá desistido. Si no es posible responder en el plazo, le informaremos el motivo y la nueva fecha, que no superará ocho (8) días hábiles adicionales.

Si usted es Comprador de una inmobiliaria, también puede dirigirse directamente a ella.

## 7. Autorización

Operix solicita la autorización de los titulares de los que es Responsable al momento de recolectar sus datos (por ejemplo, al crear una cuenta o al escribirnos). En el caso de los Compradores, es la inmobiliaria quien debe obtener la autorización previa, expresa e informada para tratar sus datos y contactarlos por los canales que use en Operix.

## 8. Proveedores y transferencia o transmisión internacional

Para prestar el servicio usamos proveedores que pueden tratar datos por nuestra cuenta, en servidores ubicados en Colombia o en el exterior:

| Proveedor | Uso |
|---|---|
| DigitalOcean | Servidores de la aplicación |
| MongoDB Atlas | Base de datos |
| Cloudflare (R2) | Almacenamiento de archivos, como comprobantes y recibos |
| Twilio y Meta (WhatsApp Business) | Mensajes de WhatsApp y SMS |
| Resend | Envío de correos |
| Google (Gemini) | Funciones de inteligencia artificial |
| ElevenLabs | Agente de voz |

Exigimos a estos proveedores medidas de seguridad y confidencialidad adecuadas y que traten los datos solo para prestarnos sus servicios. La transmisión internacional se hace conforme a los artículos 26 de la Ley 1581 de 2012 y 2.2.2.25.5.2 del Decreto 1074 de 2015.

## 9. Seguridad

Aplicamos medidas técnicas y administrativas razonables para proteger los datos: conexiones cifradas (HTTPS), contraseñas cifradas, verificación por código de un solo uso, control de acceso por roles y por empresa, registros de auditoría y copias de seguridad. Ningún sistema es completamente infalible; si ocurre un incidente que afecte datos personales, lo informaremos a quien corresponda y a la SIC en los términos de la ley.

## 10. Conservación

Conservamos los datos mientras exista la relación con la inmobiliaria o con el titular y durante el tiempo necesario para cumplir las finalidades y las obligaciones legales (por ejemplo, la información contable se conserva por el término que exija la ley). Al terminar el servicio con una inmobiliaria, sus datos se eliminan o anonimizan según los términos y condiciones.

## 11. Cookies y almacenamiento local

El sitio y la plataforma usan almacenamiento local del navegador y cookies técnicas, necesarias para mantener la sesión iniciada, recordar preferencias (como el tema visual) y proteger la cuenta. **No usamos cookies de publicidad ni de seguimiento de terceros.** Puede borrarlas desde la configuración de su navegador; si lo hace, deberá iniciar sesión de nuevo.

## 12. Vigencia y cambios

Esta política rige desde la fecha de su publicación. Las bases de datos se mantendrán vigentes mientras se cumplan las finalidades descritas. Los cambios sustanciales se informarán en este sitio y, cuando corresponda, por correo, antes de aplicarse.
`
