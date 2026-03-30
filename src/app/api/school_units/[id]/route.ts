import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota dinâmica: /api/school_units/[id]
// Handlers implementados: GET, PUT, DELETE

// GET: retorna dados básicos da unidade (usado para views leves / breadcrumbs)
export async function GET(_req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    const s = await prisma.schoolUnit.findUnique({
      where: { id },
      select: { id: true, name: true, sec_cod: true },
    });

    if (!s) return new NextResponse("Not found", { status: 404 });

    return NextResponse.json({ data: { id: s.id, schoolUnit: s.name, sec_code: s.sec_cod ?? "" } });
  } catch (err) {
    console.error("Error in GET /api/school_units/[id]:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT: atualiza dados da unidade escolar
// Comentários em português para servir como referência futura
export async function PUT(req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    const payload = await req.json();

    // Monta objeto `data` contendo apenas os campos permitidos para atualização
    // Aceitamos diferentes nomes de campos vindos do cliente (compatibilidade):
    // - `schoolUnit` ou `name` → nome da unidade
    // - `sec_code` ou `sec_cod` → código SEC
    // - `uo_code` → código UO
    // - `status` → status
    const data: any = {};
    const nameValue = payload.schoolUnit ?? payload.name;
    const secCodeValue = payload.sec_code ?? payload.sec_cod ?? payload.secCode;
    const uoCodeValue = payload.uo_code ?? payload.uoCode;
    if (nameValue !== undefined) data.name = String(nameValue).trim();
    if (secCodeValue !== undefined) data.sec_cod = String(secCodeValue).trim();
    if (uoCodeValue !== undefined) data.uo_code = String(uoCodeValue).trim();
    if (payload.status !== undefined) data.status = String(payload.status).trim();

    // Municipality: permite conectar por id quando fornecido
    const municipalityField = payload.municipality ?? payload.municipalityId ?? payload.municipality_id;
    if (municipalityField !== undefined && municipalityField !== null && municipalityField !== "") {
      const municipalityId = Number(municipalityField);
      if (!Number.isNaN(municipalityId)) data.municipality = { connect: { id: municipalityId } };
    }

    // Tipologia: aceita id numérico ou nome (tenta buscar por nome)
    if (payload.typology !== undefined && payload.typology !== null && payload.typology !== "") {
      const maybeId = Number(payload.typology);
      if (!Number.isNaN(maybeId)) {
        data.typology = { connect: { id: maybeId } };
      } else {
        const typ = await prisma.typology.findFirst({ where: { name: String(payload.typology) } });
        if (typ) data.typology = { connect: { id: typ.id } };
      }
    }

    const updated = await prisma.schoolUnit.update({
      where: { id },
      data,
      include: {
        municipality: { select: { name: true, nte: { select: { name: true } } } },
        typology: { select: { name: true } },
      },
    });

    const dto = {
      id: updated.id,
      schoolUnit: updated.name,
      sec_code: updated.sec_cod ?? "",
      typology: updated.typology?.name ?? "",
      municipality: updated.municipality?.name ?? "",
      nte: updated.municipality?.nte?.name ?? "",
      status: updated.status ?? "",
    };

    return NextResponse.json({ data: dto });
  } catch (err: any) {
    console.error("Error in PUT /api/school_units/[id]:", err);
    if (err?.code === "P2025") return new NextResponse("Not found", { status: 404 });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE: remove a unidade escolar
export async function DELETE(_req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    await prisma.schoolUnit.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/school_units/[id]:", err);
    if (err?.code === "P2025") return new NextResponse("Not found", { status: 404 });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
