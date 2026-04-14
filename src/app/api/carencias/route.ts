import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Rota POST /api/carencias
// Recebe o payload da carência e persiste em duas tabelas: `carencias` e `carencia_rows`.
// Comentários em português para facilitar manutenção futura.

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Segurança: não confiar em quem o cliente envia para o campo de criador.
    // Removemos quaisquer propriedades que tentem definir o `created_by`/`created_by_id`
    // para garantir que o usuário que criou o registro venha exclusivamente
    // da sessão server-side obtida via `getServerSession`.
    if (body && typeof body === 'object') {
      if ('created_by' in body) delete (body as any).created_by
      if ('createdBy' in body) delete (body as any).createdBy
      if ('created_by_id' in body) delete (body as any).created_by_id
    }

    // Validação mínima do payload (ajuste conforme regras de negócio)
    if (!body.unitId) {
      return NextResponse.json({ error: 'unitId é obrigatório' }, { status: 400 })
    }

    // Monta os dados principais da carência
    // Monta os dados principais da carência.
    // O campo `type` pode ser 'REAL' ou 'TEMPORARY' (enum Prisma CarenciaType).
    // Se o cliente enviou `type` válido, usamos; caso contrário assumimos 'REAL'.
    const allowedTypes = ['REAL', 'TEMPORARY'] as const;
    const providedType = typeof body.type === 'string' && allowedTypes.includes(body.type as any) ? body.type : 'REAL';

    const carenciaData: any = {
      type: providedType,
      school_unit_id: Number(body.unitId),
      startDate: body.startDate ? new Date(body.startDate) : null,
    }

    // Se o cliente enviou os contadores por turno, use-os para o total.
    if (typeof body.totalCount === 'number') {
      carenciaData.total = Number(body.totalCount);
    } else if (typeof body.morningCount === 'number' || typeof body.afternoonCount === 'number' || typeof body.nightCount === 'number') {
      const m = Number(body.morningCount || 0);
      const a = Number(body.afternoonCount || 0);
      const n = Number(body.nightCount || 0);
      carenciaData.total = m + a + n;
      // Armazena também os quantitativos por turno diretamente na tabela
      carenciaData.morning = m;
      carenciaData.afternoon = a;
      carenciaData.night = n;
    } else {
      // fallback: calcula a partir das linhas detalhadas
      carenciaData.total = Array.isArray(body.rows) ? body.rows.reduce((s: number, r: any) => s + (Number(r.morning||0) + Number(r.afternoon||0) + Number(r.night||0)), 0) : 0;
    }

    if (body.serverId) carenciaData.server_id = Number(body.serverId)
    if (body.discipline?.id) carenciaData.discipline_id = Number(body.discipline.id)
    if (body.area?.id) carenciaData.area_id = Number(body.area.id)
    if (body.motive?.id) carenciaData.motive_id = Number(body.motive.id)
    if (body.course?.id) carenciaData.course_id = body.course.id ? Number(body.course.id) : null

    // Registra o usuário que criou a carência (quando autenticado)
    const session = await getServerSession(authOptions as any)
    if ((session?.user as any)?.id) {
      carenciaData.created_by_id = String((session.user as any).id)
    }

    // Linhas detalhadas — converte para o formato aceito pelo Prisma.
    // Se o cliente não enviou linhas, mas enviou quantitativos por turno,
    // criamos uma linha agregada para registrar esses valores.
    let rows = [] as any[];
    if (Array.isArray(body.rows) && body.rows.length > 0) {
      rows = body.rows.map((r: any) => ({
        discipline: r.discipline?.name ?? r.discipline ?? null,
        area: r.area ?? null,
        reason: r.reason ?? null,
        morning: Number(r.morning || 0),
        afternoon: Number(r.afternoon || 0),
        night: Number(r.night || 0),
      }));
    } else if (body.morningCount || body.afternoonCount || body.nightCount) {
      // Cria linha agregada a partir dos contadores principais
      rows = [{
        discipline: body.discipline?.name ?? body.discipline ?? null,
        area: body.area?.name ?? body.area ?? null,
        reason: body.reason ?? null,
        morning: Number(body.morningCount || 0),
        afternoon: Number(body.afternoonCount || 0),
        night: Number(body.nightCount || 0),
      }];
    }

    // Se os quantitativos por turno não foram fornecidos diretamente,
    // calcule-os a partir das linhas (`rows`) para garantir persistência.
    const rowsMorning = Array.isArray(rows) ? rows.reduce((s, r) => s + Number(r.morning || 0), 0) : 0;
    const rowsAfternoon = Array.isArray(rows) ? rows.reduce((s, r) => s + Number(r.afternoon || 0), 0) : 0;
    const rowsNight = Array.isArray(rows) ? rows.reduce((s, r) => s + Number(r.night || 0), 0) : 0;
    if (typeof carenciaData.morning === 'undefined') carenciaData.morning = rowsMorning;
    if (typeof carenciaData.afternoon === 'undefined') carenciaData.afternoon = rowsAfternoon;
    if (typeof carenciaData.night === 'undefined') carenciaData.night = rowsNight;
    // Se total não foi definido anteriormente, some os turnos calculados
    if (typeof carenciaData.total === 'undefined') carenciaData.total = (Number(carenciaData.morning || 0) + Number(carenciaData.afternoon || 0) + Number(carenciaData.night || 0));

    // Persiste em transação: cria a carência e insere as linhas relacionadas
    const result = await prisma.$transaction(async (tx) => {
      // Usamos `create` para as linhas aninhadas (create) ao invés de
      // `createMany` para garantir que os registros relacionados sejam
      // retornados no `include` e para maior compatibilidade.
      const created = await tx.carencia.create({
        data: {
          ...carenciaData,
          rows: rows.length > 0 ? { create: rows } : undefined,
        },
        include: { rows: true },
      })

      return created
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err: any) {
    console.error('Erro ao salvar carência:', err)
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 })
  }
}

