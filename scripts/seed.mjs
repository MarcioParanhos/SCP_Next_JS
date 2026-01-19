import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  const email = process.env.SEED_EMAIL || 'admin@example.com';
  const plain = process.env.SEED_PASSWORD || 'changeme';
  const hash = await bcrypt.hash(plain, 10);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log('User already exists:', email);
    process.exit(0);
  }

  const user = await prisma.user.create({ data: { email, password: hash, name: 'Admin' } });
  console.log('Created user:', user.email);
}

main()
  .catch((e)=>{ console.error(e); process.exit(1); })
  .finally(()=> prisma.$disconnect());
