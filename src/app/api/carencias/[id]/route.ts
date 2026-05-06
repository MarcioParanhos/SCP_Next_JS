import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota GET /api/carencias/[id] e DELETE /api/carencias/[id]
export async function GET(_req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    // Buscar carência com relações úteis para a página de detalhe
    const carencia = await prisma.carencia.findUnique({
      where: { id },
      include: {
        schoolUnit: { include: { municipality: { include: { nte: true } } } },
        server: true,
        discipline: true,
        motive: true,
        area: true,
        course: true,
        rows: true,
      },
    });

    if (!carencia) return new NextResponse("Not found", { status: 404 });

    return NextResponse.json({ data: carencia });
  } catch (err: any) {
    console.error("Error in GET /api/carencias/[id]:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    await prisma.carencia.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/carencias/[id]:", err);
    if (err?.code === "P2025") return new NextResponse("Not found", { status: 404 });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
