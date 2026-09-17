# Plan definitivo — Unicidad de inmuebles y carga masiva multi-tipo

**Estado:** propuesta para revisión. No implementa código todavía.
**Alcance:** `github-repo-manager-backend` (núcleo) + `cobranza-inmobiliaria-frontend` (UI y carga masiva).
**Reemplaza:** los dos planes anteriores (parametrización por tipo y `uniqueCode` con columna TIPO por fila).

**Idea central:** la unicidad de un inmueble se garantiza con una llave de negocio persistida (`unitKey`) más un índice único parcial en MongoDB. La carga masiva usa la misma llave, valida el archivo antes de escribir y reporta fila por fila. La nomenclatura es solo presentación y la genera un único componente (backend).

---

## Quick path (lo que hay que revisar primero)

1. **Identidad:** `unitKey` canónico por tipo, calculado siempre en el backend (`tipo|etapa|bloque|unidad`).
2. **Garantía:** índice único parcial `{ companyId, unitKey }` con `isDeleted: false` (convive con el archivado actual).
3. **Migración:** backfill + auditoría de duplicados históricos **antes** de crear el índice; sin eso el índice falla.
4. **Import:** tipo del proyecto como fuente de verdad, columnas por tipo, duplicados en archivo rechazados con número de fila, archivados con política explícita, reporte por fila.
5. **Frontend:** muestra la nomenclatura que envía el backend, maneja el 409 de duplicado y presenta el reporte de errores de importación.
6. **Pruebas:** unitarias del helper + integración (duplicado → 409, reimport idempotente, archivar/recrear, restaurar en conflicto, editar a duplicado, import con duplicados internos).

---

## Decisiones clave

| Tema | Decisión propuesta | Por qué |
|---|---|---|
| Campo de identidad | `unitKey` **persistido** (no virtual) | Un virtual de Mongoose no se puede indexar; sin campo real no hay garantía en BD |
| Composición | Misma estructura para los 4 tipos, con `stage` siempre | La numeración se reinicia por etapa; quitarlo genera colisiones entre etapas |
| Piso | **Fuera** de la llave por defecto; entra solo si el cliente confirma que la numeración se repite por piso | Si es descriptivo, incluirlo crea falsos "no existe" cuando se omite o se escribe distinto |
| Tipo por fila (Excel) | El tipo del proyecto (`Company.propertyType`) manda; la columna `TIPO` se acepta **solo si coincide** (modo mixto desactivado por defecto) | Evita inventario mixto invisible para una UI que trabaja en modo "un tipo por proyecto" |
| Soft delete | Índice único **parcial** (`isDeleted: false`) + conflicto explícito en `restoreLot` | El sistema archiva y permite recrear; un índice simple rompería ambos flujos |
| Errores | `409 DUPLICATE_UNIT` con el inmueble existente en el mensaje | El pre-chequeo solo tiene carrera; el índice es el árbitro y el error debe ser útil |
| Nomenclatura | Un solo generador en backend; frontend solo muestra | Hoy hay tres generadores con formatos distintos (ver Anexo) |
| Legacy (`ref|nom`) | Solo como lookup secundario durante la migración | Dos esquemas de llave sin precedencia producen duplicados silenciosos |
| Carga masiva | Rechazo explícito de duplicados internos + reporte por fila | Hoy el import fusiona en silencio; el "last wins" esconde errores de digitación |
| Import genérico | Fase 1: bloqueado para proyectos ≠ `lotes`; portado a `unitKey` en fase 2 | Evita prometer algo que el import de contratos aún no soporta |

---

## 1. Decisiones de negocio a cerrar (con valor por defecto recomendado)

