# Plan de Acción — NailAgenda / CrmNailsAgency

**Basado en:** EVALUACION.md (14 de julio de 2026)
**Objetivo:** Llevar el proyecto de estado actual a producción segura y robusta
**Última actualización:** 17 de julio de 2026

---

## Resumen de Fases

| Fase | Nombre | Prioridad | Tiempo Estimado | Estado |
|------|--------|-----------|-----------------|--------|
| 1 | Seguridad Crítica | URGENTE | 2-3 días | ✅ COMPLETADA |
| 2 | Deuda Técnica | ALTA | 3-5 días | ✅ COMPLETADA |
| 3 | Rendimiento & Robustez | MEDIA | 4-6 días | ⬜ Pendiente |
| 4 | Funcionalidad Futura | BAJA | Según necesidad | ⬜ Pendiente |

---

## Fase 1: Seguridad Crítica (URGENTE — Antes de Producción) ✅ COMPLETADA

Esta fase es **obligatoria** antes de que la aplicación sea usada por usuarios reales.

### Tarea 1.1 — Proteger AUTH_SECRET ✅
- [x] **Archivo:** `src/lib/auth.ts`
- [x] Eliminar fallback hardcodeado `'mayenailsart-default-secret-change-in-production-2024'`
- [x] Hacer que la app falle al iniciar si `AUTH_SECRET` no está configurada
- [x] Agregar validación en script de startup
- [x] Documentar en README que AUTH_SECRET es obligatorio
- [x] **Commit:** `74d202c`

### Tarea 1.2 — Eliminar Token Demo Hardcodeado ✅
- [x] **Archivos:** `src/lib/auth.ts`, `src/lib/fallbacks.ts`, `prisma/schema.prisma`
- [x] Remover bypass `'demo-token-123'` de `verifyToken()`
- [x] Remover el flag `isDemoUser` de `requireAuth()`
- [x] Reimplementar modo demo como flag en base de datos (`isDemo: Boolean` en User)
- [x] Refactorizar loginDemo en frontend para usar login normal con env vars
- [x] Seed endpoint y demo user con contraseña aleatoria generada
- [x] **Commits:** `a348746`, `21c9827`, `3b768bf`, `dbe0875`, `b10ec9d`

