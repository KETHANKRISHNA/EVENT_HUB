import 'dotenv/config';
import { PrismaClient, Role, EventStatus, SeatStatus } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! })
});

async function main() {
  console.log('Seeding users safely with upsert...');

  // Manager
  const managerPasswordHash = "$2b$10$BKQcFhE6hZ2ZxEgurBMviOTJBfmuBLLjpxAkvoF8JTzM6d2lJTXTm"; // Hash for 'Manager@123'
  await prisma.user.upsert({
    where: { email: 'manager@eventhub.com' },
    update: {
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
    },
    create: {
      name: 'EventHub Manager',
      email: 'manager@eventhub.com',
      role: Role.MANAGER,
      passwordHash: managerPasswordHash,
      onboarded: true,
    },
  });

  // Organizers
  const organizerPasswordHash = "$2b$10$O.jdyWemw3gKPvNUE3KyUOdhygMTTH8WrmKWkpmloZle8cw6RTr9O"; // Hash for 'Password@123'
  
  const organizer1 = await prisma.user.upsert({
    where: { email: 'organizer1@eventhub.com' },
    update: { passwordHash: organizerPasswordHash },
    create: {
      name: 'Creative Live',
      email: 'organizer1@eventhub.com',
      role: Role.ORGANIZER,
      passwordHash: organizerPasswordHash,
      onboarded: true,
    },
  });

  const organizer2 = await prisma.user.upsert({
    where: { email: 'organizer2@eventhub.com' },
    update: { passwordHash: organizerPasswordHash },
    create: {
      name: 'Tech Events India',
      email: 'organizer2@eventhub.com',
      role: Role.ORGANIZER,
      passwordHash: organizerPasswordHash,
      onboarded: true,
    },
  });

  // Attendees
  const attendeePasswordHash = "$2b$10$O.jdyWemw3gKPvNUE3KyUOdhygMTTH8WrmKWkpmloZle8cw6RTr9O"; // Hash for 'Password@123'
  const attendees = [];
  for (let i = 1; i <= 3; i++) {
    const email = `attendee${i}@eventhub.com`;
    attendees.push(
      await prisma.user.upsert({
        where: { email },
        update: { passwordHash: attendeePasswordHash },
        create: {
          name: `Attendee ${i}`,
          passwordHash: attendeePasswordHash,
          email,
          role: Role.ATTENDEE,
          onboarded: true,
        },
      })
    );
  }

  console.log('Seeding events, ticket types, and seats...');

  const now = new Date();

  // Helper to generate dates
  const futureDate = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // 1. Tech Conference (Seated, Paid)
  const event1 = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Global Tech Conference 2026',
      description: 'The biggest AI and Web3 conference in India. Join industry leaders for two days of insights.',
      category: 'Technology',
      city: 'Bangalore',
      venueName: 'BIEC Convention Center',
      address: '10th Mile, Tumkur Road',
      startsAt: futureDate(15),
      endsAt: futureDate(16),
      status: EventStatus.PUBLISHED,
      hasSeating: true,
    },
  });

  const e1VipTicket = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: 'VIP Pass',
      pricePaise: 800000, // 8000 INR
      quantity: 20,
      saleStart: now,
      saleEnd: futureDate(15),
    },
  });

  const e1GenTicket = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: 'General Admission',
      pricePaise: 300000, // 3000 INR
      quantity: 60,
      saleStart: now,
      saleEnd: futureDate(15),
    },
  });

  // Layout: 8 rows x 10 seats
  for (let row = 0; row < 8; row++) {
    const rowLetter = String.fromCharCode(65 + row); // A to H
    const ticketTypeId = row < 2 ? e1VipTicket.id : e1GenTicket.id; // Rows A & B are VIP
    for (let num = 1; num <= 10; num++) {
      await prisma.seat.create({
        data: {
          eventId: event1.id,
          ticketTypeId,
          row: rowLetter,
          number: num,
          label: `${rowLetter}${num}`,
        },
      });
    }
  }

  // 2. Music Festival (Standing, Paid)
  const event2 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Sunburn Arena',
      description: 'An unforgettable night of EDM under the stars.',
      category: 'Music',
      city: 'Mumbai',
      venueName: 'MMRDA Grounds',
      address: 'Bandra Kurla Complex',
      startsAt: futureDate(45),
      endsAt: futureDate(45),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event2.id,
      name: 'Fan Pit (VIP)',
      pricePaise: 500000, // 5000 INR
      quantity: 500,
      saleStart: now,
      saleEnd: futureDate(45),
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event2.id,
      name: 'General Access',
      pricePaise: 150000, // 1500 INR
      quantity: 5000,
      saleStart: now,
      saleEnd: futureDate(45),
    },
  });

  // 3. Standup Comedy (Seated, Paid)
  const event3 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Laugh Riot: Live Comedy Special',
      description: 'A hilarious evening with top Indian comedians.',
      category: 'Entertainment',
      city: 'Delhi',
      venueName: 'Siri Fort Auditorium',
      address: 'August Kranti Marg',
      startsAt: futureDate(25),
      endsAt: futureDate(25),
      status: EventStatus.PUBLISHED,
      hasSeating: true,
    },
  });

  const e3FrontTicket = await prisma.ticketType.create({
    data: {
      eventId: event3.id,
      name: 'Front Row',
      pricePaise: 250000, // 2500 INR
      quantity: 16,
      saleStart: now,
      saleEnd: futureDate(25),
    },
  });

  const e3BalconyTicket = await prisma.ticketType.create({
    data: {
      eventId: event3.id,
      name: 'Balcony / General',
      pricePaise: 99900, // 999 INR
      quantity: 48,
      saleStart: now,
      saleEnd: futureDate(25),
    },
  });

  // Layout: 8 rows x 8 seats
  for (let row = 0; row < 8; row++) {
    const rowLetter = String.fromCharCode(65 + row);
    const ticketTypeId = row < 2 ? e3FrontTicket.id : e3BalconyTicket.id;
    for (let num = 1; num <= 8; num++) {
      await prisma.seat.create({
        data: {
          eventId: event3.id,
          ticketTypeId,
          row: rowLetter,
          number: num,
          label: `${rowLetter}${num}`,
        },
      });
    }
  }

  // 4. Local Art Exhibition (Standing, FREE)
  const event4 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Modern Art Canvas Exhibition',
      description: 'Explore the modern art space. Free entry for all art enthusiasts.',
      category: 'Arts',
      city: 'Pune',
      venueName: 'Creative Art Gallery',
      address: 'Koregaon Park',
      startsAt: futureDate(30),
      endsAt: futureDate(33),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event4.id,
      name: 'RSVP (Free Entry)',
      pricePaise: 0, // FREE
      quantity: 300,
      saleStart: now,
      saleEnd: futureDate(30),
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event4.id,
      name: 'VIP Artist Meet',
      pricePaise: 0, // FREE
      quantity: 20,
      saleStart: now,
      saleEnd: futureDate(30),
    },
  });

  // 5. City Marathon (Standing, Paid)
  const event5 = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Chennai Coastal Marathon',
      description: 'Run along the beautiful coastline of Chennai.',
      category: 'Sports',
      city: 'Chennai',
      venueName: 'Marina Beach Starting Point',
      address: 'Kamarajar Salai',
      startsAt: futureDate(60),
      endsAt: futureDate(60),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event5.id,
      name: 'Full Marathon (42K)',
      pricePaise: 200000, // 2000 INR
      quantity: 1000,
      saleStart: now,
      saleEnd: futureDate(55),
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event5.id,
      name: 'Half Marathon (21K)',
      pricePaise: 120000, // 1200 INR
      quantity: 2000,
      saleStart: now,
      saleEnd: futureDate(55),
    },
  });

  // 6. Theatre Play (Seated, Paid, DRAFT status)
  const event6 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'The Grand Illusion (Draft)',
      description: 'An immersive theatrical experience coming soon.',
      category: 'Arts',
      city: 'Kolkata',
      venueName: 'Academy of Fine Arts',
      address: 'Cathedral Road',
      startsAt: futureDate(80),
      endsAt: futureDate(80),
      status: EventStatus.DRAFT,
      hasSeating: true,
    },
  });

  const e6VipTicket = await prisma.ticketType.create({
    data: {
      eventId: event6.id,
      name: 'Premium',
      pricePaise: 150000,
      quantity: 20,
      saleStart: futureDate(10),
      saleEnd: futureDate(80),
    },
  });

  const e6GenTicket = await prisma.ticketType.create({
    data: {
      eventId: event6.id,
      name: 'Standard',
      pricePaise: 50000,
      quantity: 80,
      saleStart: futureDate(10),
      saleEnd: futureDate(80),
    },
  });

  // Layout: 10 rows x 10 seats
  for (let row = 0; row < 10; row++) {
    const rowLetter = String.fromCharCode(65 + row);
    const ticketTypeId = row < 2 ? e6VipTicket.id : e6GenTicket.id;
    for (let num = 1; num <= 10; num++) {
      await prisma.seat.create({
        data: {
          eventId: event6.id,
          ticketTypeId,
          row: rowLetter,
          number: num,
          label: `${rowLetter}${num}`,
        },
      });
    }
  }

  // 7. Food & Wine Festival (Standing, Paid)
  const event7 = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Hyderabad Gastronomy Fest',
      description: 'A weekend of the finest culinary experiences.',
      category: 'Food',
      city: 'Hyderabad',
      venueName: 'Hitex Exhibition Center',
      address: 'Izzat Nagar',
      startsAt: futureDate(70),
      endsAt: futureDate(72),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event7.id,
      name: 'Weekend Pass (3 Days)',
      pricePaise: 350000, // 3500 INR
      quantity: 1000,
      saleStart: now,
      saleEnd: futureDate(70),
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event7.id,
      name: 'Single Day Pass',
      pricePaise: 150000, // 1500 INR
      quantity: 3000,
      saleStart: now,
      saleEnd: futureDate(70),
    },
  });

  // 8. Cancelled Event (Standing, Paid)
  const event8 = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Crypto & Web3 Summit (Cancelled)',
      description: 'Unfortunately, this event has been cancelled.',
      category: 'Technology',
      city: 'Gurgaon',
      venueName: 'Cyber Hub Grounds',
      address: 'DLF Phase 2',
      startsAt: futureDate(5),
      endsAt: futureDate(6),
      status: EventStatus.CANCELLED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event8.id,
      name: 'General Admission',
      pricePaise: 100000,
      quantity: 500,
      saleStart: now,
      saleEnd: futureDate(5),
    },
  });
  
  await prisma.ticketType.create({
    data: {
      eventId: event8.id,
      name: 'VIP Maker Pass',
      pricePaise: 500000,
      quantity: 50,
      saleStart: now,
      saleEnd: futureDate(5),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
