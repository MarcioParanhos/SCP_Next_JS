// Script para listar colunas da tabela `carencias` via consulta ao information_schema
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'carencias'
    ORDER BY ordinal_position;
  `);
  console.log(JSON.stringify(res, null, 2));
}

main()
  .catch((e) => { console.error('Erro:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
