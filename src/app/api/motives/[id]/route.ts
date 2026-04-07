import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Retorna um motivo de carência específico pelo ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const motive = await prisma.motive.findUnique({ where: { id: Number(id) } });

    if (!motive) {
      return NextResponse.json({ error: "Motivo não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ data: motive });
  } catch (err) {
    console.error("Erro em GET /api/motives/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Atualiza um motivo de carência existente
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { code, description, type, active } = body;

    // Validação dos campos obrigatórios
    if (!code || !description || !type) {
      return NextResponse.json(
        { error: "Os campos 'code', 'description' e 'type' são obrigatórios." },
        { status: 400 }
      );
    }

    // O enum CarenciaType só aceita REAL ou TEMPORARY
    if (type !== "REAL" && type !== "TEMPORARY") {
      return NextResponse.json(
        { error: "O campo 'type' deve ser 'REAL' ou 'TEMPORARY'." },
        { status: 400 }
      );
    }

    const motive = await prisma.motive.update({
      where: { id: Number(id) },
      data: {
        code: String(code).trim().toUpperCase(),
        description: String(description).trim(),
        type: type as "REAL" | "TEMPORARY",
        // Atualiza o campo active somente se explicitamente fornecido
        ...(typeof active !== "undefined" && { active: Boolean(active) }),
      },
    });

    return NextResponse.json({ data: motive });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Motivo não encontrado." }, { status: 404 });
    }
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um motivo com este código." },
        { status: 409 }
      );
    }
    console.error("Erro em PUT /api/motives/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Exclusão lógica de um motivo (marca como inativo para preservar histórico)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.motive.update({
      where: { id: Number(id) },
      data: { active: false },
    });

    return NextResponse.json({ message: "Motivo desativado com sucesso." });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Motivo não encontrado." }, { status: 404 });
    }
    console.error("Erro em DELETE /api/motives/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
