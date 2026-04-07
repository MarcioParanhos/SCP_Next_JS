import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // opcional: REAL or TEMPORARY

    const where: any = {};
    if (type) where.type = String(type);
    // Inclui inativos somente quando explicitamente solicitado via all=true
    const all = searchParams.get("all") === "true";
    if (!all) where.active = true;

    const rows = await prisma.motive.findMany({
      where,
      orderBy: [{ type: "asc" }, { description: "asc" }],
      select: { id: true, code: true, description: true, type: true, active: true },
    });

    const data = rows.map((r) => ({ id: r.id, code: r.code, description: r.description, type: r.type, active: r.active }));
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Erro em GET /api/motives:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Cria um novo motivo de carência
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, description, type } = body;

    // Validação dos campos obrigatórios
    if (!code || !description || !type) {
      return NextResponse.json(
        { error: "Os campos 'code', 'description' e 'type' são obrigatórios." },
        { status: 400 }
      );
    }

    // O campo type aceita somente REAL ou TEMPORARY (enum CarenciaType do Prisma)
    if (type !== "REAL" && type !== "TEMPORARY") {
      return NextResponse.json(
        { error: "O campo 'type' deve ser 'REAL' ou 'TEMPORARY'." },
        { status: 400 }
      );
    }

    const motive = await prisma.motive.create({
      data: {
        code: String(code).trim().toUpperCase(),
        description: String(description).trim(),
        type: type as "REAL" | "TEMPORARY",
        active: true,
      },
    });

    return NextResponse.json({ data: motive }, { status: 201 });
  } catch (err: any) {
    // P2002 = violação de unique constraint (código duplicado)
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um motivo com este código." },
        { status: 409 }
      );
    }
    console.error("Erro em POST /api/motives:", err);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
