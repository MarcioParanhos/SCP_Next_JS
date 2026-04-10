// Lista os registros recentes da tabela `carencias` e mostra o campo `type`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const rows = await prisma.carencia.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, type: true, school_unit_id: true, total: true, morning: true, afternoon: true, night: true, createdAt: true }
  });
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
