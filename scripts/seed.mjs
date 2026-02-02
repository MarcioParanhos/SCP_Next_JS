import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  const email = process.env.SEED_EMAIL || 'marciodev.paranhos@gmail.com';
  const plain = process.env.SEED_PASSWORD || '550012589';
  const hash = await bcrypt.hash(plain, 10);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log('User already exists:', email);
    process.exit(0);
  }

  const user = await prisma.user.create({ data: { email, password: hash, name: 'Admin' } });
  console.log('Created user:', user.email);

  // --- Inserir tipologias básicas se ainda não existirem ---
  const tipologias = ['SEDE', 'ANEXO', 'CEMIT'];
  for (const nome of tipologias) {
    const found = await prisma.typology.findFirst({ where: { name: nome } });
    if (!found) {
      const created = await prisma.typology.create({ data: { name: nome } });
      console.log('Created typology:', created.name);
    } else {
      console.log('Typology exists:', found.name);
    }
  }
}

main()
  .catch((e)=>{ console.error(e); process.exit(1); })
  .finally(()=> prisma.$disconnect());
