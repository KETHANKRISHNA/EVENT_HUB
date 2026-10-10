import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
});

async function main() {
  const userCount = await prisma.user.count();
  const eventCount = await prisma.event.count();
  const ticketTypeCount = await prisma.ticketType.count();
  const seatCount = await prisma.seat.count();

  console.log(`Users: ${userCount}`);
  console.log(`Events: ${eventCount}`);
  console.log(`TicketTypes: ${ticketTypeCount}`);
  console.log(`Seats: ${seatCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
