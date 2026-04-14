// Página de busca de carências
// Renderiza o layout com sidebar e o componente `CarenciasDataTable`.

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import CarenciasDataTable from "@/components/carencias/CarenciasDataTable";

export default function CarenciasPage() {
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
          <h3 className="mb-4 mt-8 scroll-m-20 text-3xl font-bold tracking-tight">Buscar Carências</h3>

          <div className="flex flex-1 flex-col">
            <div className="flex flex-col gap-4 md:gap-6 md:py-4">
              <CarenciasDataTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
