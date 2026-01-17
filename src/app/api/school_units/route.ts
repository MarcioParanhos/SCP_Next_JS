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
