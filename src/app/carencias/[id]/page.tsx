import React from "react";

// Layout e UI compartilhados do sistema
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Undo2 } from "lucide-react";
import { formatDateLocal } from "@/lib/formatDate";
import CarenciaEditForm from "@/components/carencias/CarenciaEditForm";
import CarenciaEditButton from "@/components/carencias/CarenciaEditButton";

// Página de detalhe de uma carência
export default async function Page({ params }: { params: { id: string } }) {
  // Verifica sessão; se não houver, redireciona para login
  const session = await getServerSession(authOptions as any);
  if (!session) redirect("/login");

  const awaitedParams = (await params) as { id: string };
  const id = Number(awaitedParams.id);
  if (Number.isNaN(id)) return <div>Id inválido</div>;

  // Buscar carência com relacionamentos úteis para exibição
  // Inclui `createdBy` para mostrar quem criou o registro
  let carencia = await prisma.carencia.findUnique({
    where: { id },
    include: {
      schoolUnit: { include: { municipality: { include: { nte: true } } } },
      server: true,
      discipline: true,
      motive: true,
      area: true,
      course: true,
      rows: true,
      createdBy: true,
    },
  }) as any;

  // Se as linhas detalhadas armazenarem um id de área em vez do nome (ex.: "1"),
  // fazemos um lookup em `Area` e substituímos pelo nome legível.
  if (carencia?.rows && carencia.rows.length > 0) {
    const areaIds = Array.from(
      new Set(
        carencia.rows
          .map((r: any) => (r.area && String(r.area).match(/^\d+$/) ? Number(r.area) : null))
          .filter(Boolean)
      )
    ) as number[];
    if (areaIds.length > 0) {
      const areaList = await prisma.area.findMany({ where: { id: { in: areaIds } } });
      const areaById = Object.fromEntries(areaList.map((a) => [String(a.id), a.name]));
      carencia.rows = carencia.rows.map((r: any) => ({
        ...r,
        area: r.area && areaById[String(r.area)] ? areaById[String(r.area)] : r.area,
      }));
    }
  }

  // Buscar listas para os selects do formulário de edição
  const [servidoresList, motivesList, areasList, disciplinesList] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.motive.findMany({ where: { active: true }, select: { id: true, description: true }, orderBy: { description: "asc" } }),
    prisma.area.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.discipline.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // Mantemos layout consistente com as outras páginas do sistema
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
        <div className="flex flex-1 flex-col p-8">
          {/* Conteúdo ocupa toda a largura disponível (sem limite de max-width) */}
          <div className="w-full h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-semibold">Detalhe da Carência</h1>
                <div className="text-sm text-muted-foreground">Exibindo informações detalhadas da carência selecionada</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/carencias">
                  <Button variant="default" size="icon" aria-label="Voltar">
                    <Undo2 className="w-4 h-4" />
                  </Button>
                </Link>
                <CarenciaEditButton />
              </div>
            </div>

            {!carencia ? (
              <Card>
                <CardContent>
                  <div>Carência não encontrada.</div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Card principal ocupa toda a largura disponível */}
                <Card className="mb-4 w-full">
                  <CardHeader className="px-6 py-4 bg-primary/5">
                    <CardTitle className="text-lg">{carencia.schoolUnit?.name ?? `Carência #${carencia.id}`}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Unidade: {carencia.schoolUnit?.sec_cod ?? "-"} • Tipo: {carencia.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="rounded-lg p-3 border">
                        <div className="text-sm text-muted-foreground">NTE / Município</div>
                        <div className="font-medium">{carencia.schoolUnit?.municipality?.nte?.name ?? "-"} / {carencia.schoolUnit?.municipality?.name ?? "-"}</div>
                      </div>

                      <div className="rounded-md p-3 border">
                        <div className="text-sm text-muted-foreground">Servidor</div>
                        <div className="font-medium">{carencia.server ? carencia.server.name : "-"}</div>
                        <div className="text-xs text-muted-foreground">Matrícula: {carencia.server?.enrollment ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">Vínculo: {carencia.server?.bond_type ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">Regime: {carencia.server?.work_schedule ?? "-"}</div>
                      </div>

                      <div className="rounded-lg p-3 border">
                        <div className="text-sm text-muted-foreground">Motivo / Área</div>
                        <div className="font-medium">{carencia.motive?.description ?? carencia.motive?.code ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">Área: {carencia.area?.name ?? "-"}</div>
                      </div>

                      <div className="rounded-lg p-3 border">
                        <div className="text-sm text-muted-foreground">Disciplina principal</div>
                        <div className="font-medium">{carencia.discipline?.name ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">Curso: {carencia.course?.name ?? "-"}</div>
                      </div>
                    </div>

                    {/* 'Criado por' removido conforme solicitado */}

                    {/* Formulário de edição inline */}
                    <div id="edit-form">
                      <CarenciaEditForm
                        carenciaId={carencia.id}
                        initial={{
                          server_id:       carencia.server_id       ?? null,
                          server_name:     carencia.server?.name    ?? null,
                          motive_id:       carencia.motive_id       ?? null,
                          area_id:         carencia.area_id         ?? null,
                          discipline_id:   carencia.discipline_id   ?? null,
                          discipline_name: carencia.discipline?.name ?? null,
                          observations:    carencia.observations    ?? "",
                          rows: (carencia.rows ?? []).map((r: any) => ({
                            id:        r.id,
                            discipline: r.discipline ?? "",
                            area:       r.area       ?? "",
                            morning:    r.morning    ?? 0,
                            afternoon:  r.afternoon  ?? 0,
                            night:      r.night      ?? 0,
                          })),
                        }}
                        servidores={[]}
                        motives={motivesList.map((m) => ({ id: m.id, name: m.description }))}
                        areas={areasList.map((a) => ({ id: a.id, name: a.name }))}
                        disciplines={disciplinesList.map((d) => ({ id: d.id, name: d.name }))}
                      />
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-muted-foreground">Linhas detalhadas</div>
                      <div className="overflow-hidden rounded-lg border mt-2">
                        <Table>
                          <TableHeader>
                              <TableRow>
                                <TableHead className="font-semibold">Disciplina</TableHead>
                                <TableHead className="font-semibold">Área</TableHead>
                                <TableHead className="text-center font-semibold">Manhã</TableHead>
                                <TableHead className="text-center font-semibold">Tarde</TableHead>
                                <TableHead className="text-center font-semibold">Noite</TableHead>
                                <TableHead className="text-center font-semibold">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                          <TableBody>
                            {carencia.rows && carencia.rows.length > 0 ? (
                              carencia.rows.map((r: any) => (
                                <TableRow key={r.id}>
                                  <TableCell>{r.discipline ?? "-"}</TableCell>
                                  <TableCell>{r.area ?? "-"}</TableCell>
                                  <TableCell className="text-center">{r.morning ?? 0}</TableCell>
                                  <TableCell className="text-center">{r.afternoon ?? 0}</TableCell>
                                  <TableCell className="text-center">{r.night ?? 0}</TableCell>
                                  <TableCell className="text-center font-semibold">{Number(r.morning || 0) + Number(r.afternoon || 0) + Number(r.night || 0)}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhuma linha detalhada registrada.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-sm text-muted-foreground mb-2">Observações</div>
                      <textarea
                        aria-label="Observações"
                        defaultValue={carencia.observations ?? ""}
                        readOnly
                        className="w-full min-h-[12vh] max-h-[30vh] p-3 rounded-md border bg-background resize-vertical"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-muted text-muted-foreground">
                    Criado em: {formatDateLocal(carencia.createdAt)}
                    {carencia.createdBy?.name ? ` • por ${carencia.createdBy.name}` : ""}
                  </Badge>
                  <Badge className="bg-muted text-muted-foreground">Atualizado em: {formatDateLocal(carencia.updatedAt)}</Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
