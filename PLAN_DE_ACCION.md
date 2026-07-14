# Plan de Acción — NailAgenda / CrmNailsAgency

**Basado en:** EVALUACION.md (14 de julio de 2026)
**Objetivo:** Llevar el proyecto de estado actual a producción segura y robusta

---

## Resumen de Fases

| Fase | Nombre | Prioridad | Tiempo Estimado | Estado |
|------|--------|-----------|-----------------|--------|
| 1 | Seguridad Crítica | URGENTE | 2-3 días | ⬜ Pendiente |
| 2 | Deuda Técnica | ALTA | 3-5 días | ⬜ Pendiente |
| 3 | Robustez | MEDIA | 3-5 días | ⬜ Pendiente |
| 4 | Funcionalidad Futura | BAJA | Según necesidad | ⬜ Pendiente |

---

## Fase 1: Seguridad Crítica (URGENTE — Antes de Producción)

Esta fase es **obligatoria** antes de que la aplicación sea usada por usuarios reales.

### Tarea 1.1 — Proteger AUTH_SECRET
- [ ] **Archivo:** `src/lib/auth.ts`
- [ ] Eliminar fallback hardcodeado `'mayenailsart-default-secret-change-in-production-2024'`
- [ ] Hacer que la app falle al iniciar si `AUTH_SECRET` no está configurada
- [ ] Agregar validación en `next.config.ts` o script de startup
- [ ] Documentar en README que AUTH_SECRET es obligatorio
- [ ] **Impacto:** Elimina la posibilidad de que cualquiera firme tokens JWT válidos

### Tarea 1.2 — Eliminar Token Demo Hardcodeado
- [ ] **Archivos:** `src/lib/auth.ts`, `src/lib/fallbacks.ts`
- [ ] Remover bypass `'demo-token-123'` de `verifyToken()`
- [ ] Remover el flag `isDemoUser` de `requireAuth()`
- [ ] Reimplementar modo demo como flag en base de datos (`isDemo: Boolean` en User)
- [ ] **Impacto:** Elimina el bypass de autenticación

### Tarea 1.3 — Migrar Token a httpOnly Cookies
- [ ] **Archivos:** `src/lib/auth.ts`, `src/lib/api.ts`, `src/stores/auth.ts`, `src/middleware.ts`
- [ ] En login, setear cookie `httpOnly`, `secure`, `sameSite=strict` con el JWT
- [ ] Modificar `requireAuth()` para leer token de cookie en lugar de header Authorization
- [ ] Actualizar `stores/auth.ts` para no guardar token en localStorage
- [ ] Actualizar `api.ts` para no enviar header Authorization manualmente
- [ ] Configurar middleware para extraer token de cookie
- [ ] **Impacto:** Protege contra XSS — el token no es accesible desde JavaScript

### Tarea 1.4 — Implementar Rate Limiting
- [ ] Agregar rate limiting a endpoints de autenticación
- [ ] Opción A: Usar `@upstash/ratelimit` con Redis (necesita Redis)
- [ ] Opción B: Implementar in-memory rate limiter en middleware
- [ ] Configurar: máximo 5 intentos de login por IP cada 15 minutos
- [ ] Configurar: máximo 3 registros por IP cada hora
- [ ] **Impacto:** Previene ataques de fuerza bruta

### Tarea 1.5 — Fortalecer Política de Contraseñas
- [ ] **Archivo:** `src/lib/validations.ts`
- [ ] Cambiar validación de password: mínimo 8 caracteres, al menos 1 mayúscula, 1 número
- [ ] Agregar confirmación de contraseña en registro
- [ ] **Impacto:** Mejora la seguridad de cuentas de usuario

### Tarea 1.6 — Centralizar Autenticación en Middleware
- [ ] **Archivo:** `src/middleware.ts`
- [ ] Implementar verificación JWT en middleware para todas las rutas `/api/*`
- [ ] Excluir rutas públicas: `POST /api/auth`, `GET /api/ping`, `GET /api/sanity-check`
- [ ] Pasar userId autenticado como header `X-User-Id` o request context
- [ ] Simplificar `requireAuth()` para leer del contexto en lugar de hacer todo en cada ruta
- [ ] **Impacto:** Autenticación centralizada, menos código duplicado, más seguridad

### Tarea 1.7 — Eliminar Contraseñas del Código Fuente
- [ ] **Archivo:** `datos/demo.ts`
- [ ] Mover contraseña demo a variable de entorno `DEMO_PASSWORD`
- [ ] Si no está configurada, generar una aleatoria y mostrarla en consola
- [ ] Agregar `datos/demo.ts` a revisión de seguridad pre-commit
- [ ] **Impacto:** Elimina credenciales expuestas en el repositorio

---

## Fase 2: Deuda Técnica (Prioridad ALTA)

Una vez la seguridad esté resuelta, limpiar la deuda técnica.

