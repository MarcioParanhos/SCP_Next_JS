import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// Rota API: POST /api/servidores/import
// ============================================================
// Importa servidores em massa a partir de um array de registros.
//
// Parâmetros do body (JSON):
//   rows:   array de servidores { name, cpf, enrollment, bond_type, work_schedule }
//   dryRun: boolean — quando true, apenas verifica duplicatas (sem salvar nada)
//
// Resposta quando dryRun=true:
//   { duplicateCpfs: string[] }
//   — lista de CPFs que já existem no banco e seriam ignorados na importação
//
// Resposta quando dryRun=false:
//   { created: ServidorRow[], skippedCount: number }
//   — registros criados e quantidade de registros ignorados (duplicatas)

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extrai o array de linhas e o flag de modo preview
    const rows: {
      name: string;
      cpf: string;
      enrollment: string;
      bond_type: string;
      work_schedule: string;
    }[] = Array.isArray(body.rows) ? body.rows : [];

    const dryRun: boolean = body.dryRun === true;

    // Nenhuma linha enviada: retorna resposta vazia imediatamente
    if (rows.length === 0) {
      return NextResponse.json(
        dryRun ? { duplicateKeys: [] } : { created: [], skippedCount: 0 }
      );
    }

    // Normaliza e filtra CPFs vazios antes de consultar o banco
    const cpfs = rows.map((r) => r.cpf?.trim()).filter(Boolean);

    // Busca todos os registros que tenham um dos CPFs do arquivo.
    // Um mesmo CPF pode ter múltiplas matrículas (mesmo servidor, vínculos diferentes),
    // por isso a duplicata é verificada pela combinação CPF + matrícula.
    const existing = await prisma.employee.findMany({
      where: { cpf: { in: cpfs } },
      select: { cpf: true, enrollment: true },
    });

    // Chave composta "cpf|enrollment" para identificar duplicatas com precisão
    const existingKeySet = new Set(
      existing.map((e) => `${e.cpf}|${e.enrollment}`)
    );

    // Função auxiliar: gera a chave composta de uma linha do CSV
    const rowKey = (r: { cpf: string; enrollment: string }) =>
      `${r.cpf.trim()}|${(r.enrollment?.trim() || "PENDING")}`;

    // ----------------------------------------------------------------
    // Modo verificação (dryRun=true): retorna as chaves duplicadas
    // sem fazer nenhuma alteração no banco de dados
    // ----------------------------------------------------------------
    if (dryRun) {
      const duplicateKeys = rows
        .filter((r) => r.cpf?.trim() && existingKeySet.has(rowKey(r)))
        .map((r) => rowKey(r));
      return NextResponse.json({ duplicateKeys });
    }

    // ----------------------------------------------------------------
    // Modo importação: separa os registros novos dos duplicados
    // ----------------------------------------------------------------
    const toCreate = rows.filter(
      (r) => r.cpf?.trim() && !existingKeySet.has(rowKey(r))
    );
    const skippedCount = rows.length - toCreate.length;

    // Nenhum registro novo para criar
    if (toCreate.length === 0) {
      return NextResponse.json({ created: [], skippedCount });
    }

    // Inserção em lote com createMany (muito mais eficiente que creates individuais)
    // skipDuplicates=true como segurança extra contra condições de corrida
    await prisma.employee.createMany({
      data: toCreate.map((r) => ({
        name: r.name.trim(),
        cpf: r.cpf.trim(),
        enrollment: r.enrollment?.trim() || "PENDING",
        bond_type: r.bond_type.trim().toUpperCase(),
        work_schedule: r.work_schedule.trim().toUpperCase(),
      })),
      skipDuplicates: true,
    });

    // Busca os registros recém-criados para retornar ao frontend
    // (createMany não retorna os dados criados no PostgreSQL)
    const created = await prisma.employee.findMany({
      where: { cpf: { in: toCreate.map((r) => r.cpf.trim()) } },
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        cpf: true,
        enrollment: true,
        bond_type: true,
        work_schedule: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      // Serializa as datas para string ISO antes de enviar ao cliente
      created: created.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
      skippedCount,
    });
  } catch (err) {
    console.error("Error in POST /api/servidores/import:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
