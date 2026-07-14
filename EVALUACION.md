# Informe de Evaluación — NailAgenda / CrmNailsAgency

**Fecha:** 14 de julio de 2026
**Repositorio:** https://github.com/frank1411/nailagenda
**Stack:** Next.js 16 + TypeScript + Prisma + shadcn/ui + TailwindCSS 4
**Propósito:** Aplicación CRM para gestión de salones de belleza (uñas) — clientes, citas, servicios, automatizaciones

---

## 1. Resumen Ejecutivo

El proyecto es un CRM para salones de manicura/uñas bien estructurado, con una arquitectura moderna y funcionalidades sólidas para su etapa actual. Usa tecnologías modernas (Next.js 16, React 19, TailwindCSS 4, shadcn/ui, Zustand) y tiene una interfaz de usuario pulida con componentes de UI profesionales.

Sin embargo, presenta múltiples problemas de **seguridad crítica**, **deuda técnica en la capa de autenticación**, **gestión de base de datos**, y **protección de datos** que deben resolverse **antes** de usar la aplicación en producción con usuarios reales.

---

## 2. Análisis de Estructura

### 2.1 Stack Tecnológico

| Capa | Tecnología | Versión | Estado |
|------|-----------|---------|--------|
| Framework | Next.js | ^16.1.1 | Moderno |
| UI | React | ^19.2.6 | Moderno |
| Estilos | TailwindCSS | ^4 | Moderno |
| Componentes | shadcn/ui + Radix | Varios | Completo (45+ componentes) |
| Estado | Zustand | ^5.0.6 | Adecuado |
| Validación | Zod | ^4.0.2 | Bien usado |
| ORM | Prisma | ^6.11.1 | Bien configurado |
| Auth | JWT (jose) + bcryptjs | ^6.2.3 / ^3.0.3 | Implementación manual |
| BD | PostgreSQL (producción) / SQLite (dev) | Prisma | Soportado |
| i18n | next-intl | ^4.3.4 | Instalado, no usado en código |
| Animaciones | framer-motion | ^12.23.2 | Uso en componentes UI |

### 2.2 Dependencias Notables

**A favor:**
- shadcn/ui + Radix UI completo (45+ componentes): dropdowns, diálogos, tabs, calendarios, etc.
- `@dnd-kit` para drag-and-drop
- `recharts` para gráficos del dashboard
- `react-hook-form` para formularios
- `pptxgenjs` para exportar a PowerPoint
- `react-markdown` + `react-syntax-highlighter`
- `@tanstack/react-query` y `@tanstack/react-table`

**Preocupaciones:**
- `next-auth` ^4.24.11 está instalado pero **NO se usa** — el proyecto tiene autenticación JWT manual. Debería eliminarse o migrarse.
- `z-ai-web-dev-sdk` ^0.0.17 — dependencia desconocida, sin documentación. ¿Qué hace? ¿Es segura?

---

## 3. Hallazgos por Área

### 3.1 SEGURIDAD — CRÍTICO 🔴

#### 3.1.1 Token JWT Hardcodeado en Código Fuente
**Severidad: CRÍTICA**
**Archivo:** `src/lib/auth.ts` (línea 18)
```typescript
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'mayenailsart-default-secret-change-in-production-2024';
```
La clave secreta por defecto está hardcodeada en el código. Si AUTH_SECRET no se configura, **cualquiera puede generar tokens JWT válidos** y acceder como cualquier usuario.

#### 3.1.2 Token de Demo Hardcodeado
**Severidad: ALTA**
**Archivo:** `src/lib/auth.ts` (línea 34)
```typescript
if (token === 'demo-token-123') {
  return { userId: 'cmprffoo10000jrm79fshecm0' };
}
```
El token de demo `'demo-token-123'` es un bypass de autenticación. Cualquiera que lo conozca puede acceder como usuario demo sin restricciones. El ID de usuario demo también está hardcodeado en `src/lib/fallbacks.ts`.

#### 3.1.3 Contraseñas en Código Fuente
**Severidad: ALTA**
**Archivo:** `datos/demo.ts`
```typescript
const hashedPassword = await bcrypt.hash('password123', BCRYPT_ROUNDS);
```
La contraseña demo `password123` está en texto plano en el código de seed. Si bien se hashea antes de guardar, está expuesta en el repositorio.

#### 3.1.4 API Keys en `.env.example`
**Severidad: MEDIA**
**Archivo:** `.env.example`
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
Patrón correcto en `.env.example`, pero `ANTHROPIC_BASE_URL` apunta a OpenRouter y las variables son de Anthropic — naming confuso.

