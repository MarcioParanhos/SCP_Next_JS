import { AppSidebar } from "@/components/layout/app-sidebar";
import { ChartAreaInteractive } from "@/components/layout/chart-area-interactive";
import { DataTable } from "@/components/layout/data-table";
import { SectionCards } from "@/components/layout/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import data from "./data.json";
// Server-side session check
// - Importa `getServerSession` a partir do NextAuth para verificar a sessão
// - Usa `authOptions` exportado pela rota NextAuth para garantir que a
//   verificação utilize a mesma configuração (adapter, callbacks, secret)
// - Se não houver sessão, redireciona para a página de login
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Page() {
  // Executado no servidor: validar sessão do usuário antes de renderizar
  // - `getServerSession` retorna `null` quando o usuário não está autenticado
  // - usamos `redirect('/login')` do Next.js app-router para encaminhar
  const session = await getServerSession(authOptions as any);
  if (!session) {
    // Redireciona para a tela de login se não estiver autenticado
    redirect("/login");
  }
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
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