| # | Pregunta | Impacto | Default propuesto |
|---|---|---|---|
| 1 | ¿La numeración se reinicia por etapa / manzana / torre? | Define qué campos entran en la llave | Sí reinicia: `stage` entra siempre |
| 2 | ¿El piso hace parte del número (se repite "01" por piso) o es descriptivo? | Entra o no en la llave de apartamentos | Descriptivo: **no** entra |
| 3 | ¿Proyectos mixtos o un tipo por proyecto? | Determina si `TIPO` por fila se acepta y si la UI necesita filtros por tipo | Un tipo por proyecto |
| 4 | Un inmueble archivado que se reimporta, ¿se ignora o se restaura? | Comportamiento del import | Se ignora con warning y se reporta |
| 5 | ¿Quién resuelve los duplicados históricos? | Viabilidad de crear el índice | Script automático para duplicados sin contrato; reporte manual si tienen contratos |

Mientras 1, 2 y 3 no estén cerradas con el cliente, la fase de índice único no debe desplegarse.

---

## 2. Identidad: composición de `unitKey`

### 2.1 Componentes por tipo

| Tipo | Componentes de identidad | Formato de `unitKey` |
|---|---|---|
| `lotes` | etapa + manzana + número de lote | `lote:{stage}:{manzana}:{unit}` |
| `casas` | etapa + manzana + número de casa | `casa:{stage}:{manzana}:{unit}` |
| `apartamentos` | etapa + torre + número de apartamento [+ piso si aplica regla 2] | `apto:{stage}:{tower}:{unit}` |
| `locales` | etapa / centro comercial / sector + número de local | `local:{stage}:{unit}` |

Reglas de validación antes de calcular la llave:
- `stage` obligatorio en los 4 tipos.
- `manzana` obligatoria para `lotes` y `casas`.
- `tower` obligatoria para `apartamentos` (hoy es opcional en Zod y solo el formulario la exige).
- `lotNumber` obligatorio en todos (ya validado en Zod).
- Si falta un componente obligatorio → error de validación, **nunca** clave degenerada con campos vacíos.

### 2.2 Normalización (algoritmo único, compartido)

1. Convertir a string y `trim`.
2. Quitar tildes (NFD + remover diacríticos).
3. Mayúsculas.
4. Colapsar espacios repetidos y unificar separadores (`-`, `_`, `.`) a un solo espacio.
5. Quitar prefijos por campo:
   - manzana: `MZ`, `MANZANA`, `BLOCK`
   - torre: `TORRE`, `T`, `BLOQUE`, `EDIFICIO`
   - piso: `PISO`, `NIVEL`, `P`
   - unidad: `LOTE`, `LT`, `APTO`, `AP`, `APARTAMENTO`, `CASA`, `LOCAL`, `LC`, `UNIDAD`
6. Componente vacío → cadena vacía (y validación previa según reglas de 2.1).

La misma función se aplica a datos existentes (backfill) y a datos entrantes (crear, editar, importar). La consistencia es lo que hace única la llave; el formato exacto es interno.

### 2.3 Ejemplos

| Tipo | Entrada | `unitKey` | Nomenclatura sugerida |
|---|---|---|---|
| Lote | Etapa 1, Mz A, Lote 5 | `lote:ETAPA 1:A:5` | `Etapa 1 - Mz A - Lote 5` |
| Lote | `etapa 1`, `mz a`, `LOTE 5` | `lote:ETAPA 1:A:5` (misma llave) | idem |
| Casa | Etapa 1, Mz B, Casa 12 | `casa:ETAPA 1:B:12` | `Etapa 1 - Mz B - Casa 12` |
| Apto | Etapa 2, Torre 1, Piso 3, Apto 302 | `apto:ETAPA 2:1:302` | `Etapa 2 - Torre 1 - Piso 3 - Apto 302` |
| Apto (mismo número, otra torre) | Etapa 2, Torre 2, Apto 302 | `apto:ETAPA 2:2:302` (no colisiona) | `Etapa 2 - Torre 2 - Piso 3 - Apto 302` |
| Local | Centro Comercial Plaza, 102-1 | `local:CENTRO COMERCIAL PLAZA:102 1` | `Centro Comercial Plaza - Local 102-1` |