#### 3.1.5 Middleware Vacío
**Severidad: BAJA**
**Archivo:** `src/middleware.ts`
```typescript
export function middleware(request: NextRequest) {
  return NextResponse.next(); // No hace nada
}
```
El middleware está configurado para interceptar `/api/:path*` pero no aplica ninguna verificación. La autenticación se hace manualmente en cada ruta con `requireAuth()`.

#### 3.1.6 No Hay Protección CSRF
Las API routes no implementan tokens CSRF ni validación de origen para mutaciones.

#### 3.1.7 No Hay Rate Limiting
No hay límites de velocidad en endpoints de login/register — vulnerables a fuerza bruta.

#### 3.1.8 Password sin Política de Complejidad
La validación de contraseña solo requiere mínimo 6 caracteres (`z.string().min(6)`). No exige mayúsculas, números, ni caracteres especiales.

---

### 3.2 BASE DE DATOS Y ESQUEMA — ALTO 🟠

#### 3.2.1 Dos Esquemas Diferentes
**Severidad: ALTA**
- `prisma/schema.prisma` — schema principal con campos `isActive`, `subscriptionExpiresAt` en User
- `prisma/schema.production.prisma` — sin esos campos

Esto genera inconsistencia. La diferencia entre schemas debería manejarse con migraciones, no con archivos duplicados.

#### 3.2.2 BD SQLite Pre-cargada en el Repo
**Severidad: MEDIA**
**Archivo:** `db/custom.db` (131 KB)
Una base de datos SQLite está commiteada. Puede contener datos de usuarios/pruebas. No debería estar en el repositorio.

#### 3.2.3 Fechas como Strings en Appointment
**Severidad: BAJA**
```prisma
date        String   // YYYY-MM-DD format
startTime   String   // HH:mm format
endTime     String   // HH:mm format
```
Las fechas y horas se almacenan como strings en lugar de tipos nativos `DateTime`. Esto impide usar funciones de BD para filtros por rango y complica el manejo de zonas horarias.

#### 3.2.4 Configuración como JSON String
```prisma
config      String   // JSON string with rule configuration
```
El campo `config` en `AutomationRule` guarda JSON como string. Prisma soporta `Json` nativo que sería más adecuado.

#### 3.2.5 Sin Índices en Búsquedas de Texto
Las búsquedas de clientes usan `contains` que no aprovecha índices PostgreSQL. Para producción con muchos clientes, se necesitaría un índice GIN o trigram.

#### 3.2.6 Sin Foreign Key entre automation_log.ruleId
La relación `AutomationLog.ruleId` → `AutomationRule` usa `onDelete: SetNull` en lugar de `Cascade`, lo cual es inconsistente con el resto del esquema.

---

### 3.3 AUTENTICACIÓN — ALTO 🟠

#### 3.3.1 Implementación JWT Manual vs NextAuth
NextAuth está instalado (`next-auth: ^4.24.11`) pero nunca se usa. La autenticación JWT se implementa manualmente con `jose`. Esto es propenso a errores y no tiene refresh tokens, revocación de tokens, ni protección contra token replay.

#### 3.3.2 No Hay Refresh Tokens
Los JWTs expiran en 7 días. No hay mecanismo de refresh. El usuario debe volver a iniciar sesión cada semana.

#### 3.3.3 El Token se Guarda en localStorage
```typescript
localStorage.setItem('glam-token', data.token);
```
Esto es vulnerable a XSS. Cualquier script malicioso puede leer el token. Debería usar httpOnly cookies.

#### 3.3.4 Verificación de Suscripción en el Frontend
```typescript
// page.tsx - línea 325-330
if (user.role !== 'ADMIN' && user.email !== 'demo@mayenailsart.com' && user.subscriptionExpiresAt) {
  const expirationDate = new Date(user.subscriptionExpiresAt);
  if (new Date() > expirationDate) {
    return <SubscriptionExpiredView />;
  }
}
```
La verificación de suscripción del frontend puede ser bypasseada. La verificación real está en `requireAuth()` en el backend (que sí es correcta), pero la comprobación del frontend tiene condiciones inconsistentes (`subscriptionExpiresAt` vacío se trata como acceso permitido, mientras en el backend se trata como expirado).

#### 3.3.5 Demo User con Privilegios Especiales
El usuario demo (`demo@mayenailsart.com`) tiene bypasses especiales en múltiples lugares:
- `auth.ts`: `verifyToken()` acepta `'demo-token-123'` mágicamente
- `auth.ts`: `requireAuth()` salta verificación de suscripción para demo
- `auth.ts`: `GET /api/auth` devuelve datos hardcodeados para el demo user
- `stores/auth.ts`: `loginDemo()` crea una sesión sin llamar al backend
- `page.tsx`: Verificación de expiración salta el demo user

