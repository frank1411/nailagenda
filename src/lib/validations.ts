import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  action: z.literal('register'),
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').max(128),
  salonName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  action: z.literal('login'),
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

// Client schemas
export const createClientSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido').max(50),
  lastName: z.string().min(1, 'Apellido requerido').max(50),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  status: z.enum(['NEW', 'RECURRING', 'INACTIVE']).default('NEW'),
  notes: z.string().max(2000).optional(),
  preferredStylist: z.string().max(100).optional(),
  birthday: z.string().max(20).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Service schemas
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(5, 'Duración mínima: 5 minutos').max(480, 'Duración máxima: 8 horas'),
  price: z.number().min(0, 'Precio no puede ser negativo').max(10000),
  category: z.enum(['HAIRCUT', 'COLORING', 'STYLING', 'TREATMENT', 'GENERAL']).default('GENERAL'),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  active: z.boolean().optional(),
});

// Appointment schemas
export const createAppointmentSchema = z.object({
  clientId: z.string().min(1, 'Cliente requerido'),
  serviceId: z.string().min(1, 'Servicio requerido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('PENDING'),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial().omit({ clientId: true, serviceId: true });

// Client Note schema
export const createNoteSchema = z.object({
  content: z.string().min(1, 'Contenido requerido').max(2000),
  type: z.enum(['PREFERENCE', 'NOTE', 'ALERT']).default('NOTE'),
});

// Automation schemas
export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['REMINDER', 'REACTIVATION', 'LOYALTY', 'SMART_CONTACT']),
  config: z.string().max(2000),
  active: z.boolean().default(true),
});

export const updateAutomationSchema = createAutomationSchema.partial();

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});