### 2.4 Qué NO es identidad

`nomenclature`, `reference`, `area`, `price`, `status`, `images`, `floor` (por defecto). La `nomenclature` es editable y la `reference` es auxiliar; ninguna puede usarse como llave.

---

## 3. Garantía en base de datos

### 3.1 Campo persistido + hook

- `Lot.unitKey: { type: String, index: true }` (persistido).
- `propertyIdentifier.buildUnitKey(propertyType, { stage, manzana, tower, floor, lotNumber })` en `src/utils/propertyIdentifier.js`.
- Hook `pre('validate')` del modelo: recalcula `unitKey` si es nuevo o si cambiaron campos de identidad.

**Trampa a documentar:** `pre('save')` no corre en `findByIdAndUpdate` (lo que usa hoy `updateLot`) ni en `bulkWrite`. Por eso:
- `updateLot` se refactoriza a cargar el documento, asignar campos y `await lot.save()`.
- El import calcula `unitKey` explícitamente al armar cada `lotData`.

### 3.2 Índice único parcial

```js
lotSchema.index(
  { companyId: 1, unitKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false, unitKey: { $type: 'string' } },
  }
);
```

- Ámbito por proyecto (`companyId`); dos proyectos pueden repetir "Torre 1 Apto 302".
- Parcial para que un archivado no bloquee recrear la unidad.
- `unitKey` ausente queda excluido del índice (no colisiona entre documentos legacy).

### 3.3 Contrato de error de duplicado

HTTP `409`:

```json
{
  "success": false,
  "code": "DUPLICATE_UNIT",
  "message": "Ya existe un inmueble activo con la misma identidad: Etapa 1 - Mz A - Casa 12",
  "data": { "lotId": "...", "nomenclature": "Etapa 1 - Mz A - Casa 12" }
}
```

- `createLot` / `updateLot`: pre-chequeo `findOne` para UX + captura de `E11000` como garantía real.
- `updateLot` excluye su propio `_id` del pre-chequeo.
- `restoreLot`: si el `unitKey` ya tiene un activo, responde `409` con instrucción clara.

### 3.4 Reglas para `bulkWrite` (import)

- `unitKey` viaja en `$set` y en `$setOnInsert`.
- `ordered: false` para que un conflicto no detenga el resto.
- Los `writeErrors` (E11000 por concurrencia) se mapean al reporte por fila.
- Validación de `area > 0` y campos de identidad **antes** de armar las operaciones (`bulkWrite` no corre validadores del schema).

---

## 4. Carga masiva (Excel)

### 4.1 Pipeline propuesto

1. **Cargar contexto:** `Company.propertyType` al inicio. Si el proyecto no es de `lotes`, el import genérico (`/import/excel`) responde `400` con mensaje que redirige a la carga de inventario.
2. **Validar columnas esperadas** por tipo antes de procesar:
   - `lotes`: Etapa, Manzana, Número, Área, Valor
   - `casas`: Etapa, Manzana, Número, Área, Valor
   - `apartamentos`: Etapa, Torre, Piso, Número, Área, Valor
   - `locales`: Etapa / Centro Comercial, Número, Área, Valor
3. **Leer columna `TIPO`** (alias `TIPO PROPIEDAD`, `TIPO DE INMUEBLE`, `TIPO_INMUEBLE`):
   - Si viene y coincide con el proyecto → se usa.
   - Si viene y no coincide → fila rechazada con motivo (modo mixto `allowMixedTypes = false` por defecto).
   - Si no viene → se usa el tipo del proyecto.
4. **Normalizar y calcular `unitKey`** con el mismo helper del modelo.
5. **Duplicados dentro del archivo:** se rechazan las filas repetidas de `unitKey` y se reportan **ambos** números de fila (no hay "last wins").
6. **Resolver contra BD por `unitKey`** (incluyendo archivados):
   - Activo existente → `updateOne`.
   - Archivado existente → se ignora con warning y se reporta (política por defecto).
   - Sin match → `insertOne`.