---

### 3.4 FALLBACKS / DATOS DUMMY — MEDIO 🟡

#### 3.4.1 Sistema de Fallbacks en Producción
Cada API route tiene un bloque `try/catch` que, si la BD falla, devuelve datos dummy de `FALLBACKS`. Esto es útil para desarrollo/demo, pero **peligroso en producción**: podría ocultar fallos reales de BD y mostrar datos ficticios como si fueran reales.

#### 3.4.2 Datos Hardcodeados en Fallbacks
`src/lib/fallbacks.ts` contiene 252 líneas de datos hardcodeados: clientes, servicios, citas, dashboard stats, etc. Si alguien usa el sistema en producción con BD caída, verá datos de Ana García y Lucía Martínez en lugar de sus clientes reales.

---

### 3.5 CÓDIGO Y ARQUITECTURA — MEDIO 🟡

#### 3.5.1 Falta de Tipos Compartidos
No hay un directorio `types/` ni interfaces compartidas para API responses. Cada componente y ruta define sus propios tipos o usa `any`.

#### 3.5.2 `any` en el Cliente API
```typescript
async get(path: string): Promise<any> { ... }
async post(path: string, body: any): Promise<any> { ... }
```
Todos los métodos del API client retornan `any`. Esto anula la verificación de tipos de TypeScript.

#### 3.5.3 i18n Instalado Pero No Usado
`next-intl` está en las dependencias pero no hay directorio `messages/`, no hay configuración de i18n en `next.config.ts`, y todos los textos están en español hardcodeado.

#### 3.5.4 Dependencia `z-ai-web-dev-sdk`
Paquete `z-ai-web-dev-sdk` versión `^0.0.17` sin documentación. No se encuentra referencia en el código fuente. Parece no usarse — debería eliminarse.

#### 3.5.5 Caddyfile con Configuración de Transformación de Puerto
```caddyfile
@transform_port_query {
    query XTransformPort=*
}
```
Esto expone un mecanismo para rutear a diferentes puertos vía query param. Podría usarse para SSRF si no se valida correctamente.

#### 3.5.6 Sin Tests
No hay archivos de test (ni unitarios, ni de integración, ni e2e). Cero cobertura.

#### 3.5.7 Sin Manejo de Errores Granular en Varios Endpoints
El catch genérico `Internal server error` enmascara el error real. Para debugging es necesario usar `console.error`, pero en producción estos logs se pierden sin un sistema de monitoreo.

---

### 3.6 DOCKER / INFRAESTRUCTURA — BAJO 🟢

#### 3.6.1 Dockerfile con Buenas Prácticas
- Multi-stage build ✓
- Non-root user ✓
- `.dockerignore` — no encontrado (posiblemente ausente)
- `NEXT_TELEMETRY_DISABLED=1` ✓

#### 3.6.2 docker-compose.yml con PostgreSQL Comentado
La configuración para Postgres está comentada, usando solo SQLite local. Para producción se necesita descomentar y configurar.

#### 3.6.3 Sin Healthcheck Real en Docker
El healthcheck usa `wget` contra `/api/auth` que requiere token. Siempre fallará con 401, lo cual podría interpretarse incorrectamente.

#### 3.6.4 Variables de Entorno Sin Validar en Entrypoint
No hay validación de que `AUTH_SECRET` esté configurado antes de iniciar en producción.

---

### 3.7 COMPONENTES Y UI — BAJO 🟢

La UI está profesionalmente construida con:
- Sidebar responsivo (colapsable desktop, sheet en mobile)
- Dashboard con métricas (clientes por estado, revenue semanal, actividad reciente)
- Vista de calendario
- Gestión de clientes con búsqueda y filtros
- Perfil de cliente con historial, notas, preferencias
- Gestión de servicios
- Panel de automatizaciones
- Onboarding tour para nuevos usuarios
- Vista de suscripción expirada
- Landing page pública
- Exportación a PowerPoint (weekly-calendar-export)

No se encontraron problemas mayores en la UI — está bien construida.

---

## 4. Resumen de Riesgos

