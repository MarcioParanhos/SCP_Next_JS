import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Rota API dinâmica: DELETE /api/school_units/:id
// Comentários detalhados em português seguindo a solicitação do usuário.

/**
 * DELETE handler
 * - Recebe `id` através dos `params` da rota dinâmica do Next.js.
 * - Valida o `id` recebido (deve ser numérico).
 * - Tenta remover a unidade escolar correspondente no banco via Prisma.
 * - Trata o erro conhecido do Prisma quando o registro não existe (código P2025).
 * - Retorna respostas HTTP apropriadas (400, 404, 200, 500).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    // 1) Obter e validar o id recebido pela rota
    // O `params.id` vem como string (p.ex. "123"), então convertemos para número.
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      // Se o id não for um número válido, retornamos Bad Request (400)
      return new NextResponse("ID inválido", { status: 400 });
    }

    // 2) Executar exclusão no banco usando Prisma
    // - Aqui usamos `prisma.schoolUnit.delete` que irá lançar erro se o registro não existir.
    await prisma.schoolUnit.delete({ where: { id } });

    // 3) Retornar sucesso simples (200) para o cliente
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // 4) Tratamento de erros
    // - Prisma usa códigos de erro como 'P2025' quando o registro não é encontrado ao deletar.
    // - Registramos o erro no servidor para fins de debug e retornamos status apropriado.
    console.error("Erro ao deletar unidade escolar:", err);

    if (err?.code === "P2025") {
      // Registro não encontrado
      return new NextResponse("Registro não encontrado", { status: 404 });
    }

    // Erro genérico do servidor
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// Rota API: PUT /api/school_units/:id
// Handler para atualizar uma unidade escolar existente.
// Comentários / fluxo (em português):
// - Recebe `id` pela rota dinâmica (params.id) e valida como número.
// - Lê o JSON do corpo com os campos a atualizar (ex: schoolUnit, sec_code, status, municipality, typology).
// - Constrói um objeto `data` contendo apenas os campos permitidos para update,
//   conectando relações (municipality/typology) quando aplicável.
// - Executa `prisma.schoolUnit.update` e retorna o DTO esperado pelo frontend.
// - Em caso de erro, loga e retorna 500.
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) return new NextResponse("Invalid id", { status: 400 });

    const payload = await req.json();

    // Construir objeto de update reduzido (evitar mudanças indesejadas)
    const data: any = {};
    if (payload.schoolUnit !== undefined) data.name = payload.schoolUnit;
    if (payload.sec_code !== undefined) data.sec_cod = payload.sec_code;
    if (payload.status !== undefined) data.status = payload.status;

    if (payload.municipality !== undefined && payload.municipality !== null && payload.municipality !== "") {
      const municipalityId = Number(payload.municipality);
      if (!Number.isNaN(municipalityId)) data.municipality = { connect: { id: municipalityId } };
    }

    // Tipologia: tentar conectar por id ou por nome (se informado)
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
  } catch (err) {
    console.error(err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