7. **Validar fila a fila:** área numérica > 0 y componentes obligatorios completos; fila inválida → error con número de fila y motivo. Nunca `lotNumber = 'N/A'` como identidad.
8. **Escribir y reportar** con conteos y arreglos de detalle.

### 4.2 Contrato de respuesta del import

```json
{
  "success": true,
  "summary": {
    "totalRows": 120,
    "created": 100,
    "updated": 15,
    "duplicatesInFile": 2,
    "skippedArchived": 1,
    "skippedInvalid": 2
  },
  "duplicates": [{ "row": 14, "firstRow": 8, "unitKey": "casa:ETAPA 1:B:12" }],
  "archived": [{ "row": 22, "nomenclature": "Etapa 1 - Mz B - Casa 20" }],
  "errors": [{ "row": 30, "message": "El área debe ser mayor a 0" }]
}
```

### 4.3 Idempotencia (criterio de aceptación)

Re-subir el mismo archivo debe dar `created: 0` y `updated: N`, aunque cambie la nomenclatura, la referencia o el orden de las filas.

### 4.4 Plantillas

- Se generan según `Company.propertyType`.
- El endpoint de plantilla deja de ser público: requiere autenticación y contexto de empresa (hoy `GET /import/template-lots` no tiene `companyMiddleware`). El `propertyType` enviado por query se trata como informativo y se valida contra la empresa.

---

## 5. Nomenclatura y referencia (presentación)

| Tipo | Formato canónico propuesto |
|---|---|
| Lotes | `Etapa 1 - Mz A - Lote 5` |
| Casas | `Etapa 1 - Mz B - Casa 12` |
| Apartamentos | `Etapa 2 - Torre 1 - Piso 3 - Apto 302` |
| Locales | `Centro Comercial Plaza - Local 102-1` |

Reglas:
- **Un único generador en backend** (`propertyIdentifier.buildNomenclature`), usado por create, update e import.
- El frontend (`formatPropertyUnit`) deja de construir formatos propios: muestra `nomenclature` y usa el mismo formato solo como fallback si viene vacía.
- Corregir el import actual que genera `"Mz X Lote Y"` para casas y `"Lote Z"` para locales.
- No se reescribe la nomenclatura histórica; convivirán dos estilos hasta que se reimporte/edite. Documentarlo.
- `reference` sigue siendo auxiliar: se genera solo si viene vacía; nunca se usa como identidad.

---

## 6. Cambios por archivo

### Backend (`github-repo-manager-backend`)

| Archivo | Cambio |
|---|---|
| `src/models/Lot.js` | Campo `unitKey` + hook `pre('validate')` + índice único parcial |
| `src/utils/propertyIdentifier.js` | **NUEVO**: normalización, `buildUnitKey`, `buildNomenclature`, `detectPropertyType` |
| `src/controllers/lot.controller.js` | `createLot`/`updateLot` con pre-chequeo y recálculo de `unitKey`; `restoreLot` con validación de conflicto; `updateLot` con `save()` en lugar de `findByIdAndUpdate` |
| `src/validators/lot.validators.js` | Requerir `tower` en apartamentos, `manzana` en lotes/casas, `stage` en todos; validar `propertyType` coherente |
| `src/controllers/import.controller.js` | `importLotsOnly`: tipo desde `Company`, `unitKey`, duplicados internos, política de archivados, validaciones previas, reporte por fila. `downloadLotsOnlyTemplate` derivada de la empresa. `importExcel`: bloqueo controlado para tipos ≠ `lotes` |
| `src/routes/import.routes.js` | Endpoints de plantilla con autenticación y `companyMiddleware` |
| `src/middleware/errorHandler.js` | Mapeo de `E11000` a `409 DUPLICATE_UNIT` si no se captura en controller |
| `src/scripts/migrateLotUnitKeys.js` | **NUEVO**: backfill idempotente de `unitKey` |
| `src/scripts/auditLotDuplicates.js` | **NUEVO**: auditoría y resolución de duplicados históricos |
| `tests/lots.test.js`, `tests/*` | Casos nuevos + fixtures con `area` y `unitKey` |

