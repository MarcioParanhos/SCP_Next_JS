import React from "react";

// Componentes do layout e UI
import { AppSidebar } from "@/components/layout/app-sidebar"; // barra lateral principal do dashboard
import { SiteHeader } from "@/components/site-header"; // cabeçalho do site (usuário, pesquisa, etc)
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"; // provider para layout com sidebar inset

// Componentes visuais reutilizáveis (Card, Tabs, Button, Badge)
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// Ícones e navegação
import { School, Undo2 } from "lucide-react"; // ícone da escola e ícone de voltar (Undo2)
import Link from "next/link"; // componente de link do Next.js (navegação entre rotas)

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Page({ params }: { params: { id: string } }) {
  // Validação de sessão: usamos next-auth no servidor para verificar se o
  // usuário está autenticado. Se não estiver, redirecionamos para a tela de login.
  const session = await getServerSession(authOptions as any);
  if (!session) redirect("/login");

  // Em algumas versões/ambientes do Next.js `params` pode ser uma Promise.
  // Para evitar erros relacionados a uso síncrono de APIs dinâmicas, aguardamos
  // (`await`) antes de acessar `params.id`.
  const awaitedParams = (await params) as { id: string };
  const id = Number(awaitedParams.id);
  if (Number.isNaN(id)) return <div>Id inválido</div>;

  // ================================================================
  // Busca de dados no servidor (Prisma)
  // - `unit`: entidade `schoolUnit` com relacionamento para município e tipologia
  // - `homologations`: últimas homologações relacionadas à unidade
  // Esses dados são obtidos no servidor para permitir renderização do lado do
  // servidor (Server Component) e evitar fetches adicionais no cliente.
  // ================================================================
  const unit = await prisma.schoolUnit.findUnique({
    where: { id },
    include: { municipality: true, typology: true },
  });

  const homologations = await prisma.homologation.findMany({
    where: { school_unit_id: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // ================================================================
  // Caso a unidade não exista: renderizamos rapidamente a mesma estrutura de
  // layout (sidebar + header) para manter consistência visual com o resto do
  // dashboard, mas mostramos uma mensagem simples ao usuário.
  // ================================================================
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

  // ================================================================
  // Estrutura principal da página
  // - `SidebarProvider` + `AppSidebar` mantém o layout do dashboard
  // - `SiteHeader` exibe o cabeçalho com informações do usuário
  // - Dentro do `SidebarInset` montamos o conteúdo principal com largura
  //   controlada (`max-w-6xl`) para manter o conteúdo legível
  // ================================================================
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

            {/*
              Abas superiores: usamos um componente `Tabs` para separar três
              seções: Informações Gerais, Homologação e Histórico. O título das
              abas é meramente visual aqui — o conteúdo de cada aba está abaixo
              em `TabsContent`.
            */}
            <Tabs defaultValue="info">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="info">Informações Gerais</TabsTrigger>
                  <TabsTrigger value="homolog">Homologação</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                {/*
                  Botão de voltar:
                  - Só ícone (`Undo2`) para economia de espaço
                  - Usa a variante `default` do `Button`, que aplica o fundo
                    primário do tema (`bg-primary`) conforme `buttonVariants`
                  - `aria-label` para acessibilidade já que não há texto
                */}
                <div className="ml-4">
                  <Link href="/school_units">
                    <Button variant="default" size="icon" aria-label="Voltar">
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/*
                Container que envolve as abas e o conteúdo. Utilizamos
                classes utilitárias para fundo, borda e cantos arredondados.
              */}
              <div className="mt-4 bg-background rounded-lg border">
                <TabsContent value="info">
                  {/*
                    Cartão principal com Informações Gerais da unidade escolar.
                    Estrutura do Card:
                    - `CardHeader`: avatar (ícone), título e descrição breve
                    - `CardContent`: blocos de informação (Município, Tipologia,
                      Status) dispostos em grid para responsividade
                  */}
                  <div className="p-6">
                    <Card className="overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200">

                      {/*
                        Cabeçalho do cartão:
                        - usamos um pequeno gradiente de fundo para destaque
                        - avatar com ícone da escola (cor primária do tema)
                        - título principal com o nome da unidade
                        - descrição abaixo com Código SEC e UO
                      */}
                      <CardHeader className="relative px-6 py-6 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                        <div className="flex items-center gap-4">
                          {/* Avatar com ícone da escola */}
                          <div className="flex-shrink-0">
                            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white">
                              <School className="h-6 w-6" />
                            </div>
                          </div>

                          {/* Título e descrição curta */}
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

                      {/*
                        Conteúdo do cartão:
                        - Grid com três colunas em telas grandes: duas colunas
                          para Município/Tipologia e uma para Status
                        - Cada bloco é um cartão interno com leve gradiente e
                          borda para dar profundidade visual
                      */}
                      <CardContent>
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

                        {/* Códigos removidos conforme solicitação do usuário */}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/*
                  Aba de Homologação:
                  - placeholder que indica onde o formulário de homologação
                    será incluído se houver necessidade futura
                  - o `Badge` à direita mostra a última ação registrada
                */}
                <TabsContent value="homolog">
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

                {/*
                  Aba de Histórico:
                  - lista simples (server-rendered) das últimas homologações
                  - cada item mostra ação, observação (reason) e timestamp
                */}
                <TabsContent value="history">
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