| # | Hallazgo | Severidad | Impacto |
|---|----------|-----------|---------|
| 1 | Secreto JWT hardcodeado en auth.ts | CRÍTICA | Cualquiera puede firmar tokens válidos |
| 2 | Token demo hardcodeado como bypass | ALTA | Acceso sin autenticación al sistema |
| 3 | Contraseña demo en código fuente | ALTA | Exposición de credenciales en repositorio |
| 4 | Middleware de autenticación vacío | ALTA | No hay verificación centralizada de auth |
| 5 | Token JWT en localStorage | ALTA | Vulnerable a XSS |
| 6 | Sin rate limiting | ALTA | Fuerza bruta en login/register |
| 7 | Dos esquemas Prisma divergentes | ALTA | Inconsistencia en BD |
| 8 | SQLite commiteada en repo | MEDIA | Posible fuga de datos de prueba |
| 9 | Sistema de fallbacks en producción | MEDIA | Muestra datos falsos cuando BD falla |
| 10 | next-auth instalado sin usar | MEDIA | Dependencia innecesaria |
| 11 | z-ai-web-dev-sdk desconocido | MEDIA | Riesgo de supply chain |
| 12 | Sin tests | MEDIA | Sin cobertura de regresión |
| 13 | Fechas/horas como strings | BAJA | Limita consultas de BD |
| 14 | config como JSON string en BD | BAJA | Debería usar tipo Json nativo |
| 15 | `any` en API client | BAJA | Pérdida de type safety |
| 16 | i18n instalado sin configurar | BAJA | Dependencia muerta |
| 17 | Healthcheck de Docker siempre falla | BAJA | Monitoreo incorrecto |

---

## 5. Recomendaciones Priorizadas

### Fase 1: Seguridad Crítica (Antes de Producción)

1. **Mover AUTH_SECRET a variable de entorno obligatoria**
   - Eliminar el fallback hardcodeado
   - Validar en startup que esté configurada

2. **Eliminar bypass de token demo hardcodeado**
   - Remover `'demo-token-123'` de `verifyToken()`
   - Si se necesita modo demo, implementarlo como feature flag en BD

3. **Migrar a httpOnly cookies para el token JWT**
   - Dejar de usar localStorage para el token
   - Configurar cookie con flags `httpOnly`, `secure`, `sameSite`

4. **Implementar rate limiting**
   - Rate limit en `/api/auth` (login/register)
   - Usar `@upstash/ratelimit` o similar con Redis

5. **Implementar autenticación centralizada en middleware**
   - Verificar JWT en `middleware.ts` para todas las rutas `/api/`
   - Eliminar `requireAuth()` de cada ruta individual
   - Excluir rutas públicas: `/api/auth` (solo POST), `/api/ping`

### Fase 2: Deuda Técnica (Siguiente Sprint)

6. **Unificar esquemas Prisma**
   - Consolidar `schema.prisma` y `schema.production.prisma`
   - Usar migraciones en lugar de archivos duplicados

7. **Migrar campos `date`/`startTime`/`endTime` a DateTime**
   - Cambiar de String a DateTime en Appointment
   - Agregar migración para convertir datos existentes

8. **Migrar `config` a tipo Json nativo**
   - Cambiar de `String` a `Json` en AutomationRule
   - Tipar la configuración con Zod

9. **Eliminar o configurar next-intl**
   - Si se va a usar, configurar mensajes y detección de idioma
   - Si no, eliminarlo de dependencias

10. **Investigar y eliminar `z-ai-web-dev-sdk`**
    - Verificar si se usa en algún lugar
    - Si no, eliminarlo de `package.json`

11. **Tipar el API client**
    - Reemplazar `any` con genéricos y tipos de respuesta
    - Crear archivo `src/types/api.ts` con interfaces de API responses

### Fase 3: Robustez (Mediano Plazo)

12. **Agregar tests**
    - Tests unitarios para funciones de auth
    - Tests de API routes con MSW o similar
    - Tests e2e con Playwright para flujos críticos

13. **Mejorar manejo de errores**
    - Respuestas de error estandarizadas
    - Sistema de logging estructurado
    - Sentry o similar para monitoreo

14. **Auditar y ajustar sistema de fallbacks**
    - Deshabilitar fallbacks en producción
    - Usar solo en desarrollo con flag `USE_FALLBACKS`

15. **Mejorar Docker healthcheck**
    - Crear endpoint dedicado `/api/health`
    - Que verifique conexión a BD

16. **Eliminar `next-auth`** si no se va a usar, o migrar a NextAuth v5 (Auth.js)

### Fase 4: Funcionalidad Futura

17. **Internacionalización real**
    - Extraer todos los strings a archivos de mensajes
    - Agregar selector de idioma

18. **Temas y personalización**
    - Permitir al usuario personalizar colores, logo, nombre del salón
    - Usar CSS variables para theming

19. **Exportación de datos**
    - Exportar clientes/citas a CSV/Excel
    - Programar backups automáticos

20. **Integraciones reales**
    - WhatsApp Business API para automatizaciones
    - Google Calendar sync bidireccional
