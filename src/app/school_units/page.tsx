// Layout e componentes de UI
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// Componente cliente que renderiza a tabela interativa (usa hooks e estado no cliente)
import { SchoolUnitsDataTable } from "@/components/school-units/SchoolUnitsDataTable";
// Cliente Prisma — usado apenas no server component para buscar dados do banco
import { prisma } from "@/lib/prisma";

export default async function SchoolUnitsPage() {
  // --- BUSCA NO BANCO (SERVER) ---
  // Aqui estamos em um server component: podemos usar Prisma diretamente.
  // Buscamos as unidades escolares e incluímos relacionamentos úteis
  const schoolUnits = await prisma.schoolUnit.findMany({
    include: { typology: true, municipality: { include: { nte: true } } },
    orderBy: { id: "asc" },
  });

  // --- MAPEAMENTO DOS DADOS ---
  // A tabela espera um formato específico (conforme o schema no componente).
  // Convertendo os registros do banco para esse formato:
  const data = schoolUnits.map((s) => ({
    id: s.id,
     // `municipality` mostro o nome do município; ajuste conforme desejar
    municipality: s.municipality?.name ?? "Assign reviewer",
    nte: s.municipality?.nte?.name ?? "",
    // `schoolUnit` na tabela contém o nome da unidade (camelCase agora)
    schoolUnit: s.name,
    // `target` mapeado aqui como `sec_cod` apenas como exemplo
    sec_code: s.sec_cod ?? "",
    // `typology` usamos a tipologia relacionada (se existir)
    typology: s.typology?.name ?? "",
    // `status` vindo da tabela `school_units`
    status: s.status ?? "",
    // `limit` não existe no modelo — deixamos vazio por padrão
    limit: "",
   
  }));

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="p-4">
          <h3 className="mb-4 mt-8 scroll-m-20 text-3xl font-bold tracking-tight">Unidades Escolares</h3>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 md:gap-6 md:py-6">
              {/* `SchoolUnitsDataTable` é um client component; passamos dados do servidor */}
              <SchoolUnitsDataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}