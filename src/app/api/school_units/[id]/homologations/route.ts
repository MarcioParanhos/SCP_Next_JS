import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota para gerenciar homologações de uma unidade escolar
// - GET: lista o histórico de homologações da unidade
// - POST: cria um novo registro de homologação/deshomologação

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = Number(params.id);
    const items = await prisma.homologation.findMany({
      where: { school_unit_id: unitId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: items });
  } catch (err) {
    console.error("GET homologations error", err);
    return NextResponse.json({ error: "Erro ao buscar homologações" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unitId = Number(params.id);
    const body = await request.json();

    // Esperamos: { action: "HOMOLOGATED"|"UNHOMOLOGATED", reason?: string, performed_by?: string }
    const { action, reason, performed_by } = body;

    if (!action) {
      return NextResponse.json({ error: "Campo 'action' é obrigatório" }, { status: 400 });
    }

    const record = await prisma.homologation.create({
      data: {
        action,
        reason,
        performed_by,
        school_unit_id: unitId,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err) {
    console.error("POST homologations error", err);
    return NextResponse.json({ error: "Erro ao criar homologação" }, { status: 500 });
  }
}
