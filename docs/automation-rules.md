# Módulo de Automatizaciones — Reglas del Motor de Ejecución

> Documento técnico-comercial del sistema de reglas automáticas de Nailagenda.
> Versión: 1.0 — Julio 2026

---

## Arquitectura General

El motor de ejecución (`POST /api/automations/run`) procesa las reglas activas de cada usuario y genera acciones automáticas sobre sus clientes. Actualmente opera en **modo simulación**: registra cada acción en `AutomationLog` sin enviar mensajes reales. Cuando se integre WhatsApp Cloud API, el mismo motor enviará los mensajes de forma real sin cambiar la lógica de negocio.

---

## Las 4 Reglas del Motor

---

### 1. REMINDER — Recordatorio Inteligente de Citas

**Propósito:** Reducir las inasistencias (no-shows) recordando a cada cliente su próxima cita en el momento justo.

**Disparador:** Ejecución manual o programada del motor.

**Lógica de detección:**
```
1. Buscar citas del usuario con fecha entre [ahora, ahora + 24h]
2. Filtrar solo aquellas con estado PENDING o CONFIRMED
3. Por cada cita encontrada:
   a. Extraer: nombre del cliente, servicio contratado, fecha y hora
   b. Generar acción "SEND_REMINDER"
   c. Construir mensaje con la plantilla configurada
   d. Registrar en AutomationLog
```

**Variables de la plantilla:**
| Variable | Se reemplaza por |
|----------|-----------------|
| `{nombre}` | Nombre del cliente |
| `{servicio}` | Nombre del servicio contratado |
| `{fecha}` | Fecha de la cita |
| `{hora}` | Hora de la cita |
| `{salon}` | Nombre del salón |

**Ejemplo de mensaje generado:**
> "Hola María, te recordamos tu cita de Uñas Acrílicas el 25/07/2026 a las 10:00. ¡Te esperamos!"

**Configuración disponible:**
- `hoursBefore` — Antelación del recordatorio (ej: 24h, 2h)
- `messageTemplate` — Plantilla del mensaje con placeholders

**Métrica clave:** Reducción de no-shows.

---

### 2. REACTIVATION — Reactivación de Clientes Inactivos

**Propósito:** Recuperar clientes que dejaron de visitar el salón, ofreciéndoles un incentivo para volver.

**Disparador:** Ejecución manual o programada del motor.

**Lógica de detección:**
```
1. Identificar dos grupos de clientes:

   Grupo A — Clientes con estado INACTIVE:
   a. Buscar su última cita registrada
   b. Si la última cita fue hace más de 30 días → generar acción

   Grupo B — Clientes con estado RECURRING o NEW:
   a. Buscar clientes sin ninguna cita en los últimos 30 días
   b. Si no tienen citas recientes → generar acción

2. Por cada cliente detectado:
   a. Generar acción "REACTIVATION_OUTREACH"
   b. Incluir detalle: días desde última visita
   c. Registrar en AutomationLog
```

**Variables de la plantilla:**
| Variable | Se reemplaza por |
|----------|-----------------|
| `{nombre}` | Nombre del cliente |
| `{salon}` | Nombre del salón |
| `{dias}` | Días desde la última visita |

**Ejemplo de mensaje generado:**
> "Hola Carlos, hace tiempo que no te vemos en Nailagenda. ¡Te echamos de menos! Ven esta semana y llévate un 10% de descuento en tu próximo servicio."

**Configuración disponible:**
- `daysInactiveThreshold` — Días de inactividad para considerar reactivación (ej: 30)
- `messageTemplate` — Plantilla del mensaje
- `offer` — Oferta o descuento opcional a incluir

**Métrica clave:** Tasa de reactivación de clientes inactivos.

---

### 3. LOYALTY — Fidelización y Recompensas

**Propósito:** Fomentar la lealtad de los clientes frecuentes reconociendo su fidelidad con recompensas automáticas en hitos clave.

**Disparador:** Ejecución manual o programada del motor.

**Lógica de detección:**
```
1. Buscar clientes con estado RECURRING del usuario
2. Por cada cliente:
   a. Contar el número de citas COMPLETED
   b. Si el cliente tiene ≥ 5 visitas completadas
      Y el número de visitas es múltiplo de 5 (5, 10, 15, 20…):
      → Generar acción "LOYALTY_REWARD"
3. Registrar en AutomationLog con el número de visitas acumuladas
```

**Variables de la plantilla:**
| Variable | Se reemplaza por |
|----------|-----------------|
| `{nombre}` | Nombre del cliente |
| `{visitas}` | Número de visitas completadas |
| `{salon}` | Nombre del salón |
| `{premio}` | Descripción de la recompensa |

**Ejemplo de mensaje generado:**
> "¡Felicidades María! Has completado 10 visitas en Nailagenda. Como cliente fiel, llévate un 15% de descuento en tu próxima visita. ¡Gracias por confiar en nosotros!"

