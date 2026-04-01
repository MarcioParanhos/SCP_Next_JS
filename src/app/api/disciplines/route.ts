import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "100") || 100, 500);
    const q = searchParams.get("q") ?? null;

    if (q && String(q).trim().length > 0) {
      const term = String(q).trim();
      const rows = await prisma.discipline.findMany({
        take: pageSize,
        where: { name: { contains: term, mode: "insensitive" } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });

      const data = rows.map((r) => ({ id: r.id, name: r.name }));
      return NextResponse.json({ data, nextCursor: null, hasNext: false });
    }

    const rows = await prisma.discipline.findMany({
      take: pageSize,
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });

    const data = rows.map((r) => ({ id: r.id, name: r.name }));
    return NextResponse.json({ data, nextCursor: null, hasNext: false });
  } catch (err) {
    console.error("Error in GET /api/disciplines:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
