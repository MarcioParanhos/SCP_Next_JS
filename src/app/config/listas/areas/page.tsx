// Página de CRUD de Áreas Pedagógicas de Carência
// Rota: /config/listas/areas
// Permite listar, adicionar, editar e desativar áreas.

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AreasDataTable } from "@/components/admin/lists/areas/AreasDataTable";

export default function AreasPage() {
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
        <div className="p-6">
          {/* Cabeçalho da página */}
          <h1 className="mb-1 scroll-m-20 text-3xl font-bold tracking-tight">Áreas</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Gerencie as áreas pedagógicas utilizadas nos formulários de carência.
          </p>
          {/* Tabela interativa com ações de CRUD */}
          <AreasDataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
