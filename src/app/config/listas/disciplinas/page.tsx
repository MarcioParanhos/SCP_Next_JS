// Página de CRUD de Disciplinas / Componentes Curriculares
// Rota: /config/listas/disciplinas
// Permite listar, adicionar, editar e excluir disciplinas.

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DisciplinasDataTable } from "@/components/admin/lists/disciplinas/DisciplinasDataTable";

export default function DisciplinasPage() {
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
          <h1 className="mb-1 scroll-m-20 text-3xl font-bold tracking-tight">Disciplinas</h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Gerencie os componentes curriculares utilizados nos formulários de carência.
          </p>
          {/* Tabela interativa com ações de CRUD */}
          <DisciplinasDataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
