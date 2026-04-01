import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "100") || 100, 500);
    const q = searchParams.get("q") ?? null;
    const eixoId = searchParams.get("eixoId");

    const where: any = {};
    if (q && String(q).trim().length > 0) {
      where.name = { contains: String(q).trim(), mode: "insensitive" };
    }
    if (eixoId) {
      where.eixo_id = Number(eixoId);
    }

    const rows = await prisma.course.findMany({
      take: pageSize,
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, eixo_id: true },
    });

    const data = rows.map((r) => ({ id: r.id, name: r.name, eixo_id: r.eixo_id }));
    return NextResponse.json({ data, nextCursor: null, hasNext: false });
  } catch (err) {
    console.error("Error in GET /api/courses:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
