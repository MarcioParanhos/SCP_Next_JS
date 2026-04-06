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

  // --- Inserir motivos de carência iniciais ---
  const motives = [
    { code: 'SUBSTITUICAO', description: 'Substituição de docente', type: 'REAL' },
    { code: 'AUMENTO_CARGA', description: 'Aumento de carga', type: 'REAL' },
    { code: 'AFASTAMENTO', description: 'Afastamento', type: 'REAL' },
    { code: 'LICENCA', description: 'Licença', type: 'TEMPORARY' },
    { code: 'LICENCA_MEDICA', description: 'Licença médica', type: 'TEMPORARY' }
  ];

  for (const m of motives) {
    const found = await prisma.motive.findFirst({ where: { code: m.code } });
    if (!found) {
      const created = await prisma.motive.create({ data: { code: m.code, description: m.description, type: m.type } });
      console.log('Created motive:', created.code);
    } else {
      console.log('Motive exists:', found.code);
    }
  }
}

main()
  .catch((e)=>{ console.error(e); process.exit(1); })
  .finally(()=> prisma.$disconnect());