### Tarea 1.3 — Migrar Token a httpOnly Cookies ✅
- [x] **Archivos:** `src/lib/auth.ts`, `src/lib/api.ts`, `src/stores/auth.ts`
- [x] En login/register, setear cookie `httpOnly`, `secure`, `sameSite=lax` con el JWT
- [x] Modificar `requireAuth()` para leer token de cookie primero, con fallback a header Authorization
- [x] Actualizar `stores/auth.ts` para no guardar token en localStorage
- [x] Actualizar `api.ts` con `credentials: 'include'` en todos los fetch
- [x] Logout limpia cookie (Max-Age=0)
- [x] **Cookie config:** `name: 'nailagenda-token'`, `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `path: '/'`, `maxAge: 604800` (7 días)
- [x] Verificado en producción: login setea cookie, GET /api/auth lee de cookie, logout la limpia
- [x] **Commit:** `fd6c3ae`

### Tarea 1.4 — Implementar Rate Limiting ✅
- [x] **Archivo:** `src/lib/rate-limit.ts`
- [x] Implementado in-memory rate limiter (sin dependencia de Redis)
- [x] Configurado: máximo 5 intentos de login fallidos por IP cada 15 minutos
- [x] Configurado: máximo 3 registros por IP cada hora
- [x] Verificado en producción: 5 login fallidos → HTTP 429 por 15 minutos
- [x] **Commit:** `433fc985`

### Tarea 1.5 — Fortalecer Política de Contraseñas ✅
- [x] **Archivo:** `src/lib/validations.ts`
- [x] Mínimo 8 caracteres (antes 6)
- [x] Al menos 1 minúscula + 1 mayúscula + 1 número + 1 carácter especial
- [x] Validación aplicada en schema de Zod para registro
- [x] **Commit:** `999b51b`

### Tarea 1.6 — Centralizar Autenticación en Middleware ✅
- [x] **Archivo:** `src/middleware.ts`
- [x] Security headers globales: CSP, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- [x] Verificación de auth en todas las rutas `/api/*`
- [x] Excluye rutas públicas: `/api/auth`, `/api/ping`, `/api/sanity-check`, `/api/seed`, `/api/test-db`, `/api/download`
- [x] Lee token de httpOnly cookie con fallback a Bearer header
- [x] `extractToken()` exportado para reuso en middleware y route handlers
- [x] Verificado en producción: `/api/clients` sin token → 401, con token → 200 + headers
- [x] **Commit:** `a6076a6`

### Tarea 1.7 — Eliminar Contraseñas del Código Fuente ✅
- [x] **Archivo:** `datos/demo.ts`
- [x] `DEMO_PASSWORD` ahora requerido como variable de entorno (el script falla si no está presente)
- [x] `DEMO_EMAIL` leído de env var con fallback `'demo@mayenailsart.com'`
- [x] Eliminado `'password123'` hardcodeado (3 ocurrencias en comentarios, código y output)
- [x] Eliminado email hardcodeado (2 ocurrencias)
- [x] Console output no muestra contraseña en texto plano
- [x] **Commit:** `999b51b`

### Commits de la Fase 1 (en orden cronológico)

| Commit | Tarea | Descripción |
|--------|-------|-------------|
| `74d202c` | 1.1 | Proteger AUTH_SECRET — validar al inicio, sin fallback |
| `a348746` | 1.2 | Eliminar token demo hardcodeado + isDemo en User model |
| `21c9827` | 1.2 | Fixes: error 500 demo, variables de entorno cohesión |
| `3b768bf` | 1.2 | Fix: isDemo en select de requireAuth() |
| `dbe0875` | — | Redeploy trigger (commit vacío) |
| `b10ec9d` | — | Redeploy trigger (commit vacío) |
| `fd6c3ae` | 1.3 | Migrar token JWT a httpOnly cookies |
| `433fc985` | 1.4 | Rate limiting en auth endpoints |
| `a6076a6` | 1.6 | Middleware de seguridad centralizado |
| `999b51b` | 1.5 + 1.7 | Política de contraseñas + eliminar hardcodeadas |

---

## Fase 2: Deuda Técnica (Prioridad ALTA)

Una vez la seguridad esté resuelta, limpiar la deuda técnica.

### Tarea 2.1 — Unificar Esquemas Prisma
- [x] Comparar `schema.prisma` y `schema.production.prisma`
- [x] Consolidar en un solo `schema.prisma`
- [x] BD de producción ya tiene todos los campos (isActive, isDemo, subscriptionExpiresAt)
- [x] Eliminar `schema.production.prisma` (obsoleto, causaba confusión)
- [x] **Impacto:** Un solo source of truth para el esquema

### Tarea 2.2 — Migrar Fechas a Tipos Nativos ❌ DESCARTADA
- [x] **Decisión:** No se hacen cálculos con fechas, el formato string es funcional
- [x] Si en el futuro se necesitan filtros nativos de BD, se abordará como tarea independiente

### Tarea 2.3 — Migrar `config` a JSON Nativo ✅
|- [x] **Archivo:** `schema.prisma` (modelo AutomationRule)
|- [x] `config String` → `config Json` (jsonb nativo en PostgreSQL)
|- [x] Prisma serializa automáticamente — eliminados `JSON.stringify/parse` en 8 archivos
|- [x] Validación con Zod (`automationConfigSchema`)
|- [x] Migración de BD: `ALTER TABLE "AutomationRule" ALTER COLUMN config TYPE JSONB USING config::jsonb`
|- [x] **Commit:** `f6849e9`
|- [x] **Impacto:** Type safety, queries nativas, sin serialización manual

### Tarea 2.4 — Eliminar Dependencias Muertas ✅
- [x] Investigar `z-ai-web-dev-sdk` → **sin imports** en todo el código
- [x] `next-auth` → el proyecto usa JWT manual con `jose`, **0 imports**
- [x] `next-intl` → **0 imports**, nunca se configuró
- [x] Eliminadas las 3: `npm uninstall z-ai-web-dev-sdk next-auth next-intl`
- [x] Verificado: build exitoso en Vercel, app responde OK
- [x] **Commit:** `4018d00`
- [x] **Impacto:** Reduce superficie de ataque, instalación más rápida

### Tarea 2.5 — Tipar el API Client ✅
|- [x] **Archivo:** `src/lib/api.ts`
|- [x] Creado `src/types/api.ts` con interfaces de respuesta para cada endpoint
|- [x] Todos los métodos públicos tipados con interfaces exportadas
|- [x] `request<T>` retorna `Promise<any>` internamente para no romper componentes legacy
|- [x] Fix de errores: `CreateClientInput.status` opcional, `CreateAppointmentInput.notes` nullable
|- [x] Fix store de auth: usar métodos tipados en lugar de `api.post()` genérico
|- [x] **Commit:** `3d095a4`
|- [x] **Impacto:** Type safety completa, adopción gradual

### Tarea 2.6 — Eliminar SQLite del Repositorio ✅
|- [x] Agregado `db/*.db` y `db/*.sqlite` a `.gitignore`
|- [x] Removido `db/custom.db` del repositorio con `git rm --cached`
|- [x] **Commit:** `d611c16`
|- [x] **Impacto:** Evita leaks de datos de prueba, repositorio más limpio

### Tarea 2.7 — Auditoría del Sistema de Fallbacks ✅
|- [x] Agregada función `shouldUseFallbacks()` en `src/lib/fallbacks.ts`
|- [x] En producción devuelve 503 si la BD falla (no datos ficticios)
|- [x] En desarrollo los fallbacks siguen activos por defecto
|- [x] Control vía env var `USE_FALLBACKS=true/false`
|- [x] 5 routes actualizados: clients, appointments, services, automations, dashboard
|- [x] **Commit:** `869347b`
|- [x] **Impacto:** Usuarios reales nunca ven datos falsos

### Tarea 2.8 — Optimizar Rendimiento de Queries ✅
- [x] **Archivos:** `src/app/api/dashboard/route.ts`, `src/app/api/clients/route.ts`
- [x] **Dashboard:** 7 queries secuenciales → 1 `Promise.all` (ejecución paralela)
- [x] **Dashboard:** Agregar `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`
- [x] **GET /api/clients:** Reemplazar `include: { appointments: { include: { service: true } } }` por `_count` agregado + `take: 1` para última cita
- [x] Verificado: `_count({ where: { status: 'COMPLETED' } })` calculado por PostgreSQL en lugar de cargar todas las citas y filtrar en JS
- [x] **Commit:** `5495be4`
- [x] **Impacto:** ~7x menos round-trips en dashboard, O(1) en lugar de O(n) en lista de clientes

---

## Fase 3: Rendimiento & Robustez (Prioridad MEDIA)

### Tarea 3.1 — Agregar Tests
- [ ] Configurar framework: Vitest para unitarios, Playwright para e2e
- [ ] Tests unitarios: `auth.ts` (hash, verify, createToken, verifyToken)
- [ ] Tests unitarios: `validations.ts` (todos los schemas de Zod)
- [ ] Tests de API: endpoints críticos (auth, clients, appointments)
- [ ] Tests e2e: flujo de registro → login → crear cliente → crear cita
- [ ] Configurar CI para correr tests en cada PR
- [ ] **Impacto:** Previene regresiones, documenta comportamiento esperado

### Tarea 3.2 — Mejorar Manejo de Errores
- [ ] Crear `src/lib/errors.ts` con jerarquía de errores (AppError, NotFoundError, etc.)
- [ ] Estandarizar formato de respuesta de error: `{ error: { code, message, details? } }`
- [ ] Agregar logging estructurado (pino o similar)
- [ ] Considerar integración con Sentry para monitoreo
- [ ] **Impacto:** Debugging más fácil, mejor experiencia para el usuario

### Tarea 3.3 — Arreglar Docker Healthcheck
- [ ] Crear endpoint `GET /api/health` público (sin auth)
- [ ] Que verifique conexión a BD con `db.$queryRaw` SELECT 1
- [ ] Actualizar docker-compose.yml para usar este endpoint
- [ ] **Impacto:** Monitoreo correcto del estado del contenedor

### Tarea 3.4 — Validación de Variables de Entorno al Inicio
- [ ] Crear script `scripts/validate-env.ts`
- [ ] Validar que las variables requeridas estén configuradas: `DATABASE_URL`, `AUTH_SECRET`
- [ ] Validar formato de `DATABASE_URL`
- [ ] Agregar al script `prestart` o al entrypoint de Docker
- [ ] **Impacto:** La app falla rápido con mensaje claro si falta configuración

### Tarea 3.5 — Agregar CSRF Protection ✅
||- [x] Crear `src/lib/csrf.ts` con `validateCSRF()`
||- [x] Valida header `Origin` (o `Referer` como fallback) en todo request mutante a `/api/*`
||- [x] `/api/auth` exento (login/register cross-origin)
||- [x] Rechaza con 403 si Origin no coincide o falta en request mutante
||- [x] Integrado en middleware existente (antes del auth check)
||- [x] **Commit:** `a6040d2`
||- [x] **Protección:** Previene ataques CSRF en operaciones de escritura

### Tarea 3.6 — Lazy Loading de Vistas (next/dynamic) 🚀 ✅
||- [x] Migrar imports de vistas en `page.tsx` a `next/dynamic`
||- [x] `AppShell`, `OnboardingTour` y `SubscriptionExpiredView` con `dynamic()`
||- [x] Extraer `hasCompletedOnboarding` de `onboarding-tour.tsx` → `src/lib/onboarding.ts` (861→6 líneas en bundle inicial)
||- [x] Fallbacks con skeleton/spinner en cada vista
||- [x] `LandingPage` y `AuthDialog` se mantienen eager (ruta pública)
||- [x] **Commit:** `3d5eefb`
||- [x] **Impacto:** Bundle inicial ~10-15% más pequeño al eliminar dependencia de onboarding-tour del chunk principal

### Tarea 3.7 — Cache de Datos con SWR/React Query 🚀 ✅
||- [x] Instalar y configurar `swr` ^2.x
||- [x] Crear hooks centralizados: `useDashboard`, `useClients`, `useClient`, `useServices`, `useAppointments`, `useAutomations`
||- [x] Refactorizar `DashboardView` — eliminar `useState+useEffect+fetch` manual, usar `useDashboard()` con SWR
||- [x] Refactorizar `ClientList` — eliminar doble fetch, usar `useClients()` con y sin filtros
||- [x] Configurar `dedupingInterval: 5s`, `keepPreviousData: true`, `revalidateOnFocus: false`
||- [x] `mutate()` en reintento de error, `invalidate()` tras crear cliente y DnD
||- [x] **Commit:** `ae9ecb1`
||- [x] **Impacto:** Navegación instantánea entre vistas, datos cacheados, menos requests

### Tarea 3.8 — Server Components para Layout y Auth ✅
||- [x] Crear `getServerUser()` — lee cookie httpOnly, verifica JWT, retorna user desde DB
||- [x] Crear `AuthProvider` (Client Component) — hidrata store Zustand con user del servidor
||- [x] Convertir `layout.tsx` a Server Component async que llama `getServerUser()` y provee `<AuthProvider>`
||- [x] Simplificar `page.tsx` — elimina `InitialLoader` y dependencia de `initialized`
||- [x] Usuarios autenticados: AppShell inmediato sin loading spinner
||- [x] Usuarios no autenticados: LandingPage inmediato sin loading spinner
||- [x] `init()` mantenido como safety net (Authorization header edge case)
||- [x] **Commit:** `dda5cd4`
||- [x] **Impacto:** Usuario autenticado ve la app en el primer paint, menos JS en cliente

---

## Fase 4: Funcionalidad Futura (BAJA — Según Necesidad)

### Tarea 4.1 — Internacionalización
- [ ] Configurar `next-intl` para español e inglés
- [ ] Extraer todos los strings a archivos de mensajes
- [ ] Agregar selector de idioma en configuración
- [ ] **Impacto:** Alcance a mercado internacional

### Tarea 4.2 — Exportación de Datos
- [ ] Exportar clientes a CSV/Excel
- [ ] Exportar citas filtradas por fecha
- [ ] Exportar dashboard como PDF
- [ ] Backup automático programado
- [ ] **Impacto:** Portabilidad de datos, cumplimiento de GDPR

### Tarea 4.3 — Integraciones Externas
- [ ] WhatsApp Business API para mensajes automáticos
- [ ] Google Calendar sync bidireccional
- [ ] Pasarela de pago para suscripciones (Stripe/MercadoPago)
- [ ] **Impacto:** Valor real para negocio, monetización

### Tarea 4.4 — Personalización del Salón
- [ ] Logo personalizable por usuario
- [ ] Colores de tema personalizables (CSS variables)
- [ ] Configuración de horario laboral
- [ ] Gestión de múltiples estilistas con disponibilidad
- [ ] **Impacto:** Adaptable a cualquier salón de belleza

---

## Orden de Ejecución Recomendado

```
Semana 1:        ✅ Fase 1 completa (Seguridad)
Semana 2-3:      ✅ Fase 2 completa (Deuda Técnica)
Semana 4-5:      Fase 3 — Rendimiento (lazy loading, cache, server components)
Semana 5-6:      Tests + manejo de errores
Semana 7+:       Funcionalidad futura según prioridad del negocio
```

---

## Métricas de Éxito

| Indicador | Estado Anterior | Estado Actual | Meta |
|-----------|-----------------|---------------|------|
| Fallos de seguridad críticos | 7 | 0 ✅ | 0 |
| Cobertura de tests | 0% | 0% | 60%+ |
| Dependencias sin usar | 3+ | 0 ✅ | 0 |
| Esquemas de BD divergentes | 2 | 1 ✅ | 1 |
| Type safety en API client | No | ✅ Sí | Sí |
| Token en httpOnly cookie | No | ✅ Sí | Sí |
| Rate limiting | No | ✅ Sí | Sí |
| Security headers (CSP, XFO, etc.) | No | ✅ Sí | Sí |
| Fallbacks controlados por entorno | No | ✅ Sí | Sí |
| Config en JSON nativo (BD) | No | ✅ Sí | Sí |
| Healthcheck funcional | No | No | Sí |

---

## Riesgos del Plan

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Migración de fechas rompe datos existentes | Media | Hacer backup, probar en staging |
| Migrar a httpOnly cookies rompe el frontend | Baja | ✅ Resuelto: dual delivery (cookie + body), backward compat verificado |
| NextAuth v5 tiene breaking changes | Media | Evaluar antes de migrar; mantener JWT manual si es más costo-efectivo |
| Redis no disponible para rate limiting | Media | ✅ Resuelto: rate limiter in-memory implementado |
