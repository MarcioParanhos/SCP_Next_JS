import React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any);
  if (!session) redirect("/login");

  // `params` can be a Promise in some Next.js versions/environments —
  // await it before accessing properties to avoid sync-dynamic-apis errors.
  const awaitedParams = await params as { id: string };
  const id = Number(awaitedParams.id);
  if (Number.isNaN(id)) return <div>Id inválido</div>;

  // Página que mantém o layout do dashboard (sidebar + header) e exibe abas.
  // Aqui buscamos os dados da unidade escolar via Prisma no servidor e
  // mostramos um cartão com as Informações Gerais.

  // Busca a unidade escolar no banco de dados pelo `id`.
  const unit = await prisma.schoolUnit.findUnique({
    where: { id },
    include: { municipality: true, typology: true },
  });

  // Se não existir, mostramos uma mensagem simples.
  if (!unit) {
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
            <div>Unidade não encontrada</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
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
        <div className="flex flex-1 flex-col p-8">
          <div className="max-w-6xl w-full mx-auto">
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Informações Gerais</TabsTrigger>
                <TabsTrigger value="homolog">Homologação</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <div className="mt-4 bg-background rounded-lg border">
                <TabsContent value="info">
                  {/*
                    Cartão com as Informações Gerais da unidade escolar.
                    Comentários em Português para orientar futuras alterações.
                  */}
                  <div className="p-6">
                    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200">
                      {/* Barra de destaque à esquerda */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary" />

                      {/* Cabeçalho com avatar, título e badges */}
                      <CardHeader className="relative px-6 py-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                        <div className="flex items-center gap-4">
                          {/* Avatar com iniciais da unidade */}
                          <div className="flex-shrink-0">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-primary/40 to-secondary/40 flex items-center justify-center text-white font-semibold text-lg">
                              {(() => {
                                const initials = (unit.name || "").split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
                                return initials || "U";
                              })()}
                            </div>
                          </div>

                          <div className="flex-1">
                            <CardTitle className="text-xl leading-tight flex items-center gap-3">
                              {unit.name}
                              <Badge variant={unit.status === "1" ? "default" : "destructive"}>
                                {unit.status === "1" ? "Ativa" : "Inativa"}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm text-muted-foreground">
                              Código SEC: <span className="font-medium text-foreground">{unit.sec_cod}</span>
                              {" • "}
                              UO: <span className="font-medium text-foreground">{unit.uo_code}</span>
                            </CardDescription>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{unit.municipality?.name ?? "-"}</Badge>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Conteúdo do cartão com blocos de informação e estatísticas */}
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="rounded-lg p-4 bg-gradient-to-b from-primary/5 to-transparent border">
                            <div className="text-sm text-muted-foreground">Município</div>
                            <div className="mt-1 text-lg font-semibold text-foreground">{unit.municipality?.name ?? "-"}</div>
                          </div>

                          <div className="rounded-lg p-4 bg-gradient-to-b from-secondary/5 to-transparent border">
                            <div className="text-sm text-muted-foreground">Tipologia</div>
                            <div className="mt-1 text-lg font-semibold text-foreground">{unit.typology?.name ?? "-"}</div>
                          </div>

                          <div className="rounded-lg p-4 bg-gradient-to-b from-accent/5 to-transparent border">
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="mt-1 text-lg font-semibold text-foreground">{unit.status}</div>
                          </div>
                        </div>

                        {/* Pequenas métricas ou informações auxiliares */}
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex flex-col items-start p-3 rounded-md bg-surface/50">
                            <div className="text-xs text-muted-foreground">ID</div>
                            <div className="font-medium text-foreground">{unit.id}</div>
                          </div>
                          <div className="flex flex-col items-start p-3 rounded-md bg-surface/50">
                            <div className="text-xs text-muted-foreground">SEC</div>
                            <div className="font-medium text-foreground">{unit.sec_cod}</div>
                          </div>
                          <div className="flex flex-col items-start p-3 rounded-md bg-surface/50">
                            <div className="text-xs text-muted-foreground">UO</div>
                            <div className="font-medium text-foreground">{unit.uo_code}</div>
                          </div>
                          <div className="flex flex-col items-start p-3 rounded-md bg-surface/50">
                            <div className="text-xs text-muted-foreground">Tipologia ID</div>
                            <div className="font-medium text-foreground">{unit.typology_id ?? "-"}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="homolog">
                  <div className="p-6 text-muted-foreground">Conteúdo de Homologação (vazio)</div>
                </TabsContent>
                <TabsContent value="history">
                  <div className="p-6 text-muted-foreground">Conteúdo de Histórico (vazio)</div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
