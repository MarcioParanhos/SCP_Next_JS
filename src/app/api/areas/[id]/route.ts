import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Retorna uma área específica pelo ID
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const area = await prisma.area.findUnique({ where: { id: Number(id) } });

    if (!area) {
      return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ data: area });
  } catch (err) {
    console.error("Erro em GET /api/areas/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Atualiza os dados de uma área existente
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { code, name, active } = body;

    // Validação: code e name são obrigatórios
    if (!code || !name) {
      return NextResponse.json(
        { error: "Os campos 'code' e 'name' são obrigatórios." },
        { status: 400 }
      );
    }

    const area = await prisma.area.update({
      where: { id: Number(id) },
      data: {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        // Atualiza o campo active somente se explicitamente fornecido
        ...(typeof active !== "undefined" && { active: Boolean(active) }),
      },
    });

    return NextResponse.json({ data: area });
  } catch (err: any) {
    // P2025 = registro não encontrado para atualização
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
    }
    // P2002 = código duplicado
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma área com este código." },
        { status: 409 }
      );
    }
    console.error("Erro em PUT /api/areas/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Exclusão lógica de uma área (marca como inativa)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Preferimos exclusão lógica para preservar histórico de formulários
    await prisma.area.update({
      where: { id: Number(id) },
      data: { active: false },
    });

    return NextResponse.json({ message: "Área desativada com sucesso." });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });
    }
    console.error("Erro em DELETE /api/areas/[id]:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
