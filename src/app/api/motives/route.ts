import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // opcional: REAL or TEMPORARY

    const where: any = {};
    if (type) where.type = String(type);

    const rows = await prisma.motive.findMany({
      where,
      orderBy: [{ type: "asc" }, { description: "asc" }],
      select: { id: true, code: true, description: true, type: true },
    });

    const data = rows.map((r) => ({ id: r.id, code: r.code, description: r.description, type: r.type }));
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error in GET /api/motives:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
