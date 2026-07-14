// ============================================
// CrmNailsAgency CRM - Seed Script
// ============================================
// Run against PostgreSQL:
//   DATABASE_URL="postgresql://..." bun prisma/seed.ts
//
// Or via Prisma:
//   DATABASE_URL="postgresql://..." npx prisma db seed
//
// Demo email is configured via DEMO_EMAIL env var.
// Demo password must be set via DEMO_PASSWORD env var.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@mayenailsart.com'
const DEMO_PASSWORD = process.env.DEMO_PASSWORD as string

if (!DEMO_PASSWORD) {
    console.error('❌ DEMO_PASSWORD environment variable is required')
    process.exit(1)
}

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    })

    try {
        console.log('🌱 Starting database seed...')
        console.log(`📦 Database URL: ${process.env.DATABASE_URL?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`)

        // Check if demo user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: DEMO_EMAIL },
        })

        if (existingUser) {
            console.log('⚠️  Demo user already exists. Deleting existing data to re-seed...')

            // Delete in reverse dependency order
            await prisma.automationLog.deleteMany({ where: { client: { userId: existingUser.id } } })
            await prisma.automationRule.deleteMany({ where: { userId: existingUser.id } })
            await prisma.clientNote.deleteMany({ where: { client: { userId: existingUser.id } } })
            await prisma.appointment.deleteMany({ where: { userId: existingUser.id } })
            await prisma.client.deleteMany({ where: { userId: existingUser.id } })
            await prisma.service.deleteMany({ where: { userId: existingUser.id } })
            await prisma.user.delete({ where: { id: existingUser.id } })

            console.log('🗑️  Existing data deleted.')
        }

        // ========================================
        // 1. CREATE DEMO USER
        // ========================================
        console.log('👤 Creating demo user...')
        const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS)
        const user = await prisma.user.create({
            data: {
                email: DEMO_EMAIL,
                name: 'Maye García',
                password: hashedPassword,
                salonName: 'CrmNailsAgency Studio',
                salonAddress: 'Calle Principal 123, Caracas',
                role: 'OWNER',
                phone: '+58 412 000 0000',
            },
        })
        console.log(`✅ User created: ${user.name} (${user.email})`)

        // ========================================
        // 2. CREATE SERVICES
        // ========================================
        console.log('💅 Creating services...')
        const servicesData = [
            { name: 'Manicura Clásica', description: 'Manicura con esmalte tradicional', duration: 30, price: 15.0, category: 'STYLING' },
            { name: 'Gel UV', description: 'Esmalte en gel con curado UV', duration: 45, price: 25.0, category: 'TREATMENT' },
            { name: 'Nail Art Diseño', description: 'Diseño artístico personalizado', duration: 60, price: 35.0, category: 'COLORING' },
            { name: 'Acrílicas Completas', description: 'Uñas acrílicas con tips', duration: 90, price: 45.0, category: 'TREATMENT' },
            { name: 'Press-On Premium', description: 'Uñas press-on personalizadas', duration: 30, price: 30.0, category: 'STYLING' },
            { name: 'Pedicura + Esmalte', description: 'Pedicura completa con esmalte', duration: 60, price: 28.0, category: 'TREATMENT' },
            { name: 'Encapsulado', description: 'Técnica de encapsulado con decoraciones', duration: 75, price: 40.0, category: 'COLORING' },
            { name: 'Relleno Acrílico', description: 'Mantenimiento de uñas acrílicas', duration: 45, price: 25.0, category: 'TREATMENT' },
            { name: 'Remoción Gel/Acrílico', description: 'Retiro profesional de esmalte gel o acrílico', duration: 30, price: 12.0, category: 'TREATMENT' },
            { name: 'Manicura Spa', description: 'Manicura completa con tratamiento de hidratación', duration: 45, price: 22.0, category: 'TREATMENT' },
        ]

        const services = await Promise.all(
            servicesData.map((s) =>
                prisma.service.create({
                    data: { ...s, userId: user.id, active: true },
                })
            )
        )
        console.log(`✅ ${services.length} services created`)

        // ========================================
        // 3. CREATE CLIENTS
        // ========================================
        console.log('👥 Creating clients...')
        const clientsData = [
            { firstName: 'Ana', lastName: 'López', email: 'ana@email.com', phone: '+58 412 345 6789', status: 'RECURRING', preferredStylist: 'Maye', birthday: '1990-03-15', notes: 'Cliente frecuente desde 2022' },
            { firstName: 'Carmen', lastName: 'Rodríguez', email: 'carmen@email.com', phone: '+58 414 456 7890', status: 'RECURRING', preferredStylist: 'Maye', birthday: '1985-07-22', notes: 'Prefiere citas los viernes' },
            { firstName: 'Laura', lastName: 'Martínez', email: 'laura@email.com', phone: '+58 416 567 8901', status: 'NEW', birthday: '1995-11-08' },
            { firstName: 'Elena', lastName: 'Sánchez', email: 'elena@email.com', phone: '+58 424 678 9012', status: 'RECURRING', preferredStylist: 'Maye', birthday: '1988-01-30', notes: 'Siempre puntual' },
            { firstName: 'Isabel', lastName: 'García', email: 'isabel@email.com', phone: '+58 412 789 0123', status: 'INACTIVE', birthday: '1992-05-14', notes: 'No visita desde hace 2 meses' },
            { firstName: 'Marta', lastName: 'Fernández', email: 'marta@email.com', phone: '+58 414 890 1234', status: 'NEW', birthday: '1998-09-25' },
            { firstName: 'Sofía', lastName: 'Torres', email: 'sofia@email.com', phone: '+58 416 901 2345', status: 'RECURRING', preferredStylist: 'Maye', birthday: '1987-12-03', notes: 'Uñas delicadas - cuidado especial' },
            { firstName: 'Paula', lastName: 'Díaz', email: 'paula@email.com', phone: '+58 424 012 3456', status: 'INACTIVE', birthday: '1993-04-19', notes: 'Canceló última cita por viaje' },
            { firstName: 'Lucía', lastName: 'Moreno', email: 'lucia@email.com', phone: '+58 412 123 4567', status: 'NEW', birthday: '1996-08-11' },
            { firstName: 'Marina', lastName: 'Jiménez', email: 'marina@email.com', phone: '+58 414 234 5678', status: 'RECURRING', preferredStylist: 'Maye', birthday: '1991-06-27', notes: 'Prefiere tonos nude y pastel' },
            { firstName: 'Rosa', lastName: 'Hernández', email: 'rosa@email.com', phone: '+58 416 345 6789', status: 'INACTIVE', birthday: '1984-02-10' },
            { firstName: 'Teresa', lastName: 'Ruiz', email: 'teresa@email.com', phone: '+58 424 456 7890', status: 'NEW', birthday: '1997-10-05' },
            { firstName: 'Beatriz', lastName: 'Álvarez', email: 'beatriz@email.com', phone: '+58 412 567 8901', status: 'RECURRING', birthday: '1989-07-18', notes: 'Referida por Ana López' },
            { firstName: 'Clara', lastName: 'Romero', email: 'clara@email.com', phone: '+58 414 678 9012', status: 'NEW', birthday: '1994-03-22' },
            { firstName: 'Daniela', lastName: 'Navarro', email: 'daniela@email.com', phone: '+58 416 789 0123', status: 'RECURRING', preferredStylist: 'Maye', birthday: '1993-08-05', notes: 'Siempre trae referencia de sus amigas' },
        ]

        const clients = await Promise.all(
            clientsData.map((c) =>
                prisma.client.create({
                    data: {
                        ...c,
                        userId: user.id,
                    },
                })
            )
        )
        console.log(`✅ ${clients.length} clients created`)

        // ========================================
        // 4. CREATE APPOINTMENTS
        // ========================================
        console.log('📅 Creating appointments...')

        // Helper to format dates relative to today
        function daysAgo(n: number): string {
            const d = new Date()
            d.setDate(d.getDate() - n)
            return d.toISOString().split('T')[0]
        }
        function daysFromNow(n: number): string {
            const d = new Date()
            d.setDate(d.getDate() + n)
            return d.toISOString().split('T')[0]
        }

        const appointmentsData = [
            // === PAST APPOINTMENTS (COMPLETED) ===
            { clientId: clients[0].id, serviceId: services[2].id, date: daysAgo(30), startTime: '10:00', endTime: '11:00', status: 'COMPLETED', notes: 'Diseño floral rosa' },
            { clientId: clients[1].id, serviceId: services[3].id, date: daysAgo(28), startTime: '11:00', endTime: '12:30', status: 'COMPLETED', notes: 'Acrílicas nude largo medio' },
            { clientId: clients[3].id, serviceId: services[0].id, date: daysAgo(25), startTime: '12:00', endTime: '12:30', status: 'COMPLETED', notes: 'Manicura clásica para evento' },
            { clientId: clients[6].id, serviceId: services[1].id, date: daysAgo(22), startTime: '09:00', endTime: '09:45', status: 'COMPLETED', notes: 'Gel UV rojo burdeos' },
            { clientId: clients[9].id, serviceId: services[4].id, date: daysAgo(20), startTime: '16:00', endTime: '16:30', status: 'COMPLETED', notes: 'Press-on para fiesta' },
            { clientId: clients[12].id, serviceId: services[5].id, date: daysAgo(18), startTime: '14:00', endTime: '15:00', status: 'COMPLETED', notes: 'Pedicura completa' },
            { clientId: clients[0].id, serviceId: services[6].id, date: daysAgo(15), startTime: '10:00', endTime: '11:15', status: 'COMPLETED', notes: 'Encapsulado con cristales' },
            { clientId: clients[1].id, serviceId: services[7].id, date: daysAgo(14), startTime: '09:30', endTime: '10:15', status: 'COMPLETED', notes: 'Relleno acrílico mensual' },
            { clientId: clients[3].id, serviceId: services[0].id, date: daysAgo(12), startTime: '11:00', endTime: '11:30', status: 'COMPLETED' },
            { clientId: clients[9].id, serviceId: services[2].id, date: daysAgo(10), startTime: '13:00', endTime: '14:00', status: 'COMPLETED', notes: 'Nail art para boda' },
            { clientId: clients[13].id, serviceId: services[1].id, date: daysAgo(8), startTime: '10:00', endTime: '10:45', status: 'COMPLETED', notes: 'Primera visita - Gel UV' },
            { clientId: clients[14].id, serviceId: services[3].id, date: daysAgo(7), startTime: '11:00', endTime: '12:30', status: 'COMPLETED', notes: 'Acrílicas con glitter' },
            { clientId: clients[0].id, serviceId: services[8].id, date: daysAgo(5), startTime: '15:00', endTime: '15:30', status: 'COMPLETED', notes: 'Remoción de gel anterior' },
            { clientId: clients[6].id, serviceId: services[9].id, date: daysAgo(5), startTime: '09:00', endTime: '09:45', status: 'COMPLETED', notes: 'Manicura spa con hidratación' },
            { clientId: clients[1].id, serviceId: services[2].id, date: daysAgo(4), startTime: '10:00', endTime: '11:00', status: 'COMPLETED', notes: 'Nail art navideño' },
            { clientId: clients[3].id, serviceId: services[6].id, date: daysAgo(3), startTime: '14:00', endTime: '15:15', status: 'COMPLETED', notes: 'Encapsulado con flores secas' },
            { clientId: clients[12].id, serviceId: services[0].id, date: daysAgo(2), startTime: '09:00', endTime: '09:30', status: 'COMPLETED' },
            { clientId: clients[0].id, serviceId: services[1].id, date: daysAgo(1), startTime: '10:30', endTime: '11:15', status: 'COMPLETED', notes: 'Gel UV cambio de look' },
            { clientId: clients[9].id, serviceId: services[5].id, date: daysAgo(1), startTime: '13:00', endTime: '14:00', status: 'COMPLETED' },

            // === PAST NO-SHOW ===
            { clientId: clients[4].id, serviceId: services[1].id, date: daysAgo(3), startTime: '15:00', endTime: '15:45', status: 'NO_SHOW', notes: 'No asistió - sin aviso' },

            // === PAST CANCELLED ===
            { clientId: clients[7].id, serviceId: services[3].id, date: daysAgo(2), startTime: '16:00', endTime: '17:30', status: 'CANCELLED', notes: 'Canceló por viaje de emergencia' },
            { clientId: clients[10].id, serviceId: services[0].id, date: daysAgo(6), startTime: '11:00', endTime: '11:30', status: 'CANCELLED' },

            // === TODAY'S APPOINTMENTS ===
            { clientId: clients[2].id, serviceId: services[0].id, date: daysAgo(0), startTime: '09:00', endTime: '09:30', status: 'CONFIRMED', notes: 'Primera visita' },
            { clientId: clients[0].id, serviceId: services[1].id, date: daysAgo(0), startTime: '10:30', endTime: '11:15', status: 'CONFIRMED' },
            { clientId: clients[5].id, serviceId: services[4].id, date: daysAgo(0), startTime: '12:00', endTime: '12:30', status: 'PENDING' },
            { clientId: clients[6].id, serviceId: services[2].id, date: daysAgo(0), startTime: '16:00', endTime: '17:00', status: 'CONFIRMED', notes: 'Diseño para evento especial' },

            // === FUTURE APPOINTMENTS ===
            { clientId: clients[1].id, serviceId: services[6].id, date: daysFromNow(1), startTime: '10:00', endTime: '11:15', status: 'CONFIRMED', notes: 'Encapsulado con flores' },
            { clientId: clients[14].id, serviceId: services[9].id, date: daysFromNow(1), startTime: '11:30', endTime: '12:15', status: 'CONFIRMED' },
            { clientId: clients[3].id, serviceId: services[3].id, date: daysFromNow(3), startTime: '09:00', endTime: '10:30', status: 'PENDING' },
            { clientId: clients[8].id, serviceId: services[0].id, date: daysFromNow(3), startTime: '11:30', endTime: '12:00', status: 'CONFIRMED' },
            { clientId: clients[12].id, serviceId: services[1].id, date: daysFromNow(5), startTime: '10:00', endTime: '10:45', status: 'PENDING' },
            { clientId: clients[9].id, serviceId: services[5].id, date: daysFromNow(5), startTime: '12:00', endTime: '13:00', status: 'CONFIRMED' },
            { clientId: clients[0].id, serviceId: services[3].id, date: daysFromNow(7), startTime: '09:00', endTime: '10:30', status: 'CONFIRMED', notes: 'Acrílicas nuevas - cambio de temporada' },
            { clientId: clients[13].id, serviceId: services[2].id, date: daysFromNow(10), startTime: '14:00', endTime: '15:00', status: 'PENDING' },
        ]

        const appointments = await Promise.all(
            appointmentsData.map((apt) =>
                prisma.appointment.create({
                    data: {
                        ...apt,
                        userId: user.id,
                    },
                })
            )
        )
        console.log(`✅ ${appointments.length} appointments created`)

        // ========================================
        // 5. CREATE CLIENT NOTES
        // ========================================
        console.log('📝 Creating client notes...')
        const notesData = [
            { clientId: clients[0].id, content: 'Prefiere diseños minimalistas y elegantes', type: 'PREFERENCE' },
            { clientId: clients[0].id, content: 'Alergia a acetona - usar removedor sin acetona', type: 'ALERT' },
            { clientId: clients[0].id, content: 'Siempre trae café de la panadería de la esquina 😊', type: 'NOTE' },
            { clientId: clients[1].id, content: 'Siempre quiere cita los viernes por la tarde', type: 'PREFERENCE' },
            { clientId: clients[1].id, content: 'Le gustan los colores oscuros en invierno, claros en verano', type: 'PREFERENCE' },
            { clientId: clients[3].id, content: 'Cliente muy puntual y agradecida', type: 'NOTE' },
            { clientId: clients[3].id, content: 'Le encantan los diseños con piedras y cristales', type: 'PREFERENCE' },
            { clientId: clients[4].id, content: 'Tuvo una mala experiencia en la última visita - seguimiento pendiente', type: 'ALERT' },
            { clientId: clients[5].id, content: 'Interesada en Nail Art para su cumpleaños', type: 'NOTE' },
            { clientId: clients[6].id, content: 'Uñas delicadas - evitar limado excesivo', type: 'ALERT' },
            { clientId: clients[6].id, content: 'Prefiere formas almendrada o coffin', type: 'PREFERENCE' },
            { clientId: clients[7].id, content: 'Canceló última cita por viaje', type: 'NOTE' },
            { clientId: clients[9].id, content: 'Prefiere tonos nude y pastel', type: 'PREFERENCE' },
            { clientId: clients[9].id, content: 'Siempre pide diseño de flores', type: 'PREFERENCE' },
            { clientId: clients[10].id, content: 'Posible reactivación - enviar promoción por WhatsApp', type: 'ALERT' },
            { clientId: clients[12].id, content: 'Viene referida por Ana López', type: 'NOTE' },
            { clientId: clients[12].id, content: 'Muy entusiasta con los diseños complejos', type: 'PREFERENCE' },
            { clientId: clients[14].id, content: 'Trae muchas referencias - posible embajadora', type: 'NOTE' },
            { clientId: clients[14].id, content: 'Prefiere acrílicas con glitter', type: 'PREFERENCE' },
        ]

        const notes = await Promise.all(
            notesData.map((note) =>
                prisma.clientNote.create({ data: note })
            )
        )
        console.log(`✅ ${notes.length} client notes created`)

        // ========================================
        // 6. CREATE AUTOMATION RULES
        // ========================================
        console.log('🤖 Creating automation rules...')
        const automationsData = [
            {
                name: 'Recordatorio 24h',
                description: 'Envía un recordatorio a los clientes 24 horas antes de su cita',
                type: 'REMINDER',
                config: JSON.stringify({ hoursBefore: 24, channel: 'whatsapp', template: 'Hola {nombre}, te recordamos tu cita mañana a las {hora} en CrmNailsAgency Studio 💅' }),
                active: true,
            },
            {
                name: 'Recordatorio 2h',
                description: 'Envía un recordatorio 2 horas antes de la cita',
                type: 'REMINDER',
                config: JSON.stringify({ hoursBefore: 2, channel: 'whatsapp', template: 'Hola {nombre}, tu cita es en 2 horas. ¡Te esperamos! 💅' }),
                active: true,
            },
            {
                name: 'Reactivación Clientes Inactivos',
                description: 'Contacta a clientes que no han visitado en 30+ días con una oferta especial',
                type: 'REACTIVATION',
                config: JSON.stringify({ inactiveDays: 30, channel: 'whatsapp', discount: '15%', template: '¡Te extrañamos {nombre}! 💜 Te ofrecemos un 15% de descuento en tu próxima visita' }),
                active: true,
            },
            {
                name: 'Programa de Fidelidad',
                description: 'Recompensa a clientes frecuentes cada 5 visitas con un servicio gratis',
                type: 'LOYALTY',
                config: JSON.stringify({ visitsThreshold: 5, reward: 'Manicura Clásica gratis', message: '¡Felicidades {nombre}! 🎉 Has completado 5 visitas. Tu próxima Manicura Clásica es gratis' }),
                active: true,
            },
            {
                name: 'Contacto Inteligente',
                description: 'Analiza la frecuencia de visitas y sugiere el momento óptimo para contactar',
                type: 'SMART_CONTACT',
                config: JSON.stringify({ daysBeforeDue: 3, message: 'Hola {nombre}, ya va siendo tiempo de tu próxima visita. ¿Te gustaría agendar?' }),
                active: true,
            },
            {
                name: 'Seguimiento Post-Visita',
                description: 'Envía mensaje de agradecimiento 24h después de la cita',
                type: 'REMINDER',
                config: JSON.stringify({ hoursAfter: 24, channel: 'whatsapp', template: 'Gracias por visitarnos {nombre} 💖 ¿Cómo quedaron tus uñas? ¡Esperamos verte pronto!' }),
                active: false,
            },
        ]

        const automations = await Promise.all(
            automationsData.map((automation) =>
                prisma.automationRule.create({
                    data: { ...automation, userId: user.id },
                })
            )
        )
        console.log(`✅ ${automations.length} automation rules created`)

        // ========================================
        // 7. CREATE AUTOMATION LOGS
        // ========================================
        console.log('📊 Creating automation logs...')
        const logsData = [
            { action: 'REMINDER_SENT', result: 'WhatsApp enviado a Ana López para cita del ' + daysAgo(0), clientId: clients[0].id, ruleId: automations[0].id },
            { action: 'REMINDER_SENT', result: 'WhatsApp enviado a Laura Martínez para cita del ' + daysAgo(0), clientId: clients[2].id, ruleId: automations[0].id },
            { action: 'REMINDER_SENT', result: 'WhatsApp enviado a Sofía Torres para cita del ' + daysAgo(0), clientId: clients[6].id, ruleId: automations[0].id },
            { action: 'REACTIVATION_TRIGGERED', result: 'Mensaje de reactivación enviado a Isabel García (inactiva 60+ días)', clientId: clients[4].id, ruleId: automations[2].id },
            { action: 'REACTIVATION_TRIGGERED', result: 'Mensaje de reactivación enviado a Rosa Hernández (inactiva 45+ días)', clientId: clients[10].id, ruleId: automations[2].id },
            { action: 'LOYALTY_MILESTONE', result: 'Ana López alcanzó 5 visitas - Manicura Clásica gratis aplicada', clientId: clients[0].id, ruleId: automations[3].id },
            { action: 'SMART_CONTACT', result: 'Carmen Rodríguez - sugerir cita (última visita hace 12 días)', clientId: clients[1].id, ruleId: automations[4].id },
            { action: 'REMINDER_SENT', result: 'WhatsApp enviado a Carmen Rodríguez para cita del ' + daysFromNow(1), clientId: clients[1].id, ruleId: automations[0].id },
            { action: 'NO_SHOW_ALERT', result: 'Isabel García no asistió a cita del ' + daysAgo(3), clientId: clients[4].id, ruleId: automations[0].id },
            { action: 'REACTIVATION_FAILED', result: 'No se pudo contactar a Paula Díaz - número sin servicio', clientId: clients[7].id, ruleId: automations[2].id },
        ]

        const logs = await Promise.all(
            logsData.map((log) =>
                prisma.automationLog.create({ data: log })
            )
        )
        console.log(`✅ ${logs.length} automation logs created`)

        // ========================================
        // SUMMARY
        // ========================================
        console.log('')
        console.log('🎉 ═══════════════════════════════════════')
        console.log('🎉  SEED COMPLETED SUCCESSFULLY!')
        console.log('🎉 ═══════════════════════════════════════')
        console.log('')
        console.log('📋 Summary:')
        console.log(`   👤 User:           1`)
        console.log(`   💅 Services:       ${services.length}`)
        console.log(`   👥 Clients:        ${clients.length}`)
        console.log(`   📅 Appointments:   ${appointments.length}`)
        console.log(`   📝 Notes:          ${notes.length}`)
        console.log(`   🤖 Automations:    ${automations.length}`)
        console.log(`   📊 Logs:           ${logs.length}`)
        console.log('')
        console.log('🔑 Demo Credentials:')
        console.log('   Email:    ' + DEMO_EMAIL)
        console.log('   Password: (set via DEMO_PASSWORD env var)')
        console.log('')
        console.log('📊 Client Status Distribution:')
        console.log(`   NEW:       ${clientsData.filter(c => c.status === 'NEW').length}`)
        console.log(`   RECURRING: ${clientsData.filter(c => c.status === 'RECURRING').length}`)
        console.log(`   INACTIVE:  ${clientsData.filter(c => c.status === 'INACTIVE').length}`)
        console.log('')
        console.log('📅 Appointment Status Distribution:')
        console.log(`   COMPLETED: ${appointmentsData.filter(a => a.status === 'COMPLETED').length}`)
        console.log(`   CONFIRMED: ${appointmentsData.filter(a => a.status === 'CONFIRMED').length}`)
        console.log(`   PENDING:   ${appointmentsData.filter(a => a.status === 'PENDING').length}`)
        console.log(`   NO_SHOW:   ${appointmentsData.filter(a => a.status === 'NO_SHOW').length}`)
        console.log(`   CANCELLED: ${appointmentsData.filter(a => a.status === 'CANCELLED').length}`)
        console.log('')

    } catch (error) {
        console.error('❌ Seed failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
