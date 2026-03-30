import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// Route: GET /api/servidores
// ============================================================
// Returns the employee list with cursor-based pagination.
// Supported query params:
//   pageSize  — items per page (default: 50, max: 100)
//   cursor    — id of the last item from the previous page
//   order     — "asc" | "desc" (default: "asc")
// Response: { data, nextCursor, hasNext }
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse and clamp page size to avoid oversized payloads
    const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "50") || 50, 100);

    // Support simple text search via `q` parameter for autocomplete use-cases.
    // If `q` is present we return a filtered (non-cursor) list limited by pageSize.
    const q = searchParams.get("q") ?? searchParams.get("search") ?? null;

    // If a search query is provided, perform a lightweight filtered query
    // (suitable for autocomplete). We match by name (contains), cpf (contains)
    // or exact enrollment to allow quick lookup by matrícula.
    if (q && String(q).trim().length > 0) {
      const term = String(q).trim();
      const rows = await prisma.employee.findMany({
        take: pageSize,
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { cpf: { contains: term } },
            { enrollment: term },
          ],
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          cpf: true,
          enrollment: true,
          bond_type: true,
          work_schedule: true,
          createdAt: true,
        },
      });

      const data = rows.map((s) => ({
        id: s.id,
        name: s.name,
        cpf: s.cpf,
        enrollment: s.enrollment,
        bond_type: s.bond_type,
        work_schedule: s.work_schedule,
        createdAt: s.createdAt.toISOString(),
      }));

      return NextResponse.json({ data, nextCursor: null, hasNext: false });
    }

    // Cursor: id of the last returned item (for forward pagination)
    const cursor = searchParams.get("cursor");

    // Sort order (default: ascending by id)
    const order = (searchParams.get("order") ?? "asc").toLowerCase();

    // Fetch one extra row to detect whether a next page exists
    const take = pageSize + 1;

    const rows = await prisma.employee.findMany({
      take,
      cursor: cursor ? { id: Number(cursor) } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { id: order === "desc" ? "desc" : "asc" },
      select: {
        id: true,
        name: true,
        cpf: true,
        enrollment: true,    // Enrollment number (was: matricula)
        bond_type: true,     // Bond type (was: vinculo)
        work_schedule: true, // Work schedule (was: regime)
        createdAt: true,     // Registration date for the DATA DO CADASTRO column
      },
    });

    // Detect whether a next page exists
    const hasNext = rows.length > pageSize;
    if (hasNext) rows.pop(); // Remove the extra sentinel row

    // Map database records to the DTO expected by the frontend
    const data = rows.map((s) => ({
      id: s.id,
      name: s.name,
      cpf: s.cpf,
      enrollment: s.enrollment,
      bond_type: s.bond_type,
      work_schedule: s.work_schedule,
      createdAt: s.createdAt.toISOString(),
    }));

    // Cursor for the next page: id of the last returned item (or null)
    const nextCursor = hasNext ? String(rows[rows.length - 1]?.id) : null;

    return NextResponse.json({ data, nextCursor, hasNext });
  } catch (err) {
    console.error("Error in GET /api/servidores:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ============================================================
// Route: POST /api/servidores
// ============================================================
// Creates a new employee record in the database.
// Expected JSON body:
// {
//   name:          string  — full name
//   cpf:           string  — CPF number
//   enrollment?:   string  — enrollment number (defaults to "PENDING")
//   bond_type:     string  — employment bond type (e.g. REDA, EFETIVO)
//   work_schedule: string  — work schedule / shift (e.g. 20H, 40H, DE)
// }
// Returns the created record as JSON with status 201.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, cpf, enrollment, bond_type, work_schedule } = body;

    // Validate required fields before attempting a database insert
    if (!name || !cpf || !bond_type || !work_schedule) {
      return new NextResponse(
        JSON.stringify({ error: "Required fields: name, cpf, bond_type, work_schedule" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Normalize enrollment value
    const normalizedEnrollment = enrollment ? String(enrollment).trim() : "PENDING";

    // If a concrete enrollment is provided (not the special "PENDING" placeholder),
    // ensure no other record already uses the same enrollment.
    if (normalizedEnrollment && normalizedEnrollment !== "PENDING") {
      const existing = await prisma.employee.findFirst({ where: { enrollment: normalizedEnrollment } });
      if (existing) {
        return new NextResponse(
          JSON.stringify({ error: `Já existe um servidor com a matrícula ${normalizedEnrollment}.` }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const created = await prisma.employee.create({
      data: {
        name: String(name).trim(),
        cpf: String(cpf).trim(),
        // Keep the same convention: store "PENDING" when enrollment not provided
        enrollment: normalizedEnrollment,
        bond_type: String(bond_type).trim(),
        work_schedule: String(work_schedule).trim(),
      },
    });

    // Return the created record with HTTP 201 (Created)
    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        cpf: created.cpf,
        enrollment: created.enrollment,
        bond_type: created.bond_type,
        work_schedule: created.work_schedule,
        createdAt: created.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in POST /api/servidores:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
