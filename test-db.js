const { PrismaClient } = require('./lib/generated/prisma'); 
const prisma = new PrismaClient(); 
prisma.user.findFirst()
  .then(u => { 
    console.log('Successfully found user:', u ? u.email : 'None');
    console.log('upiQrUrl field exists:', 'upiQrUrl' in (u || { upiQrUrl: null })); 
    return prisma.$disconnect(); 
  })
  .catch(e => { 
    console.error('Error:', e); 
    process.exit(1); 
  });
