// Página: /servidores
// - Exibe a lista de servidores cadastrados no sistema.
// - Segue o mesmo padrão de layout das demais páginas do projeto (school_units).
// - O componente `ServidoresDataTable` é um client component que gerencia
//   estado, busca via API e renderiza a tabela com tabs.

// Componentes de layout compartilhados (sidebar, header, container)
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Componente cliente principal da página (carrega dados e renderiza tabela)
import { ServidoresDataTable } from "@/components/servidores/ServidoresDataTable";

export default function ServidoresPage() {
  return (
    // SidebarProvider: contexto global da sidebar com largura customizada via CSS vars
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      {/* Sidebar lateral com os itens de navegação */}
      <AppSidebar variant="inset" />

      {/* Área de conteúdo principal (à direita da sidebar) */}
      <SidebarInset>
        {/* Cabeçalho fixo do topo da página */}
        <SiteHeader />

        {/* Título da página */}
        <div className="p-4">
          <h3 className="mb-4 mt-8 scroll-m-20 text-3xl font-bold tracking-tight">
            Lista de Servidores
          </h3>
        </div>

        {/* Container do conteúdo principal */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 md:gap-6 md:py-4">
              {/*
                ServidoresDataTable é um client component.
                - Busca dados via API paginada em /api/servidores
                - Renderiza a tabela com tabs, filtros, paginação e ações
              */}
              <ServidoresDataTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
