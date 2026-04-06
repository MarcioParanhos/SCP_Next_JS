import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const rows = await prisma.area.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, code: true, name: true } });
    const data = rows.map(r => ({ id: r.id, code: r.code, name: r.name }));
    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error in GET /api/areas:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
