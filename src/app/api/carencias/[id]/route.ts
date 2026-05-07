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

export async function PATCH(req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    const body = await req.json();
    const { server_id, motive_id, area_id, discipline_id, rows, observations } = body;

    // Atualiza os campos principais da carência
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (server_id     !== undefined) updateData.server_id     = server_id     ? Number(server_id)     : null;
    if (motive_id     !== undefined) updateData.motive_id     = motive_id     ? Number(motive_id)     : null;
    if (area_id       !== undefined) updateData.area_id       = area_id       ? Number(area_id)       : null;
    if (discipline_id !== undefined) updateData.discipline_id = discipline_id ? Number(discipline_id) : null;
    if (observations  !== undefined) updateData.observations  = observations || null;

    await prisma.carencia.update({ where: { id }, data: updateData });

    // Se vieram linhas, substitui todas as rows existentes
    if (Array.isArray(rows)) {
      await prisma.carenciaRow.deleteMany({ where: { carencia_id: id } });
      if (rows.length > 0) {
        await prisma.carenciaRow.createMany({
          data: rows.map((r: any) => ({
            carencia_id: id,
            discipline:  r.discipline  ?? null,
            area:        r.area        ?? null,
            morning:     Number(r.morning   || 0),
            afternoon:   Number(r.afternoon || 0),
            night:       Number(r.night     || 0),
          })),
        });
      }
      // Recalcula totais na tabela principal
      const totals = rows.reduce(
        (acc: any, r: any) => ({
          morning:   acc.morning   + Number(r.morning   || 0),
          afternoon: acc.afternoon + Number(r.afternoon || 0),
          night:     acc.night     + Number(r.night     || 0),
        }),
        { morning: 0, afternoon: 0, night: 0 }
      );
      await prisma.carencia.update({
        where: { id },
        data: {
          morning:   totals.morning,
          afternoon: totals.afternoon,
          night:     totals.night,
          total:     totals.morning + totals.afternoon + totals.night,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error in PATCH /api/carencias/[id]:", err);
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
