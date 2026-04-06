import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const areas = [
  { code: 'AREA_TECNICA', name: 'ÁREA TÉCNICA' },
  { code: 'CIENCIAS_NATUREZA', name: 'CIÊNCIAS DA NATUREZA E SUAS TECNOLOGIAS' },
  { code: 'CIENCIAS_HUMANAS', name: 'CIÊNCIAS HUMANAS E SUAS TECNOLOGIAS' },
  { code: 'EDUCACAO_ESPECIAL', name: 'EDUCAÇÃO ESPECIAL' },
  { code: 'APOIO_EDUC_ESPECIAL', name: 'APÓIO A EDUC. ESPECIAL' }
];

async function main() {
  for (const a of areas) {
    const r = await prisma.area.upsert({
      where: { code: a.code },
      update: { name: a.name, active: true },
      create: a
    });
    console.log('Upserted area:', r.code);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
