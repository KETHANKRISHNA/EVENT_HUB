import { prisma } from './lib/prisma';
import bcrypt from 'bcrypt';

async function check() {
  const email = 'organizer1@eventhub.com'.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log("User not found!");
  } else {
    console.log("User found:", user.email, user.role);
    const match = await bcrypt.compare('Password@123', user.passwordHash || '');
    console.log("Password match:", match);
  }
  
  const manager = await prisma.user.findUnique({ where: { email: 'manager@eventhub.com' } });
  if (!manager) {
    console.log("Manager not found!");
  } else {
    console.log("Manager found:", manager.email, manager.role);
    const managerMatch = await bcrypt.compare('Manager@123', manager.passwordHash || '');
    console.log("Manager password match:", managerMatch);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
