// Rota API: GET /api/municipalities?nteId=<id>
// Retorna a lista de municípios associados a um NTE específico.
// Formato: [{ id: string, name: string }]
// Observações:
// - Se `nteId` não for informado, retornamos um array vazio.
// - Converte `id` para string para compatibilidade com valores de Select no frontend.
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const nteId = req.nextUrl.searchParams.get("nteId");
    if (!nteId) {
      // Sem nteId: retorno vazio (400 também seria aceitável, mas frontend trata ausência como listagem vazia)
      return NextResponse.json([], { status: 200 });
    }

    const id = parseInt(nteId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid nteId" }, { status: 400 });
    }

    const municipalities = await prisma.municipality.findMany({
      where: { nte_id: id },
      select: { id: true, name: true },
    });

    const data = municipalities.map((m) => ({ id: String(m.id), name: m.name }));
    return NextResponse.json(data);
  } catch (err) {
    console.error("/api/municipalities error", err);
    return NextResponse.json({ error: "Failed to load municipalities" }, { status: 500 });
  }
}