// Rota GET /api/carencias
// Retorna uma lista de carências com dados relacionados para exibição na tabela.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const pageSizeParam = searchParams.get("pageSize") ?? "50";
    const pageSize = Math.min(Number(pageSizeParam) || 50, 200);
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search") ?? undefined;
    const nteId = searchParams.get("nteId");
    const municipalityId = searchParams.get("municipalityId");
    const disciplineId = searchParams.get("disciplineId");
    const typeFilter = searchParams.get("type");

    // Construímos cláusulas condicionais: filtros específicos (AND) e busca livre (OR)
    const filters: any[] = [];
    if (nteId) filters.push({ schoolUnit: { municipality: { nte_id: Number(nteId) } } });
    if (municipalityId) filters.push({ schoolUnit: { municipality: { id: Number(municipalityId) } } });
    if (disciplineId) filters.push({ discipline_id: Number(disciplineId) });
    if (typeFilter) filters.push({ type: typeFilter });

    const searchClause = search
      ? {
          OR: [
            { schoolUnit: { name: { contains: search, mode: "insensitive" } } },
            { schoolUnit: { sec_cod: { contains: search, mode: "insensitive" } } },
            { schoolUnit: { municipality: { name: { contains: search, mode: "insensitive" } } } },
            { schoolUnit: { municipality: { nte: { name: { contains: search, mode: "insensitive" } } } } },
            { server: { name: { contains: search, mode: "insensitive" } } },
            { discipline: { name: { contains: search, mode: "insensitive" } } },
            { motive: { description: { contains: search, mode: "insensitive" } } },
          ],
        }
      : null;

    const where: any = {};
    if (filters.length > 0) where.AND = filters;
    if (searchClause) where.AND = (where.AND ?? []).concat(searchClause);

    const take = pageSize + 1;

    const rows = await prisma.carencia.findMany({
      where,
      take,
      cursor: cursor ? { id: Number(cursor) } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { id: "desc" },
      include: {
        schoolUnit: {
          select: {
            id: true,
            name: true,
            sec_cod: true,
            municipality: { select: { name: true, nte: { select: { name: true } } } },
            // inclui apenas a última ação de homologação (mesmo padrão da rota /api/school_units)
            homologations: { select: { action: true }, orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        server: { select: { id: true, name: true, enrollment: true } },
        discipline: { select: { id: true, name: true } },
        motive: { select: { id: true, code: true, description: true } },
      },
    });

    const hasNext = rows.length > pageSize;
    if (hasNext) rows.pop();

    const data = rows.map((c) => {
      // A checagem é exatamente igual à lógica do school_units: última ação === "HOMOLOGATED"
      const lastAction = (c.schoolUnit as any)?.homologations?.[0]?.action ?? null;
      const homologated = lastAction === "HOMOLOGATED";

      return {
        id: c.id,
        tipo: c.type,
        nte: c.schoolUnit?.municipality?.nte?.name ?? null,
        municipality: c.schoolUnit?.municipality?.name ?? null,
        motive: c.motive ? (c.motive.description ?? c.motive.code ?? null) : null,
        servidor: c.server ? { id: c.server.id, name: c.server.name, registration: c.server.enrollment } : null,
        discipline: c.discipline ? c.discipline.name : null,
        morning: c.morning,
        afternoon: c.afternoon,
        night: c.night,
        total: c.total,
        schoolUnit: c.schoolUnit
          ? {
              id: c.schoolUnit.id,
              name: c.schoolUnit.name,
              code: c.schoolUnit.sec_cod,
              homologated,
            }
          : null,
      };
    });

    const nextCursor = hasNext ? String(rows[rows.length - 1]?.id) : null;

    return NextResponse.json({ data, nextCursor, hasNext }, { status: 200 });
  } catch (err: any) {
    console.error("Erro ao buscar carências:", err);
    return NextResponse.json({ error: err?.message ?? "Erro interno" }, { status: 500 });
  }
}
