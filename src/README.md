# CrmNailsAgency CRM

CRM especializado para estudios de nail art. Gestiona clientes, citas, servicios y automatizaciones desde un solo lugar.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)

---

## Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación Local](#instalación-local)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [Credenciales Demo](#credenciales-demo)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [API Reference](#api-reference)
- [Arquitectura](#arquitectura)

---

## Características

- **Tablero Visual** — Clientes organizados por estado: Nuevos, Recurrentes, Inactivos
- **Calendario Inteligente** — Gestión de citas con vista diaria/semanal
- **Fichas de Cliente** — Historial completo, notas, preferencias y alertas
- **Gestión de Servicios** — Catálogo con precios, duración y categorías
- **Automatizaciones** — Recordatorios, reactivación de inactivos, fidelización, contacto inteligente
- **Dashboard** — KPIs en tiempo real, citas del día, actividad reciente
- **Demo con un clic** — Botón "Ver Demo" que crea datos de ejemplo automáticamente
- **Rate Limiting** — Protección contra abuso en endpoints de auth y seed
- **Responsive** — Diseño adaptable a móvil y desktop
- **Seguridad** — JWT, bcrypt, headers de seguridad, validación Zod

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 con App Router |
| Lenguaje | TypeScript 5 |
| Estilo | Tailwind CSS 4 + shadcn/ui |
| Base de datos | Prisma ORM (SQLite dev / PostgreSQL prod) |
| Autenticación | JWT (jose) + bcryptjs |
| Estado | Zustand |
| Animaciones | Framer Motion |
| Validación | Zod |
| Iconos | Lucide React |

---

## Estructura del Proyecto

```
mayenailsart/
├── prisma/
│   ├── schema.prisma              # Schema activo (PostgreSQL vía Supabase)
│   ├── schema.sqlite.prisma       # Backup del schema SQLite
│   ├── seed.ts                    # Script de seed standalone
│   └── db/custom.db               # Base de datos SQLite local
├── scripts/
│   └── vercel-build.sh            # Build script para Vercel
├── src/
│   ├── app/
│   │   ├── layout.tsx             # RootLayout
│   │   ├── page.tsx               # Página única (SPA)
│   │   ├── error.tsx              # Error boundary
│   │   └── api/                   # 14 API routes REST
│   │       ├── auth/route.ts
│   │       ├── seed/route.ts
│   │       ├── clients/
│   │       ├── appointments/
│   │       ├── services/
│   │       ├── automations/
│   │       ├── dashboard/route.ts
│   │       └── download/route.ts
│   ├── components/                # 11 componentes principales
│   │   ├── landing-page.tsx
│   │   ├── auth-dialog.tsx
│   │   ├── dashboard-view.tsx
│   │   ├── calendar-view.tsx
│   │   ├── client-list.tsx
│   │   ├── client-profile.tsx
│   │   ├── service-management.tsx
│   │   ├── automation-panel.tsx
│   │   ├── settings-panel.tsx
│   │   ├── onboarding-tour.tsx
│   │   └── production-guide.tsx
│   ├── stores/
│   │   └── auth.ts                # Zustand: useAuthStore + useAppStore
│   ├── lib/
│   │   ├── auth.ts                # JWT, bcrypt, requireAuth
│   │   ├── api.ts                 # ApiClient con safeParseJson
│   │   ├── db.ts                  # Prisma client singleton/serverless
│   │   ├── validations.ts         # Zod schemas
│   │   └── utils.ts               # Utilidades
│   ├── hooks/
│   └── middleware.ts              # Rate limiting
├── vercel.json
├── Caddyfile
└── package.json
```

---

## Instalación Local

### Prerrequisitos

- [Node.js](https://nodejs.org/) 18+ o [Bun](https://bun.sh/) 1.0+
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd mayenailsart

# 2. Instalar dependencias
bun install
# o: npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de Entorno)

# 4. Crear la base de datos y generar el cliente Prisma
bun run db:push
# o: npx prisma db push

# 5. (Opcional) Cargar datos demo
bun run db:seed
# o: npx prisma db seed

# 6. Iniciar el servidor de desarrollo
bun run dev
# o: npm run dev

# 7. Abrir en el navegador
# http://localhost:3000
```

---

## Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

### Desarrollo Local (SQLite)

```env
# Base de datos SQLite (por defecto)
DATABASE_URL="file:./db/custom.db"

# Secreto para JWT (requerido — generar con openssl rand -base64 32)
AUTH_SECRET="tu-secreto-jwt-generado"

# Secreto para el endpoint de seed (opcional en dev)
SEED_SECRET="mayenailsart-seed-2024"
```

### Producción (PostgreSQL en Vercel)

```env
# Base de datos PostgreSQL (Supabase, Neon, etc.)
DATABASE_URL="postgresql://usuario:password@host:5432/database?pgbouncer=true"

# ⚠️ IMPORTANTE: Secreto JWT - DEBE configurarse en producción
AUTH_SECRET="tu-secreto-super-seguro-aqui-minimo-32-caracteres"

# Secreto para el endpoint de seed
SEED_SECRET="tu-seed-secret-personalizado"
```

> **Nota sobre PostgreSQL**: Si usas Supabase o Neon con connection pooling, usa la URL con `?pgbouncer=true` o la URL "pooling" que proveen. Para Prisma migrate/seed usa la URL directa (sin pgbouncer).

---

## Base de Datos

### Modelos

```
User ──┬── Client ──── Appointment
       │           ├── ClientNote
       │           └── AutomationLog ─── AutomationRule
       ├── Service ──── Appointment
       ├── Appointment
       └── AutomationRule ─── AutomationLog
```

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuario del sistema (dueño/staff del salón) |
| **Client** | Cliente del salón con estado (NEW/RECURRING/INACTIVE) |
| **Service** | Servicio ofrecido con precio, duración y categoría |
| **Appointment** | Cita con fecha, hora, estado y notas |
| **ClientNote** | Nota del cliente (preferencia, alerta, nota general) |
| **AutomationRule** | Regla de automatización (recordatorio, reactivación, fidelidad, contacto inteligente) |
| **AutomationLog** | Log de ejecución de automatización |

### Comandos Útiles

```bash
# Aplicar schema a la base de datos
bun run db:push

# Generar cliente Prisma (después de cambiar schema)
bun run db:generate

# Cargar datos demo
bun run db:seed

# Resetear base de datos (¡elimina todos los datos!)
bun run db:reset

# Migraciones para producción
bun run db:migrate:prod
```

---

## Credenciales Demo

El botón **"Ver Demo"** en la landing page abre el diálogo de login. Las credenciales del usuario demo se configuran mediante variables de entorno (`DEMO_EMAIL` y `DEMO_PASSWORD`). También puedes acceder al usuario demo desde la base de datos directamente.

| Campo | Valor |
|-------|-------|
| Email | `demo@mayenailsart.com` |
| Password | Configurado en `DEMO_PASSWORD` |

### Datos incluidos en el demo

- 1 usuario administrador
- 8 servicios de nail art
- 14 clientes con estados variados
- 20+ citas (pasadas, hoy, futuras)
- 9 notas de cliente (preferencias, alertas)
- 4 reglas de automatización

---

## Despliegue en Vercel

### Paso 1: Preparar la base de datos PostgreSQL

Puedes usar [Supabase](https://supabase.com/), [Neon](https://neon.tech/), [Railway](https://railway.app/) o cualquier proveedor de PostgreSQL.

Obtén la **connection string** de tu proveedor. Ejemplo de Supabase:
```
postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Paso 2: Configurar en Vercel

1. Ve a [vercel.com](https://vercel.com/) e importa tu repositorio
2. En **Settings → Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de PostgreSQL (con pgbouncer si aplica) |
| `AUTH_SECRET` | Secreto JWT (mínimo 32 caracteres, generar con `openssl rand -base64 32`) |
| `SEED_SECRET` | Secreto para endpoint de seed (opcional, default: `mayenailsart-seed-2024`) |

3. En **Settings → General**, verifica:
   - **Framework Preset**: Next.js
   - **Build Command**: Se usa el de `vercel.json` (`bash scripts/vercel-build.sh`)
   - **Install Command**: `bun install` (o `npm install`)

### Paso 3: Cómo funciona el build en Vercel

El archivo `scripts/vercel-build.sh` ejecuta automáticamente:

```
1. Detecta si DATABASE_URL es PostgreSQL
2. Ejecuta prisma generate y prisma db push
3. Ejecuta prisma generate (genera cliente PostgreSQL)
4. Ejecuta prisma db push (crea/actualiza tablas en PostgreSQL)
5. Ejecuta next build
6. Restaura schema SQLite para git
```

> **Importante**: El script `postinstall` de npm ejecuta `prisma generate` con el schema SQLite. El build script de Vercel **sobreescribe** esto generando el cliente PostgreSQL correcto. Si el build falla, verifica que el build script se esté ejecutando.

### Paso 4: Cargar datos demo en producción

Una vez desplegado, puedes cargar los datos demo de dos formas:

1. **Botón "Ver Demo"** en la landing page — llama automáticamente al endpoint `/api/seed`
2. **Manualmente** con curl:
   ```bash
   curl -X POST "https://tu-dominio.vercel.app/api/seed?token=mayenailsart-seed-2024"
   ```

### Solución de Problemas en Vercel

| Problema | Causa | Solución |
|----------|-------|----------|
| 500 en `/api/auth` | Prisma generó cliente SQLite en vez de PostgreSQL | Verificar que `vercel-build.sh` se ejecuta como build command |
| Error "table doesn't exist" | `prisma db push` no se ejecutó | Ejecutar `npx prisma db push` manualmente con la URL de PostgreSQL |
| Error de conexión a DB | URL de PostgreSQL incorrecta | Verificar DATABASE_URL en Vercel, usar URL con pgbouncer para pooling |
| Timeout en consultas | Sin connection pooling | Usar URL con `?pgbouncer=true` o la URL "pooling" del proveedor |
| Respuesta HTML en vez de JSON | Server crash, Prisma cliente incorrecto | Verificar logs de build en Vercel, confirmar que schema se cambió a PostgreSQL |

---

## API Reference

### Autenticación

#### POST `/api/auth`
Login o registro de usuario.

```json
// Login
{ "action": "login", "email": "demo@mayenailsart.com", "password": "<DEMO_PASSWORD>" }

// Registro
{ "action": "register", "email": "nuevo@email.com", "name": "Nombre", "password": "123456", "salonName": "Mi Salón" }
```

Respuesta:
```json
{
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "salonName": "...", "role": "OWNER" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

#### GET `/api/auth`
Obtener usuario actual. Requiere header `Authorization: Bearer <token>`.

### Seed

#### POST `/api/seed?token=SEED_SECRET`
Crear datos demo. Protegido por token en producción.

### Clientes

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/clients?status=NEW&search=ana` | Listar clientes (filtros opcionales) |
| POST | `/api/clients` | Crear cliente |
| GET | `/api/clients/:id` | Obtener cliente |
| PUT | `/api/clients/:id` | Actualizar cliente |
| DELETE | `/api/clients/:id` | Eliminar cliente |
| GET | `/api/clients/:id/notes` | Notas del cliente |
| POST | `/api/clients/:id/notes` | Agregar nota |

### Citas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/appointments?date=2024-01-15` | Listar citas (filtros opcionales) |
| POST | `/api/appointments` | Crear cita |
| PUT | `/api/appointments/:id` | Actualizar cita |
| DELETE | `/api/appointments/:id` | Eliminar cita |

### Servicios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/services` | Listar servicios |
| POST | `/api/services` | Crear servicio |
| PUT | `/api/services/:id` | Actualizar servicio |
| DELETE | `/api/services/:id` | Eliminar servicio |

### Automatizaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/automations` | Listar automatizaciones |
| POST | `/api/automations` | Crear automatización |
| PUT | `/api/automations/:id` | Actualizar automatización |
| DELETE | `/api/automations/:id` | Eliminar automatización |
| POST | `/api/automations/run` | Ejecutar automatizaciones activas |

### Dashboard

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard` | Stats agregadas (KPIs, tablero, citas del día) |

---

## Arquitectura

### Flujo de la Aplicación

```
Landing Page
  ├── "Comenzar"     → Auth Dialog (tab Register)
  ├── "Iniciar Sesión" → Auth Dialog (tab Login)
  └── "Ver Demo"     → authStore.login(DEMO_EMAIL, DEMO_PASSWORD) → API login normal
                                    ↓
                              App Shell
  ┌─────────────────────────────────────────────┐
  │  Sidebar │ Dashboard │ Calendar │ Clients  │
  │          │ Services  │ Automations│ Settings │
  └─────────────────────────────────────────────┘
```

### Autenticación

- **JWT** firmado con HS256 (biblioteca `jose`), expira en 7 días
- **Contraseñas** hasheadas con bcrypt (12 rounds)
- **Token** almacenado en `localStorage` como `glam-token`
- **API protegida** via header `Authorization: Bearer <token>`
- **Middleware** con rate limiting por IP

### Estado Global (Zustand)

- **useAuthStore**: `user`, `token`, `loading`, `initialized`, `init()`, `login()`, `register()`, `logout()`
- **useAppStore**: `currentView`, `selectedClientId`, `sidebarOpen`

### Seguridad

- Rate limiting en middleware (auth: 5/min, API: 60/min, seed: 2/min)
- Headers de seguridad (X-Frame-Options, X-XSS-Protection, etc.)
- Validación de input con Zod en todas las rutas API
- Endpoint de seed protegido con token en producción
- Secreto JWT configurable via `AUTH_SECRET`

---

## Licencia

Proyecto privado. Todos los derechos reservados.