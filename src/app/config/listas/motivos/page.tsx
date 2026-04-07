// Página de CRUD de Motivos de Carência
// Rota: /config/listas/motivos
// Permite listar, adicionar, editar e desativar motivos de carência (REAL e TEMPORÁRIA).

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MotivosDataTable } from "@/components/admin/lists/motivos/MotivosDataTable";

export default function MotivosPage() {
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
          <h1 className="mb-1 scroll-m-20 text-3xl font-bold tracking-tight">Motivos de Carência</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Gerencie os motivos de carência real e temporária utilizados nos formulários.
          </p>
          {/* Tabela interativa com ações de CRUD */}
          <MotivosDataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