### Frontend (`cobranza-inmobiliaria-frontend`)

| Archivo | Cambio |
|---|---|
| `src/lib/propertyTypes.ts` | Config compartida de campos por tipo; `formatPropertyUnit` solo fallback; no calcula identidad |
| `src/app/admin/(admin)/lots/page.tsx` | Manejo de `409 DUPLICATE_UNIT`; confirmación de disponibilidad antes de guardar (opcional); usa nomenclatura del backend |
| `src/lib/adminApi.ts` | Endpoint opcional de disponibilidad; contrato de error tipado; plantilla por empresa |
| `src/app/admin/(admin)/import` y modal de carga masiva | Mostrar `duplicates`, `archived` y `errors` por fila; mensajes por tipo |
| `src/components/admin/LotsManagement.tsx` | Eliminar (código muerto, sin imports) |

---

## 7. Migración y despliegue

| Paso | Acción | Criterio de éxito |
|---|---|---|
| 1 | Desplegar helper + `unitKey` + hook + refactor de `updateLot` (sin índice) | Nuevos lotes y ediciones generan `unitKey` |
| 2 | `npm run migrate:lot-keys` (backfill) | 100% de lotes con `unitKey` o marcados como legacy sin identidad |
| 3 | `npm run audit:lot-duplicates` | Reporte de duplicados activos por `{companyId, unitKey}` |
| 4 | Resolver duplicados: sin contratos → archivar con motivo; con contratos → sufijo `#dup{n}` + reporte manual | 0 duplicados activos con la misma llave |
| 5 | Crear índice único parcial (script de mantenimiento) | Índice creado sin errores |
| 6 | Desplegar import + frontend | Reimport idempotente verificado |

Notas:
- Entre el paso 2 y el 5 puede entrar un duplicado nuevo; re-ejecutar backfill/auditoría justo antes de crear el índice o usar ventana de mantenimiento.
- Rollback: eliminar el índice es seguro (no hay pérdida de datos); el campo `unitKey` es aditivo.
- Duplicados sin identidad (sin etapa/manzana/unidad): `unitKey` nulo, excluidos del índice y listados en el reporte para revisión.

---

## 8. Pruebas

### Unitarias del helper

| Caso | Esperado |
|---|---|
| `Mz A` vs `A` vs `mz a` | Misma llave |
| Tildes y espacios dobles | Misma llave |
| `Lote 5` vs `5` vs `LT.5` | Misma llave |
| Mismo número, torre distinta | Llaves distintas |
| Mismo número, etapa distinta | Llaves distintas |
| Componente obligatorio vacío | Error de validación (no llave degenerada) |

### Integración (jest + supertest, suites existentes)

| Escenario | Esperado |
|---|---|
| Crear dos veces el mismo inmueble | `409 DUPLICATE_UNIT` |
| Editar la identidad de A hacia B existente | `409` |
| Editar solo el precio | `unitKey` se conserva |
| Archivar y recrear la misma unidad | Permitido |
| Restaurar archivado con activo de misma llave | `409` |
| Re-subir el mismo Excel | `created: 0`, `updated: N` |
| Excel con dos filas duplicadas | Ambas reportadas, cero escrituras |
| Excel con fila de inmueble archivado | Omitida con warning |
| Excel sin área o con área 0 | Fila rechazada con motivo |
| `importExcel` en proyecto ≠ `lotes` | `400` con mensaje claro |
| Backfill sobre datos con duplicados | Reporte correcto, no inventa llaves |

### Regresión y verificación

