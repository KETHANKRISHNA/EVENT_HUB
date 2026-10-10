import { PrismaClient, Role, EventStatus, SeatStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.payment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.seatHold.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@eventhub.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // Organizers
  const organizer1 = await prisma.user.create({
    data: {
      name: 'Organizer One',
      email: 'organizer1@eventhub.com',
      passwordHash,
      role: Role.ORGANIZER,
    },
  });

  const organizer2 = await prisma.user.create({
    data: {
      name: 'Organizer Two',
      email: 'organizer2@eventhub.com',
      passwordHash,
      role: Role.ORGANIZER,
    },
  });

  // Attendees
  const attendee1 = await prisma.user.create({
    data: {
      name: 'Attendee One',
      email: 'attendee1@eventhub.com',
      passwordHash,
      role: Role.ATTENDEE,
    },
  });

  const attendee2 = await prisma.user.create({
    data: {
      name: 'Attendee Two',
      email: 'attendee2@eventhub.com',
      passwordHash,
      role: Role.ATTENDEE,
    },
  });

  const attendee3 = await prisma.user.create({
    data: {
      name: 'Attendee Three',
      email: 'attendee3@eventhub.com',
      passwordHash,
      role: Role.ATTENDEE,
    },
  });

  console.log('Seeding events...');

  // Event 1: Tech Conference (With seating)
  const event1 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Global Tech Conference 2024',
      description: 'The biggest tech conference of the year.',
      category: 'Technology',
      city: 'Bangalore',
      venueName: 'Tech Park Convention Center',
      address: '123 Tech Avenue',
      startsAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      endsAt: new Date(new Date().setMonth(new Date().getMonth() + 1, new Date().getDate() + 2)),
      status: EventStatus.PUBLISHED,
      hasSeating: true,
    },
  });

  const e1TicketType = await prisma.ticketType.create({
    data: {
      eventId: event1.id,
      name: 'VIP Pass',
      pricePaise: 500000, // 5000 INR
      quantity: 50,
      saleStart: new Date(),
      saleEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    },
  });

  for (let i = 1; i <= 10; i++) {
    await prisma.seat.create({
      data: {
        eventId: event1.id,
        ticketTypeId: e1TicketType.id,
        row: 'A',
        number: i,
        label: `A${i}`,
      },
    });
  }

  // Event 2: Music Festival (No seating)
  const event2 = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Summer Music Fest',
      description: 'Outdoor music festival featuring top artists.',
      category: 'Music',
      city: 'Mumbai',
      venueName: 'Open Air Arena',
      address: '456 Beach Road',
      startsAt: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      endsAt: new Date(new Date().setMonth(new Date().getMonth() + 2, new Date().getDate() + 1)),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event2.id,
      name: 'General Admission',
      pricePaise: 200000, // 2000 INR
      quantity: 500,
      saleStart: new Date(),
      saleEnd: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    },
  });

  // Event 3: Startup Pitch Night
  const event3 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Startup Pitch Night',
      description: 'Watch promising startups pitch their ideas.',
      category: 'Business',
      city: 'Delhi',
      venueName: 'Innovation Hub',
      address: '789 Startup Street',
      startsAt: new Date(new Date().setDate(new Date().getDate() + 10)),
      endsAt: new Date(new Date().setDate(new Date().getDate() + 10)),
      status: EventStatus.PUBLISHED,
      hasSeating: true,
    },
  });

  const e3TicketType = await prisma.ticketType.create({
    data: {
      eventId: event3.id,
      name: 'Standard Seat',
      pricePaise: 50000, // 500 INR
      quantity: 100,
      saleStart: new Date(),
      saleEnd: new Date(new Date().setDate(new Date().getDate() + 10)),
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.seat.create({
      data: {
        eventId: event3.id,
        ticketTypeId: e3TicketType.id,
        row: 'B',
        number: i,
        label: `B${i}`,
      },
    });
  }

  // Event 4: Local Art Workshop (Draft)
  await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Watercolor Painting Workshop',
      description: 'Learn watercolor basics.',
      category: 'Arts',
      city: 'Pune',
      venueName: 'Creative Studio',
      address: '321 Art Lane',
      startsAt: new Date(new Date().setDate(new Date().getDate() + 20)),
      endsAt: new Date(new Date().setDate(new Date().getDate() + 20)),
      status: EventStatus.DRAFT,
      hasSeating: false,
    },
  });

  // Event 5: Marathon 2024
  const event5 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'City Marathon 2024',
      description: 'Annual city marathon event.',
      category: 'Sports',
      city: 'Chennai',
      venueName: 'Marina Beach Start',
      address: 'Marina Beach Road',
      startsAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      endsAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event5.id,
      name: 'Runner Registration',
      pricePaise: 150000,
      quantity: 1000,
      saleStart: new Date(),
      saleEnd: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    },
  });

  // Event 6: Comedy Club Night
  const event6 = await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Standup Comedy Special',
      description: 'A night of laughs with top comedians.',
      category: 'Entertainment',
      city: 'Hyderabad',
      venueName: 'Laugh Lounge',
      address: '555 Joke St',
      startsAt: new Date(new Date().setDate(new Date().getDate() + 5)),
      endsAt: new Date(new Date().setDate(new Date().getDate() + 5)),
      status: EventStatus.PUBLISHED,
      hasSeating: true,
    },
  });

  const e6TicketType = await prisma.ticketType.create({
    data: {
      eventId: event6.id,
      name: 'Table Seating',
      pricePaise: 80000,
      quantity: 50,
      saleStart: new Date(),
      saleEnd: new Date(new Date().setDate(new Date().getDate() + 5)),
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.seat.create({
      data: {
        eventId: event6.id,
        ticketTypeId: e6TicketType.id,
        row: 'T1',
        number: i,
        label: `T1-${i}`,
      },
    });
  }

  // Event 7: Food Truck Festival
  const event7 = await prisma.event.create({
    data: {
      organizerId: organizer1.id,
      title: 'Street Food Festival',
      description: 'Taste food from around the world.',
      category: 'Food',
      city: 'Kolkata',
      venueName: 'City Park',
      address: 'Central Park Square',
      startsAt: new Date(new Date().setDate(new Date().getDate() + 15)),
      endsAt: new Date(new Date().setDate(new Date().getDate() + 16)),
      status: EventStatus.PUBLISHED,
      hasSeating: false,
    },
  });

  await prisma.ticketType.create({
    data: {
      eventId: event7.id,
      name: 'Entry Pass',
      pricePaise: 10000,
      quantity: 2000,
      saleStart: new Date(),
      saleEnd: new Date(new Date().setDate(new Date().getDate() + 15)),
    },
  });

  // Event 8: Cancelled Conference
  await prisma.event.create({
    data: {
      organizerId: organizer2.id,
      title: 'Crypto Summit 2024',
      description: 'Web3 and Crypto summit.',
      category: 'Technology',
      city: 'Bangalore',
      venueName: 'Grand Hotel',
      address: '1 Luxury Ave',
      startsAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      endsAt: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: EventStatus.CANCELLED,
      hasSeating: true,
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
