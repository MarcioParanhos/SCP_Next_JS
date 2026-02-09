import React from "react";
import { prisma } from "@/lib/prisma";
import SchoolUnitDetail from "@/components/school-units/SchoolUnitDetail";
// Layout compartilhado usado em outras páginas (sidebar + header)
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Autenticação server-side (igual ao dashboard) — redireciona para /login se não autenticado
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

// Página server-side: carrega os dados da unidade pelo `id` (via Prisma)
// e renderiza dentro do layout padrão (Sidebar + Header) para manter
// consistência visual com o restante da aplicação.
export default async function Page({ params }: { params: { id: string } }) {
  // Verifica sessão (mesmo comportamento da página /dashboard)
  const session = await getServerSession(authOptions as any);
  if (!session) redirect("/login");

  const id = Number(params.id);
  if (Number.isNaN(id)) return <div>Id inválido</div>;

  // Buscar unidade: selecionamos explicitamente os campos necessários
  // (incluindo `uo_code`) para evitar surpresas e para montar um DTO
  // enxuto que será repassado ao componente cliente.
  const unit = await prisma.schoolUnit.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sec_cod: true,
      uo_code: true,
      status: true,
      typology: { select: { name: true } },
      municipality: { select: { id: true, name: true, nte: { select: { name: true } } } },
    },
  });

  if (!unit) return <div>Unidade não encontrada</div>;

  // Montamos o DTO que será passado para o componente cliente. O DTO é
  // uma versão amigável do modelo, com nomes curtos e valores prontos para
  // exibição (ex.: `schoolUnit`, `sec_code`, `uo_code`).
  // Observação: mantemos os campos de homologação no DTO para que o
  // componente cliente não precise refazer a mesma consulta no load.
  const dto: any = {
    id: unit.id,
    schoolUnit: unit.name,
    sec_code: (unit as any)?.sec_cod ?? null,
    uo_code: (unit as any).uo_code ?? (unit as any).uoCode ?? "",
    typology: unit?.typology?.name ?? null,
    municipality: unit?.municipality?.name ?? null,
    municipalityId: unit?.municipality?.id ?? null,
    nte: unit?.municipality?.nte?.name ?? null,
    status: unit?.status ?? null,
  };

  // Homologação removida: não incluímos mais dados de homologação no DTO
  // para esta rota. Se for necessário, os endpoints específicos ainda
  // podem fornecer essas informações separadamente.

  return (
    <SidebarProvider>
      <SidebarInset>
        <SiteHeader showBreadcrumbs={false} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-8">
            <SchoolUnitDetail initialData={dto} />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
