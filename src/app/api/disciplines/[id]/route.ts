import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Retorna uma disciplina específica pelo ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const discipline = await prisma.discipline.findUnique({
      where: { id: Number(id) },
    });

    if (!discipline) {
      return NextResponse.json(
        { error: "Disciplina não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: discipline });
  } catch (err) {
    console.error("Erro em GET /api/disciplines/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Atualiza o nome de uma disciplina existente
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name } = body;

    // Validação: name é obrigatório
    if (!name || String(name).trim().length === 0) {
      return NextResponse.json(
        { error: "O campo 'name' é obrigatório." },
        { status: 400 }
      );
    }

    const discipline = await prisma.discipline.update({
      where: { id: Number(id) },
      data: { name: String(name).trim() },
    });

    return NextResponse.json({ data: discipline });
  } catch (err: any) {
    // P2025 = registro não encontrado para atualização
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Disciplina não encontrada." },
        { status: 404 }
      );
    }
    console.error("Erro em PUT /api/disciplines/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Exclui fisicamente uma disciplina (sem vínculo em formulários, pode excluir)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.discipline.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Disciplina excluída com sucesso." });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json(
        { error: "Disciplina não encontrada." },
        { status: 404 }
      );
    }
    console.error("Erro em DELETE /api/disciplines/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
