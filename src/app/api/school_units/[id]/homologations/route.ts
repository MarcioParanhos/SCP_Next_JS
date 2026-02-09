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

    // Validações básicas servidor-side para garantir integridade:
    // - ação é obrigatória
    // - se a ação for 'UNHOMOLOGATED', o motivo também deve ser informado
    if (!action) {
      return NextResponse.json({ error: "Campo 'action' é obrigatório" }, { status: 400 });
    }

    if (action === "UNHOMOLOGATED" && (!reason || reason.trim() === "")) {
      return NextResponse.json({ error: "Motivo é obrigatório ao retirar homologação" }, { status: 400 });
    }

    // Certifica que a unidade existe antes de criar o registro
    const unitExists = await prisma.schoolUnit.findUnique({ where: { id: unitId } });
    if (!unitExists) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });
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
