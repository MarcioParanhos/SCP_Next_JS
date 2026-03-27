import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// Route: GET /api/servidores/[id]
// ============================================================
// Returns a single employee by ID.
// Note: uses `context: any` for Next.js 15 async params compatibility.
export async function GET(_req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) {
      return new NextResponse("Invalid id", { status: 400 });
    }

    // Fetch the employee from the database
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      cpf: employee.cpf,
      enrollment: employee.enrollment,
      bond_type: employee.bond_type,
      work_schedule: employee.work_schedule,
      createdAt: employee.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Error in GET /api/servidores/[id]:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ============================================================
// Route: PUT /api/servidores/[id]
// ============================================================
// Partially updates an existing employee record.
// Only fields included in the body are modified.
export async function PUT(req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) {
      return new NextResponse("Invalid id", { status: 400 });
    }

    const body = await req.json();
    const { name, cpf, enrollment, bond_type, work_schedule } = body;

    // Build update object with only the fields that were sent in the request
    const updateData: Record<string, string> = {};
    if (name !== undefined)          updateData.name          = String(name).trim();
    if (cpf !== undefined)           updateData.cpf           = String(cpf).trim();
    if (enrollment !== undefined)    updateData.enrollment    = String(enrollment).trim();
    if (bond_type !== undefined)     updateData.bond_type     = String(bond_type).trim();
    if (work_schedule !== undefined) updateData.work_schedule = String(work_schedule).trim();

    // Prisma automatically updates `updatedAt` on every update
    const updated = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      cpf: updated.cpf,
      enrollment: updated.enrollment,
      bond_type: updated.bond_type,
      work_schedule: updated.work_schedule,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err: any) {
    console.error("Error in PUT /api/servidores/[id]:", err);
    // Prisma P2025: record not found
    if (err.code === "P2025") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ============================================================
// Route: DELETE /api/servidores/[id]
// ============================================================
// Permanently removes an employee from the database.
// Returns { ok: true } on success.
export async function DELETE(_req: Request, context: any) {
  try {
    const id = Number(context.params?.id);
    if (Number.isNaN(id)) {
      return new NextResponse("Invalid id", { status: 400 });
    }

    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/servidores/[id]:", err);
    // Prisma P2025: attempting to delete a record that does not exist
    if (err.code === "P2025") {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

