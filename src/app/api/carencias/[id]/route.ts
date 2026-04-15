import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota DELETE /api/carencias/[id]
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
