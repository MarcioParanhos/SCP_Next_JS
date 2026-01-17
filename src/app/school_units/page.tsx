// Layout e componentes de UI
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// Componente cliente que renderiza a tabela interativa (usa hooks e estado no cliente)
import { SchoolUnitsDataTable } from "@/components/school-units/SchoolUnitsDataTable";

export default function SchoolUnitsPage() {
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
              {/* `SchoolUnitsDataTable` é um client component; busca via API paginada */}
              <SchoolUnitsDataTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}