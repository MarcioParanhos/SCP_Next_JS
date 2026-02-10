import React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School } from "lucide-react";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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

  // Buscamos também os últimos registros de homologação para a aba de Histórico
  const homologations = await prisma.homologation.findMany({
    where: { school_unit_id: id },
    orderBy: { createdAt: "desc" },
    take: 20,
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
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="info">Informações Gerais</TabsTrigger>
                  <TabsTrigger value="homolog">Homologação</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/* Botão de voltar no fim da linha das tabs */}
                <div className="ml-4">
                  <Link href="/school_units">
                    <Button variant="default" size="icon" aria-label="Voltar">
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-4 bg-background rounded-lg border">
                <TabsContent value="info">
                  {/*
                    Cartão com as Informações Gerais da unidade escolar.
                    Comentários em Português para orientar futuras alterações.
                  */}
                  <div className="p-6">
                    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200">

                      {/* Cabeçalho com avatar, título e badges */}
                      <CardHeader className="relative px-6 py-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                        <div className="flex items-center gap-4">
                          {/* Avatar com iniciais da unidade */}
                          <div className="flex-shrink-0">
                            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white">
                              {/* Ícone da escola substituindo as iniciais */}
                              <School className="h-6 w-6" />
                            </div>
                          </div>

                          <div className="flex-1">
                            <CardTitle className="text-xl leading-tight">{unit.name}</CardTitle>
                            <CardDescription className="mt-1 text-sm text-muted-foreground">
                              Código SEC: <span className="font-medium text-foreground">{unit.sec_cod}</span>
                              {" • "}
                              UO: <span className="font-medium text-foreground">{unit.uo_code}</span>
                            </CardDescription>
                          </div>

                          
                        </div>
                      </CardHeader>

                      {/* Conteúdo do cartão com blocos de informação e estatísticas */}
                      <CardContent>
                        {/* Linha com Município e Tipologia lado a lado */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-lg p-4 bg-gradient-to-b from-primary/5 to-transparent border">
                              <div className="text-sm text-muted-foreground">Município</div>
                              <div className="mt-1 text-lg font-semibold text-foreground">{unit.municipality?.name ?? "-"}</div>
                            </div>

                            <div className="rounded-lg p-4 bg-gradient-to-b from-secondary/5 to-transparent border">
                              <div className="text-sm text-muted-foreground">Tipologia</div>
                              <div className="mt-1 text-lg font-semibold text-foreground">{unit.typology?.name ?? "-"}</div>
                            </div>
                          </div>

                          <div className="rounded-lg p-4 bg-gradient-to-b from-accent/5 to-transparent border">
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="mt-1 text-lg font-semibold text-foreground">{unit.status === "1" ? "Ativa" : "Inativa"}</div>
                          </div>
                        </div>

                        {/* Códigos removidos conforme solicitado */}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="homolog">
                  {/* Aba de Homologação: cartão com ação e informações resumidas */}
                  <div className="p-6">
                    <Card className="shadow-sm">
                      <CardHeader className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Homologação</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                              Ações de homologação podem ser iniciadas aqui. (placeholder)
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Última ação: {homologations[0]?.action ?? "-"}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">Aqui ficará o formulário de homologação quando for adicionado.</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history">
                  {/* Aba de Histórico: lista das últimas homologações */}
                  <div className="p-6">
                    <Card className="shadow-sm">
                      <CardHeader className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent">
                        <CardTitle>Histórico de Homologações</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">Últimas ações registradas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {homologations.length === 0 ? (
                          <div className="text-muted-foreground">Nenhuma homologação registrada.</div>
                        ) : (
                          <ul className="divide-y">
                            {homologations.map((h) => (
                              <li key={h.id} className="py-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{h.action}</div>
                                    <div className="text-xs text-muted-foreground">{h.reason ?? "Sem observação"}</div>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
