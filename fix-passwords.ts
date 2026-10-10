import bcrypt from 'bcrypt';
import { prisma } from './lib/prisma';

async function updatePasswords() {
  const hash = await bcrypt.hash('Password@123', 10);
  console.log("New Hash for Password@123:", hash);

  await prisma.user.updateMany({
    where: {
      email: {
        in: ['organizer1@eventhub.com', 'organizer2@eventhub.com', 'attendee1@eventhub.com', 'attendee2@eventhub.com', 'attendee3@eventhub.com']
      }
    },
    data: {
      passwordHash: hash
    }
  });
  console.log("Passwords updated successfully.");
}

updatePasswords().catch(console.error).finally(() => prisma.$disconnect());
