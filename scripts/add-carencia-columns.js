// Script para adicionar colunas de turnos na tabela `carencias`.
// Executar apenas uma vez; mantém comentários em português para manutenção.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Adiciona colunas se não existirem (compatível com PostgreSQL)
  await prisma.$executeRawUnsafe(`ALTER TABLE "carencias" ADD COLUMN IF NOT EXISTS "morning" INTEGER NOT NULL DEFAULT 0`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "carencias" ADD COLUMN IF NOT EXISTS "afternoon" INTEGER NOT NULL DEFAULT 0`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "carencias" ADD COLUMN IF NOT EXISTS "night" INTEGER NOT NULL DEFAULT 0`);
  console.log('Colunas adicionadas (ou já existentes): morning, afternoon, night');
}

main()
  .catch((e) => { console.error('Erro ao adicionar colunas:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
