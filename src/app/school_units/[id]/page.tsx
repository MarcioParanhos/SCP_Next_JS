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

  // Seleciona explicitamente os campos necessários, incluindo `uo_code`.
  // Isso evita depender de nomes implícitos retornados pelo Prisma e garante
  // que teremos `uo_code` no objeto retornado.
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
  // DEBUG: logar o objeto retornado pelo Prisma para inspecionar campos (ver saída no servidor)
  // Remova ou comente este log quando confirmar que os dados estão corretos.
  console.log("schoolUnit (prisma):", JSON.stringify(unit));

  // Construir DTO tolerante a variações de nome de campo (uo_code vs uoCode)
  const uoCodeValue = (unit as any).uo_code ?? (unit as any).uoCode ?? "";

  const dto = {
    id: unit.id,
    schoolUnit: unit.name,
    sec_code: unit.sec_cod ?? "",
    // Inclui `uo_code` (Código UO / SAP) mapeando de forma tolerante
    uo_code: uoCodeValue,
    typology: unit.typology?.name ?? "",
    municipality: unit.municipality?.name ?? "",
    municipalityId: unit.municipality?.id ?? null,
    nte: unit.municipality?.nte?.name ?? "",
    status: unit.status ?? "",
  };

  // Renderiza o layout padrão (SidebarProvider + AppSidebar + SiteHeader)
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Aqui colocamos o componente de detalhe dentro do container principal */}
              <div className="px-4 lg:px-6">
                <SchoolUnitDetail initialData={dto} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