- Backend: `npm test` (12 suites actuales) + casos nuevos.
- Frontend: `npm run lint` y `next build`.
- QA manual: los 3 escenarios del plan anterior (retrocompatibilidad de lotes clásicos, dos torres con mismo número, upsert), más UI de error de duplicado.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Duplicados históricos que impiden crear el índice | Auditoría y resolución antes del índice (pasos 3-4) |
| Cambio de regla de negocio (piso/numeración) | Decisión documentada antes de desplegar el índice |
| Inventario mixto invisible en UI | Modo mixto desactivado por defecto; fila con tipo distinto rechazada |
| Hooks no ejecutados en `findByIdAndUpdate`/`bulkWrite` | Refactor de `updateLot` + cálculo explícito en import |
| Concurrencia entre dos imports | Índice único + `ordered: false` + mapeo de `writeErrors` |
| Nomenclatura inconsistente entre pantallas | Generador único en backend; frontend solo muestra |
| Romper contratos/recibos existentes | `unitKey` es aditivo; no se tocan `_id`, contratos ni nomenclatura histórica |

---

## 10. Fuera de alcance (fase 2)

- UI completa para proyectos mixtos (filtros y columnas por tipo).
- Portar `importExcel` (contratos + cuotas) a `unitKey` con torre/piso.
- Auto-numeración secuencial de unidades.
- Renumeración de nomenclaturas históricas.
- Endpoint de disponibilidad en tiempo real (si el 409 resulta suficiente, no se implementa).

---

## 11. Checklist de aceptación

- [ ] `unitKey` persistido, generado en backend y presente en create, update e import.
- [ ] Índice único parcial creado tras auditoría sin errores.
- [ ] `createLot`, `updateLot`, `restoreLot` responden `409 DUPLICATE_UNIT` en conflicto.
- [ ] Reimport del mismo Excel no crea duplicados.
- [ ] Duplicados internos y filas inválidas se reportan con número de fila.
- [ ] Archivados no se resucitan en silencio; se reportan.
- [ ] Nomenclatura generada por un único componente; frontend solo muestra.
- [ ] Import genérico bloqueado para proyectos ≠ `lotes`.
- [ ] Tests backend + lint/build frontend en verde.

---

## Anexo — Evidencia del estado actual (para revisores)

| Hallazgo | Ubicación |
|---|---|
| Sin índices únicos en `Lot` | `src/models/Lot.js` (índices normales) |
| `createLot` no valida duplicados | `src/controllers/lot.controller.js` — `createLot` |
| `updateLot` usa `findByIdAndUpdate` (no dispara hooks de documento) | `src/controllers/lot.controller.js` — `updateLot` |
| `restoreLot` sin validación de conflicto | `src/controllers/lot.controller.js` — `restoreLot` |
| Índice actual de deduplicación en memoria: `stage|manzana|tower|floor|lotNumber` | `src/controllers/import.controller.js` — `importLotsOnly` |
| Import no asigna `propertyType` (los lotes importados quedan `'lotes'`) | `src/controllers/import.controller.js` — `lotData` |
| Nomenclatura del import hardcodea `"Mz X Lote Y"` para casas | `src/controllers/import.controller.js` — `importLotsOnly` |
| El import resucita archivados en silencio (`isDeleted: false`) | `src/controllers/import.controller.js` — `lotData` |
| `importExcel` identifica lotes solo por `reference|nomenclature` | `src/controllers/import.controller.js` — carga de `lotMap` |
| `lotNumber = 'N/A'` cuando falta columna | `src/controllers/import.controller.js` — lectura de fila |
| `bulkWrite` no ejecuta validadores del schema | `src/controllers/import.controller.js` — escritura final |
| Plantilla de inventario en ruta pública | `src/routes/import.routes.js` |
| Tres generadores de nomenclatura distintos | `src/controllers/import.controller.js`, `src/lib/propertyTypes.ts`, `src/app/admin/(admin)/lots/page.tsx` |