**Configuración disponible:**
- `minimumVisits` — Visitas mínimas para primera recompensa (ej: 5)
- `visitInterval` — Cada cuántas visitas se repite la recompensa (ej: 5)
- `rewardDescription` — Descripción de la recompensa
- `messageTemplate` — Plantilla del mensaje

**Métrica clave:** Tasa de retención de clientes recurrentes.

---

### 4. SMART_CONTACT — Contacto Inteligente Predictivo

**Propósito:** Contactar a cada cliente en el momento óptimo basándose en su patrón histórico de visitas, maximizando la probabilidad de que agende una nueva cita.

**Disparador:** Ejecución manual o programada del motor.

**Lógica de detección:**
```
1. Buscar todos los clientes RECURRING y NEW del usuario
2. Solo procesar clientes con al menos 2 visitas completadas (necesario para calcular frecuencia)
3. Por cada cliente:
   a. Obtener todas sus citas COMPLETED ordenadas por fecha descendente
   b. Calcular el promedio de días entre cada visita (frecuencia media)
   c. Calcular los días transcurridos desde la última visita
   d. Determinar el día óptimo de contacto:
      - Restar 3 días al promedio de frecuencia
      - Si los días desde la última visita superan ese umbral
      → Generar acción "SMART_CONTACT"
4. Registrar en AutomationLog con:
   - Frecuencia media entre visitas
   - Días desde última visita
   - Evaluación: "Momento óptimo para contactar"
```

**Ejemplo de análisis:**
| Cliente | Frecuencia media | Última visita | Días transcurridos | ¿Contactar? |
|---------|-----------------|---------------|-------------------|-------------|
| Ana | Cada 21 días | Hace 20 días | 20 ≥ 18 ✅ | Sí — ventana abierta |
| Laura | Cada 14 días | Hace 5 días | 5 < 11 ❌ | No — demasiado pronto |
| Carmen | Cada 30 días | Hace 35 días | 35 ≥ 27 ✅ | Sí — ya debería haber vuelto |

**Ejemplo de mensaje generado:**
> "Hola Ana, ya ha pasado un tiempo desde tu última visita. En Nailagenda tenemos nuevos diseños que te encantarán. ¿Te gustaría agendar?"

**Configuración disponible:**
- `analysisPeriodDays` — Período de análisis hacia atrás (default: 90 días)
- `contactWindowDays` — Máximo de días antes del promedio para contactar (default: 7). Actúa como tope al offset proporcional.
- `antiSpamCooldownDays` — Días mínimos entre contactos al mismo cliente (default: 7). Evita spam si el motor se ejecuta seguido.

**Comportamiento inteligente:**
El offset de contacto es **proporcional** (15% del promedio de visitas), no un valor fijo:
- Cliente con frecuencia cada 20 días → se contacta al día ~17 (igual que antes)
- Cliente con frecuencia cada 60 días → se contacta al día ~53 (mucho mejor que 57)
- Cliente con frecuencia cada 7 días → se contacta al día ~5

**Anti-spam incorporado:**
Antes de contactar a un cliente, el motor verifica en `AutomationLog` si ya se le contactó dentro de la ventana de `antiSpamCooldownDays`. Si es así, lo salta — aunque la condición se cumpla de nuevo.

**Métrica clave:** Tasa de conversión de contactos predictivos a citas agendadas.

---

## Comportamiento Actual vs Futuro

| Aspecto | Hoy (sin WhatsApp) | Futuro (con WhatsApp) |
|---------|-------------------|----------------------|
| Detección de reglas | ✅ Completa | ✅ Sin cambios |
| Generación de mensajes | ✅ Template con placeholders | ✅ Template con placeholders |
| Registro en AutomationLog | ✅ Se registra cada acción | ✅ Se registra cada acción |
| Envío al cliente | ❌ No se envía nada | ✅ Se envía por WhatsApp real |
| Control de límites | ❌ Sin límite | ✅ Límite por plan de notificaciones |
| Estado del envío | `completed` (simulado) | `sent`, `delivered`, `read`, `failed` |

## Modelo de Monetización (Propuesto)

```
Cada usuario tiene un límite mensual de notificaciones según su plan:

  Gratuito:    50 notificaciones/mes
  Profesional: 500 notificaciones/mes
  Ilimitado:   Sin límite

Paquetes adicionales (para cualquier plan):
  100 notificaciones extra   → +$5/mes
  500 notificaciones extra   → +$15/mes

Cuando el usuario agota su límite:
  → Las automatizaciones siguen ejecutándose y registrándose
  → Los mensajes NO se envían hasta que se recargue o compre un paquete
  → El panel muestra: "Te quedan 0 notificaciones este mes"
```

---

*Documento generado a partir del código fuente del motor de ejecución (`src/app/api/automations/run/route.ts`).*