### Tarea 2.1 — Unificar Esquemas Prisma
- [ ] Comparar `schema.prisma` y `schema.production.prisma`
- [ ] Consolidar en un solo `schema.prisma`
- [ ] Si algunos campos son solo para dev (ej: SQLite), usar conditional datasource
- [ ] Ejecutar migración para sincronizar BD
- [ ] Eliminar `schema.production.prisma`
- [ ] **Impacto:** Una sola fuente de verdad para el esquema de BD

### Tarea 2.2 — Migrar Fechas a Tipos Nativos
- [ ] **Archivo:** `schema.prisma` (modelo Appointment)
- [ ] Cambiar `date String` → `date DateTime`
- [ ] Cambiar `startTime String` → `startTime DateTime`
- [ ] Cambiar `endTime String` → `endTime DateTime`
- [ ] Escribir migración de datos para convertir strings existentes
- [ ] Actualizar todas las API routes que leen/escriben estos campos
- [ ] Actualizar componentes que muestran fechas
- [ ] **Impacto:** Permite usar funciones de BD para filtros, mejor manejo de timezone

### Tarea 2.3 — Migrar `config` a JSON Nativo
- [ ] **Archivo:** `schema.prisma` (modelo AutomationRule)
- [ ] Cambiar `config String` → `config Json`
- [ ] Crear tipos TypeScript para cada tipo de configuración de automatización
- [ ] Validar con Zod al leer/escribir
- [ ] Ejecutar migración de BD
- [ ] **Impacto:** Type safety en configuraciones, queries más eficientes

### Tarea 2.4 — Eliminar Dependencias Muertas
- [ ] Investigar uso de `z-ai-web-dev-sdk` en el código → si no se usa, eliminar
- [ ] Decidir: usar `next-auth` (migrar auth a NextAuth v5) o eliminarlo
- [ ] Decidir: configurar `next-intl` o eliminarlo
- [ ] `bun remove z-ai-web-dev-sdk` (si no se usa)
- [ ] Verificar otros paquetes no utilizados con `bun pm ls`
- [ ] **Impacto:** Reduce superficie de ataque, instalación más rápida

### Tarea 2.5 — Tipar el API Client
- [ ] **Archivo:** `src/lib/api.ts`
- [ ] Crear `src/types/api.ts` con interfaces de respuesta para cada endpoint
- [ ] Reemplazar `Promise<any>` con tipos genéricos `Promise<ApiResponse<T>>`
- [ ] Agregar tipos para parámetros de cada método
- [ ] **Impacto:** Type safety completa en el cliente, mejor autocompletado

### Tarea 2.6 — Eliminar SQLite del Repositorio
- [ ] Agregar `db/*.db` a `.gitignore`
- [ ] Remover `db/custom.db` del repositorio con `git rm --cached`
- [ ] Documentar cómo generar BD local para desarrollo
- [ ] **Impacto:** Evita leaks de datos de prueba, repositorio más limpio

### Tarea 2.7 — Auditoría del Sistema de Fallbacks
- [ ] Agregar variable de entorno `USE_FALLBACKS` (default: false en producción)
- [ ] Envolver el uso de `FALLBACKS` con check de esta variable
- [ ] En producción, devolver error 503 si la BD falla (no datos falsos)
- [ ] En desarrollo, mantener fallbacks para trabajar sin BD
- [ ] **Impacto:** Evita mostrar datos ficticios como reales en producción

---

## Fase 3: Robustez y Calidad (Prioridad MEDIA)

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

### Tarea 3.5 — Agregar CSRF Protection
- [ ] Implementar token CSRF en formularios de mutación
- [ ] Validar header `Origin`/`Referer` en API routes de mutación
- [ ] **Impacto:** Protege contra CSRF en operaciones de escritura

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
Semana 1:        Fase 1 completa (Seguridad)
Semana 2-3:      Fase 2 completa (Deuda Técnica)
Semana 4:        Arreglar Docker healthcheck + validación de env
Semana 5-6:      Tests + manejo de errores
Semana 7+:       Funcionalidad futura según prioridad del negocio
```

---

## Métricas de Éxito

| Indicador | Estado Actual | Meta |
|-----------|---------------|------|
| Fallos de seguridad críticos | 7 | 0 |
| Cobertura de tests | 0% | 60%+ |
| Dependencias sin usar | 3+ | 0 |
| Esquemas de BD divergentes | 2 | 1 |
| Type safety en API client | No | Sí |
| Token en httpOnly cookie | No | Sí |
| Rate limiting | No | Sí |
| Healthcheck funcional | No | Sí |

---

## Riesgos del Plan

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|------------|
| Migración de fechas rompe datos existentes | Media | Hacer backup, probar en staging |
| Migrar a httpOnly cookies rompe el frontend | Baja | Actualizar api.ts y stores al mismo tiempo |
| NextAuth v5 tiene breaking changes | Media | Evaluar antes de migrar; mantener JWT manual si es más costo-efectivo |
| Redis no disponible para rate limiting | Media | Usar rate limiter in-memory como fallback |
