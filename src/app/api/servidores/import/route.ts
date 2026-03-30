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
    // Lê o corpo da requisição (JSON enviado pelo frontend)
    // Esperamos algo como: { rows: [...], dryRun: boolean }
    const body = await req.json();

    // Extrai o array de linhas e o flag de modo preview
    // Cada `row` representa uma linha do CSV já transformada em objeto
    const rows: {
      name: string;
      cpf: string;
      enrollment: string;
      bond_type: string;
      work_schedule: string;
    }[] = Array.isArray(body.rows) ? body.rows : [];

    const dryRun: boolean = body.dryRun === true;

    // Se não houver linhas, respondemos rápido com o shape esperado pelo frontend
    // (diferente dependendo se é dryRun ou import real)
    if (rows.length === 0) {
      return NextResponse.json(
        dryRun ? { duplicateKeys: [] } : { created: [], skippedCount: 0 }
      );
    }

    // Normaliza e filtra CPFs vazios antes de consultar o banco
    // Fazemos trim() para remover espaços e ignoramos entradas sem CPF
    const cpfs = rows.map((r) => r.cpf?.trim()).filter(Boolean);

    // Busca todos os registros que tenham um dos CPFs do arquivo.
    // Observação: um mesmo CPF pode ter várias matrículas, então não basta
    // verificar apenas o CPF — precisamos da combinação CPF+matrícula.
    const existing = await prisma.employee.findMany({
      where: { cpf: { in: cpfs } },
      select: { cpf: true, enrollment: true },
    });

    // Além disso, consulte matrículas que já existem no banco (independentemente do CPF)
    // para evitar que duas pessoas tenham a mesma matrícula.
    const enrollments = rows.map((r) => r.enrollment?.trim()).filter(Boolean) as string[];
    const existingEnrollments =
      enrollments.length > 0
        ? new Set(
            (await prisma.employee.findMany({
              where: { enrollment: { in: enrollments } },
              select: { enrollment: true },
            }))
              .map((e) => e.enrollment)
          )
        : new Set<string>();

    // Construímos um Set com chaves compostas no formato "CPF|MATRICULA"
    // para buscar duplicatas em O(1). Isso evita criar novamente vínculos
    // que já existem para um mesmo CPF com a mesma matrícula.
    const existingKeySet = new Set(
      existing.map((e) => `${e.cpf}|${e.enrollment}`)
    );

    // Função auxiliar: gera a chave composta de uma linha do CSV
    // Garante trim() e usa "PENDING" quando matrícula estiver ausente
    const rowKey = (r: { cpf: string; enrollment: string }) =>
      `${r.cpf.trim()}|${(r.enrollment?.trim() || "PENDING")}`;

    // Normaliza o regime de trabalho:
    // - Remove espaços, converte para maiúsculas
    // - Se o valor for apenas números (ex: "40"), adiciona "H" → "40H"
    // - Se estiver vazio, devolve "UNKNOWN" como fallback
    const normalizeWorkSchedule = (s?: string) => {
      const v = (s ?? "").trim().toUpperCase();
      if (!v) return "UNKNOWN";
      if (/^\d+$/.test(v)) return `${v}H`;
      return v;
    };

    // ----------------------------------------------------------------
    // Modo verificação (dryRun=true): retorna as chaves duplicadas
    // sem fazer nenhuma alteração no banco de dados
    // ----------------------------------------------------------------
    // --- Modo verificação (dryRun) ---
    // Apenas retornamos as chaves que já existem no banco, sem inserir nada.
    if (dryRun) {
      const duplicateKeys = rows
        .filter((r) => r.cpf?.trim() && existingKeySet.has(rowKey(r)))
        .map((r) => rowKey(r));
      const duplicateEnrollments = rows
        .map((r) => r.enrollment?.trim())
        .filter(Boolean)
        .filter((e) => existingEnrollments.has(e as string));
      return NextResponse.json({ duplicateKeys, duplicateEnrollments });
    }

    // ----------------------------------------------------------------
    // Modo importação: separa os registros novos dos duplicados
    // ----------------------------------------------------------------
    // Filtra apenas as linhas novas que não estão na existingKeySet
    // Exclui linhas que já existem por CPF+enrollment ou cujo enrollment já existe
    const toCreate = rows.filter((r) => {
      if (!r.cpf?.trim()) return false;
      const key = rowKey(r);
      const enrollmentVal = r.enrollment?.trim() || "PENDING";
      if (existingKeySet.has(key)) return false;
      if (enrollmentVal && enrollmentVal !== "PENDING" && existingEnrollments.has(enrollmentVal)) return false;
      return true;
    });
    // Quantas linhas foram ignoradas por serem duplicatas
    const skippedCount = rows.length - toCreate.length;

    // Nenhum registro novo para criar
    if (toCreate.length === 0) {
      return NextResponse.json({ created: [], skippedCount });
    }

    // Inserção em lote: mapeamos cada linha para o shape do banco,
    // aplicando normalizações (trim, uppercase, regime com 'H').
    // O `skipDuplicates: true` no createMany é uma camada extra de segurança
    // para evitar duplicatas em situações de concorrência.
    await prisma.employee.createMany({
      data: toCreate.map((r) => ({
        name: r.name.trim(),
        cpf: r.cpf.trim(),
        enrollment: r.enrollment?.trim() || "PENDING",
        bond_type: r.bond_type.trim().toUpperCase(),
        work_schedule: normalizeWorkSchedule(r.work_schedule),
      })),
      skipDuplicates: true,
    });

    // Busca os registros recém-criados para retornar ao frontend
    // Observação: `createMany` no Postgres não retorna os objetos criados,
    // por isso efetuamos uma nova query para obter os registros inseridos.
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

    // Retornamos os objetos criados (com datas serializadas) e a contagem
    // de registros que foram ignorados por já existirem.
    return NextResponse.json({
      created: created.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
      skippedCount,
    });
  } catch (err) {
    // Em caso de erro, logamos para debugar e retornamos 500 ao cliente.
    console.error("Error in POST /api/servidores/import:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
