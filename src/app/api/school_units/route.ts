import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota API: GET /api/school_units
// - Suporta paginação por cursor (query params: pageSize, cursor, order)
// - Retorna um JSON com: { data, nextCursor, hasNext }
export async function GET(req: Request) {
  try {
    // parse dos parâmetros de query
    const { searchParams } = new URL(req.url);

    const pageSizeParam = searchParams.get("pageSize") ?? "50";
    // limita o pageSize máximo para evitar payloads muito grandes
    const pageSize = Math.min(Number(pageSizeParam) || 50, 100);
    const cursor = searchParams.get("cursor");
    const order = (searchParams.get("order") ?? "asc").toLowerCase();

    // buscamos pageSize + 1 para detectar se existe próxima página
    const take = pageSize + 1;

    // Consulta ao banco (Prisma): select enxuto para reduzir payload
    const rows = await prisma.schoolUnit.findMany({
      take,
      cursor: cursor ? { id: Number(cursor) } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { id: order === "desc" ? "desc" : "asc" },
      select: {
        id: true,
        name: true,
        sec_cod: true,
        status: true,
        // incluir apenas o `name` da tipologia e do NTE (evita trazer objetos inteiros)
        typology: { select: { name: true } },
        municipality: { select: { name: true, nte: { select: { name: true } } } },
      },
    });

    // detecta se existe próxima página
    const hasNext = rows.length > pageSize;
    if (hasNext) rows.pop(); // remove o item extra usado apenas para detecção

    // mapeia para o formato esperado pelo frontend (DTO)
    const data = rows.map((s) => ({
      id: s.id,
      schoolUnit: s.name,
      sec_code: s.sec_cod ?? "",
      typology: s.typology?.name ?? "",
      municipality: s.municipality?.name ?? "",
      nte: s.municipality?.nte?.name ?? "",
      status: s.status ?? "",
    }));

    // nextCursor: id do último item retornado (ou null)
    const nextCursor = hasNext ? String(rows[rows.length - 1]?.id) : null;

    return NextResponse.json({ data, nextCursor, hasNext });
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Rota API: POST /api/school_units
// Recebe um payload JSON do cliente e cria uma nova unidade escolar no banco.
// Expected payload (example):
// {
//   schoolUnit: "Nome da Escola",
//   sec_code: "123",
//   municipality: "1",        // id do município (string ou number)
//   typology: "SEDE",         // opcional: nome da tipologia
//   status: "1",              // opcional: se ausente, será usado '1' por padrão aqui
//   categories: ["a","b"]   // opcional: atualmente não mapeado no modelo DB
// }
export async function POST(req: Request) {
  try {
    // 1) Parse do body JSON enviado pelo cliente
    const payload = await req.json();

    // 2) Validação mínima: precisamos do nome da unidade e do id do município
    if (!payload || !payload.schoolUnit || !payload.municipality) {
      return new NextResponse("Missing required fields: schoolUnit or municipality", { status: 400 });
    }

    // 3) Preparar valores a serem persistidos
    // - `name` no DB corresponde a `schoolUnit` no payload
    // - `sec_cod` no DB corresponde a `sec_code` do payload
    // - `municipality` é uma relação; aqui conectamos pelo id
    // - `typology` (relação) tentaremos conectar por nome se fornecido
    // - `status`: se o cliente enviar, usaremos; caso contrário, definimos '1' como comportamento padrão
    const municipalityId = Number(payload.municipality);
    if (Number.isNaN(municipalityId)) {
      return new NextResponse("Invalid municipality id", { status: 400 });
    }

    // 4) Resolver tipologia (aceitamos `typology` por id ou por nome)
    // - Caso o form envie um id (1, "2", etc.), conectamos por id.
    // - Caso envie um nome (ex: "SEDE"), tentamos buscar pela propriedade `name`.
    // - Não criamos tipologia automaticamente; apenas conectamos quando existir.
    let typologyConnect = undefined;
    if (payload.typology !== undefined && payload.typology !== null && payload.typology !== "") {
      // tenta interpretar como id numérico
      const maybeId = Number(payload.typology);
      if (!Number.isNaN(maybeId)) {
        typologyConnect = { connect: { id: maybeId } };
      } else {
        const typ = await prisma.typology.findFirst({ where: { name: String(payload.typology) } });
        if (typ) typologyConnect = { connect: { id: typ.id } };
      }
      // Nota: se a tipologia não for encontrada por nome, optamos por ignorar a relação.
    }

    // 5) Montar o objeto `data` para o Prisma create
    // Observação sobre `status`: definimos um fallback `"1"` no servidor para garantir
    // que registros recém-criados tenham o status esperado mesmo que o client não envie o campo.
    const createData: any = {
      name: payload.schoolUnit,
      sec_cod: payload.sec_code ?? "",
      status: payload.status ?? "1",
      municipality: { connect: { id: municipalityId } },
      ...(typologyConnect ? { typology: typologyConnect } : {}),
    };

    // 6) Inserir no banco com Prisma
    const created = await prisma.schoolUnit.create({
      data: createData,
      include: {
        municipality: { select: { name: true, nte: { select: { name: true } } } },
        typology: { select: { name: true } },
      },
    });

    // 7) Mapear para o DTO que o frontend espera
    const dto = {
      id: created.id,
      schoolUnit: created.name,
      sec_code: created.sec_cod ?? "",
      typology: created.typology?.name ?? "",
      municipality: created.municipality?.name ?? "",
      nte: created.municipality?.nte?.name ?? "",
      status: created.status ?? "",
    };

    // 8) Retornar o objeto criado ao cliente
    return NextResponse.json({ data: dto });
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
