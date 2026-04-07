import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Retorna todas as áreas, ativas por padrão.
// Passe o query param `all=true` para incluir também as inativas.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "true";
    const where = all ? {} : { active: true };

    const rows = await prisma.area.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, active: true },
    });
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("Erro em GET /api/areas:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Cria uma nova área pedagógica de carência
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name } = body;

    // Validação: ambos os campos são obrigatórios
    if (!code || !name) {
      return NextResponse.json(
        { error: "Os campos 'code' e 'name' são obrigatórios." },
        { status: 400 }
      );
    }

    const area = await prisma.area.create({
      data: {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        active: true,
      },
    });

    return NextResponse.json({ data: area }, { status: 201 });
  } catch (err: any) {
    // P2002 = violação de unique constraint (código duplicado)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe uma área com este código." },
        { status: 409 }
      );
    }
    console.error("Erro em POST /api/areas:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
