import { prisma } from './lib/prisma';

async function main() {
  const organizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' }});
  
  if (!organizer) {
    console.log("No organizer found.");
    return;
  }

  try {
    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'A test event description with at least 10 chars',
        category: 'Music',
        city: 'Hyderabad',
        venueName: 'Uppal',
        address: 'uppal stadium',
        startsAt: new Date(Date.now() + 86400000),
        endsAt: new Date(Date.now() + 2 * 86400000),
        bannerUrl: '',
        hasSeating: false,
        organizerId: organizer.id,
        status: 'DRAFT'
      }
    });
    console.log("SUCCESS:", event.id);
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  }
}

main();
