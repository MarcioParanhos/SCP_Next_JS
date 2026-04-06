// Script de seed para popular os motivos de carencia no banco.
// Separa os motivos por tipo: REAL (carencia real) e TEMPORARY (carencia temporaria).
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const motives = [
  { code: 'SUBSTITUICAO',  description: 'Substituição de docente',  type: 'REAL'      },
  { code: 'AUMENTO_CARGA', description: 'Aumento de carga',         type: 'REAL'      },
  { code: 'AFASTAMENTO',   description: 'Afastamento',              type: 'REAL'      },
  { code: 'LICENCA',       description: 'Licença',                  type: 'TEMPORARY' },
  { code: 'LICENCA_MEDICA',description: 'Licença médica',           type: 'TEMPORARY' },
];

async function main() {
  for (const m of motives) {
    const result = await prisma.motive.upsert({
      where:  { code: m.code },
      update: {},
      create: m,
    });
    console.log(`Motive upserted: ${result.code} (${result.type})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
