import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = [
    { name: 'User', model: prisma.user },
    { name: 'Client', model: prisma.client },
    { name: 'Service', model: prisma.service },
    { name: 'Appointment', model: prisma.appointment },
    { name: 'ClientNote', model: prisma.clientNote },
    { name: 'AutomationRule', model: prisma.automationRule },
    { name: 'AutomationLog', model: prisma.automationLog },
  ];

  console.log('📊 Validating Database Records:');
  console.log('---------------------------------');

  for (const table of tables) {
    const count = await (table.model as any).count();
    console.log(`${table.name.padEnd(15)}: ${count} records`);
  }
  console.log('---------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
