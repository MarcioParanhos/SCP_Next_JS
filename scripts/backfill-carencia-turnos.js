// Backfill: agrega os turnos por carencia a partir de carencia_rows
// e atualiza as colunas morning/afternoon/night/total na tabela carencias.
// Comentários em português para facilitar manutenção futura.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando backfill de turnos para carencias...');
  // Agrupa somando por carencia_id
  const sums = await prisma.$queryRawUnsafe(`
    SELECT carencia_id, COALESCE(SUM(morning),0) as morning_sum, COALESCE(SUM(afternoon),0) as afternoon_sum, COALESCE(SUM(night),0) as night_sum
    FROM carencia_rows
    GROUP BY carencia_id
  `);

  console.log('Grupos encontrados:', sums.length);
  for (const row of sums) {
    const carenciaId = Number(row.carencia_id);
    const morning = Number(row.morning_sum || 0);
    const afternoon = Number(row.afternoon_sum || 0);
    const night = Number(row.night_sum || 0);
    const total = morning + afternoon + night;

    await prisma.carencia.update({
      where: { id: carenciaId },
      data: { morning, afternoon, night, total },
    });

    console.log(`Atualizado carencia ${carenciaId}: morning=${morning} afternoon=${afternoon} night=${night} total=${total}`);
  }

  console.log('Backfill concluído.');
}

main().catch((e) => { console.error('Erro no backfill:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
