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
                    <Card className="overflow-hidden">
                      {/* Cabeçalho colorido com gradiente do tema */}
                      <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
                        <div className="flex items-start justify-between w-full gap-4">
                          <div>
                            <CardTitle className="flex items-center gap-3 text-lg">
                              {unit.name}
                              {/* Badge com status usando cores do tema */}
                              <Badge variant={unit.status === "1" ? "default" : "destructive"}>
                                {unit.status === "1" ? "Ativa" : "Inativa"}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {/* Código SEC e UO exibidos com destaque */}
                              <span className="text-sm text-muted-foreground">
                                Código SEC: <span className="font-medium text-foreground">{unit.sec_cod}</span>
                                {" • "}
                                UO: <span className="font-medium text-foreground">{unit.uo_code}</span>
                              </span>
                            </CardDescription>
                          </div>

                          {/* Espaço para ações futuras (botões) */}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{unit.municipality?.name ?? "-"}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Linha com município e tipologia com cores sutis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="rounded-md p-3 bg-gradient-to-b from-primary/5 to-transparent">
                            <div className="text-sm text-muted-foreground">Município</div>
                            <div className="font-semibold text-foreground">{unit.municipality?.name ?? "-"}</div>
                          </div>
                          <div className="rounded-md p-3 bg-gradient-to-b from-secondary/5 to-transparent">
                            <div className="text-sm text-muted-foreground">Tipologia</div>
                            <div className="font-semibold text-foreground">{unit.typology?.name ?? "-"}</div>
                          </div>
                          <div className="rounded-md p-3 bg-gradient-to-b from-accent/5 to-transparent">
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="font-semibold text-foreground">{unit.status}</div>
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
