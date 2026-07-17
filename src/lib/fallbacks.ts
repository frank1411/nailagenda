// ── Fallback Data ──
// Datos ficticios para desarrollo cuando no hay BD

export const DEMO_USER_ID = 'cmprffoo10000jrm79fshecm0';

/**
 * Retorna true si se deben usar fallbacks (datos ficticios).
 * En producción: solo si USE_FALLBACKS=true está explicitamente activado.
 * En desarrollo: por defecto true, a menos que USE_FALLBACKS=false.
 */
export function shouldUseFallbacks(): boolean {
  const env = process.env.NODE_ENV || 'development';
  const useFallbacks = process.env.USE_FALLBACKS;

  if (env === 'production') {
    return useFallbacks === 'true' || useFallbacks === '1';
  }
  // Desarrollo: fallbacks activos por defecto
  return useFallbacks !== 'false' && useFallbacks !== '0';
}

export const FALLBACKS = {
  clients: [
    {
      id: 'client-1',
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@example.com',
      phone: '123456789',
      status: 'RECURRING',
      notes: 'Prefiere tonos nude',
      preferredStylist: 'Maye',
      birthday: '1990-05-15',
      totalVisits: 5,
      lastAppointment: { date: '2024-05-20', startTime: '10:00', status: 'COMPLETED' },
      userId: DEMO_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'client-2',
      firstName: 'Lucía',
      lastName: 'Martínez',
      email: 'lucia@example.com',
      phone: '987654321',
      status: 'NEW',
      notes: 'Alergia a algunos acrílicos',
      preferredStylist: 'Maye',
      birthday: '1995-11-02',
      totalVisits: 0,
      lastAppointment: null,
      userId: DEMO_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'client-3',
      firstName: 'Elena',
      lastName: 'Rojas',
      email: 'elena@example.com',
      phone: '555666777',
      status: 'INACTIVE',
      notes: 'No ha vuelto desde diciembre',
      preferredStylist: 'Maye',
      birthday: '1988-03-22',
      totalVisits: 3,
      lastAppointment: { date: '2023-12-10', startTime: '15:00', status: 'COMPLETED' },
      userId: DEMO_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'client-4',
      firstName: 'Sofía',
      lastName: 'Lopez',
      email: 'sofia@example.com',
      phone: '444333222',
      status: 'RECURRING',
      notes: 'Amo el glitter',
      preferredStylist: 'Maye',
      birthday: '1992-07-08',
      totalVisits: 12,
      lastAppointment: { date: '2024-05-15', startTime: '11:00', status: 'COMPLETED' },
      userId: DEMO_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  services: [
    {
      id: 'service-1',
      name: 'Manicura Rusa',
      description: 'Limpieza profunda de cutícula y esmaltado semipermanente',
      duration: 90,
      price: 35.0,
      category: 'GENERAL',
      active: true,
      userId: DEMO_USER_ID,
    },
    {
      id: 'service-2',
      name: 'Uñas Acrílicas XL',
      description: 'Extensión con acrílico y diseño avanzado',
      duration: 150,
      price: 60.0,
      category: 'COLORING',
      active: true,
      userId: DEMO_USER_ID,
    },
  ],
  appointments: [
    {
      id: 'app-1',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:30',
      status: 'CONFIRMED',
      notes: 'Diseño floral',
      clientId: 'client-1',
      serviceId: 'service-1',
      userId: DEMO_USER_ID,
      client: {
        id: 'client-1',
        firstName: 'Ana',
        lastName: 'García',
        phone: '123456789',
      },
      service: {
        id: 'service-1',
        name: 'Manicura Rusa',
        duration: 90,
        price: 35.0,
      },
    },
  ],
  dashboard: {
    totalClients: 25,
    clientsByStatus: {
      NEW: 6,
      RECURRING: 12,
      INACTIVE: 7,
    },
    weekRevenue: 450,
    todayAppointments: [
      {
        id: 'app-1',
        client: { firstName: 'Ana', lastName: 'García' },
        service: { name: 'Manicura Rusa', price: 35 },
        startTime: '10:00',
        status: 'CONFIRMED',
      },
    ],
    recentActivity: [
      { 
        id: 'act-1', 
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        status: 'COMPLETED',
        updatedAt: new Date().toISOString(),
        client: { id: 'client-1', firstName: 'Ana', lastName: 'García' }, 
        service: { id: 'service-1', name: 'Manicura Rusa' }, 
        message: 'Cita completada con éxito'
      },
      { 
        id: 'act-2', 
        date: new Date().toISOString().split('T')[0],
        startTime: '14:00',
        status: 'CONFIRMED',
        updatedAt: new Date().toISOString(),
        client: { id: 'client-2', firstName: 'Lucía', lastName: 'Martínez' }, 
        service: { id: 'service-2', name: 'Uñas Acrílicas XL' }, 
        message: 'Nueva cita agendada'
      },
    ],
    clientsByStatusList: [
      {
        id: 'client-1',
        firstName: 'Ana',
        lastName: 'García',
        phone: '123456789',
        email: 'ana@example.com',
        status: 'RECURRING',
        updatedAt: new Date().toISOString(),
        appointments: [{ id: 'app-1', date: '2024-05-20', startTime: '10:00', service: { name: 'Manicura Rusa', price: 35 } }],
      },
      {
        id: 'client-2',
        firstName: 'Lucía',
        lastName: 'Martínez',
        phone: '987654321',
        email: 'lucia@example.com',
        status: 'NEW',
        updatedAt: new Date().toISOString(),
        appointments: [],
      },
      {
        id: 'client-3',
        firstName: 'Elena',
        lastName: 'Rojas',
        phone: '555666777',
        email: 'elena@example.com',
        status: 'INACTIVE',
        updatedAt: new Date().toISOString(),
        appointments: [{ id: 'app-3', date: '2023-12-10', startTime: '15:00', service: { name: 'Manicura Rusa', price: 35 } }],
      },
      {
        id: 'client-4',
        firstName: 'Sofía',
        lastName: 'Lopez',
        phone: '444333222',
        email: 'sofia@example.com',
        status: 'RECURRING',
        updatedAt: new Date().toISOString(),
        appointments: [{ id: 'app-4', date: '2024-05-15', startTime: '11:00', service: { name: 'Uñas Acrílicas XL', price: 60 } }],
      },
    ],
  },
  automations: [
    {
      id: 'auto-1',
      name: 'Recordatorio 24h',
      description: 'Envía recordatorio un día antes de la cita',
      type: 'REMINDER',
      active: true,
      config: { channel: 'WhatsApp', message: 'Hola! Te recordamos tu cita mañana.' },
      userId: DEMO_USER_ID,
      _count: { logs: 15 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'auto-2',
      name: 'Reactivación Inactivos',
      description: 'Contacta clientes que no vienen hace 30 días',
      type: 'REACTIVATION',
      active: false,
      config: { days: 30, message: 'Te extrañamos! Vuelve por un 10% desc.' },
      userId: DEMO_USER_ID,
      _count: { logs: 5 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};
