// Página principal do painel de administração de Listas Suspensas.
// Rota: /config/listas
// Exibe o accordion com as categorias de listas disponíveis na aplicação.
// Cada sub-item do accordion leva a uma tela de CRUD específica.

import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ListsPanel } from "@/components/admin/lists/ListsPanel";
import { BookOpen, Tag, FileText, Settings2 } from "lucide-react";

export default function ListasSuspensasPage() {
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
          {/* Cabeçalho da seção */}
          <h1 className="mb-1 scroll-m-20 text-3xl font-bold tracking-tight">
            Listas Suspensas
          </h1>
          <p className="mb-6 text-muted-foreground text-sm">
            Gerencie as listas de domínio utilizadas nos formulários da aplicação.
          </p>

          {/* Painel de Carência — adicione novos ListsPanel ao lado quando precisar de outras categorias */}
               <div className="flex flex-wrap gap-4 p-6">
            <ListsPanel
              panelId="panel-carencia"
              categorias={[
                {
                  value: "carencia",
                  titulo: "Carência",
                  icone: <BookOpen className="size-4 shrink-0" />,
                  descricao: "Listas utilizadas nos formulários de carência",
                  itens: [
                    { titulo: "Áreas", descricao: "Áreas pedagógicas de carência", href: "/config/listas/areas", icone: <Tag className="size-4" /> },
                    { titulo: "Disciplinas", descricao: "Disciplinas / componentes curriculares", href: "/config/listas/disciplinas", icone: <FileText className="size-4" /> },
                    { titulo: "Motivos de Carência", descricao: "Motivos de carência real e temporária", href: "/config/listas/motivos", icone: <Settings2 className="size-4" /> },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
