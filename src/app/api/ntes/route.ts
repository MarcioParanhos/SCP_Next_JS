// Rota API: GET /api/ntes
// Retorna uma lista de NTEs no formato [{ id: string, name: string }]
// Observações:
// - Converte `id` para string porque os Selects no frontend esperam valores string.
// - Usa Prisma para ler a tabela `nte` definida no schema Prisma.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ntes = await prisma.nte.findMany({ select: { id: true, name: true } });
    // Retornamos ids como string para o Select do frontend
    const data = ntes.map((n) => ({ id: String(n.id), name: n.name }));
    return NextResponse.json(data);
  } catch (err) {
    console.error("/api/ntes error", err);
    // Em caso de erro, retornamos status 500 com uma mensagem simples
    return NextResponse.json({ error: "Failed to load NTEs" }, { status: 500 });
  }
}
