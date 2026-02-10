import React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) redirect("/login");

  // `params` can be a Promise in some Next.js versions/environments —
  // await it before accessing properties to avoid sync-dynamic-apis errors.
  const awaitedParams = await params as { id: string };
  const id = Number(awaitedParams.id);
  if (Number.isNaN(id)) return <div>Id inválido</div>;

  // Página propositalmente em branco (conteúdo vazio), mas mantendo o layout
  // do dashboard (sidebar + header). Útil quando se quer abrir uma rota sem
  // expor a tela de detalhe completa.
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
        <div className="flex flex-1 items-center justify-center p-8">
          {/* Conteúdo intencionalmente vazio */}
          <div className="text-muted-foreground">&nbsp;</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
