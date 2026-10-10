import "dotenv/config"
import { prisma } from "./lib/prisma"

async function main() {
  console.log("Fixing ADMIN users...")
  const result = await prisma.$executeRaw`UPDATE "User" SET role = 'ATTENDEE' WHERE role = 'ADMIN'`
  console.log("Fixed users:", result)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
