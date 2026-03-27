"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle, ShieldCheck, ShieldOff, UserPen, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// Schema de validação para a ação de retirada de homologação
// O motivo é obrigatório com mínimo de 10 caracteres para garantir uma
// justificativa mínima significativa.
const removeSchema = z.object({
  reason: z.string().min(10, "O motivo deve ter pelo menos 10 caracteres"),
});

type RemoveFormValues = z.infer<typeof removeSchema>;

// Representa um registro de homologação retornado pelo servidor
// - `id`: identificador único do registro
// - `action`: "HOMOLOGATED" | "UNHOMOLOGATED"
// - `reason`: motivo informado (somente em UNHOMOLOGATED)
// - `performed_by`: e-mail/nome do usuário que executou a ação
// - `createdAt`: data/hora do registro (string ISO ou Date)
interface HomologationRecord {
  id: number;
  action: string;
  reason?: string | null;
  performed_by?: string | null;
  createdAt: string | Date;
}

interface HomologationFormProps {
  unitId: number;
  lastAction: string | null; // "HOMOLOGATED" | "UNHOMOLOGATED" | null
  // ID do usuário logado (session.user.id) — usado como FK ao salvar a homologação
  performedBy?: string;
  // Lista completa de registros de homologação passada pelo Server Component
  // Exibida na seção de histórico dentro desta mesma aba
  homologations?: HomologationRecord[];
}

export function HomologationForm({
  unitId,
  lastAction,
  performedBy,
  homologations = [],
}: HomologationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const isHomologated = lastAction === "HOMOLOGATED";

  const removeForm = useForm<RemoveFormValues>({
    resolver: zodResolver(removeSchema),
    defaultValues: { reason: "" },
  });

  // Envia a ação HOMOLOGATED para a API
  async function handleHomologate() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/school_units/${unitId}/homologations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "HOMOLOGATED", performed_by_id: performedBy }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erro ao homologar");
      }
      toast.success("Unidade homologada com sucesso!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao homologar");
    } finally {
      setSubmitting(false);
    }
  }

  // Envia a ação UNHOMOLOGATED com o motivo obrigatório para a API
  async function handleRemoveHomologation(values: RemoveFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/school_units/${unitId}/homologations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UNHOMOLOGATED",
          reason: values.reason,
          performed_by_id: performedBy,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erro ao retirar homologação");
      }
      toast.success("Homologação retirada com sucesso!");
      removeForm.reset();
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao retirar homologação");
    } finally {
      setSubmitting(false);
    }
  }

  // Rótulo do status atual para exibição no badge
  const statusLabel = isHomologated
    ? "Homologada"
    : lastAction === "UNHOMOLOGATED"
    ? "Homologação Retirada"
    : "Não Homologada";

  return (
    <div className="space-y-6">
      {/* Card com status atual e título da seção */}
      <Card className="w-full shadow-sm">
        <CardHeader className="px-6 py-4 bg-linear-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Homologação</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Gerencie o status de homologação desta unidade escolar
              </CardDescription>
            </div>
            <Badge
              variant={isHomologated ? "default" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Grade com os dois painéis de ação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Painel: Homologar */}
        <Card className={`shadow-sm transition-opacity ${isHomologated ? "opacity-50" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Homologar Unidade</CardTitle>
            </div>
            <CardDescription>
              {isHomologated
                ? "Esta unidade já está homologada."
                : "Clique para registrar a homologação desta unidade."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleHomologate}
              disabled={isHomologated || submitting}
              className="w-full"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Homologar
            </Button>
          </CardContent>
        </Card>

        {/* Painel: Retirar Homologação (com formulário e motivo obrigatório) */}
        <Card className={`shadow-sm transition-opacity ${!isHomologated ? "opacity-50" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              <CardTitle className="text-base">Retirar Homologação</CardTitle>
            </div>
            <CardDescription>
              {!isHomologated
                ? "A unidade não está homologada no momento."
                : "Informe o motivo para retirar a homologação."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...removeForm}>
              <form
                onSubmit={removeForm.handleSubmit(handleRemoveHomologation)}
                className="space-y-4"
              >
                <FormField
                  control={removeForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Motivo{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva o motivo para retirar a homologação..."
                          disabled={!isHomologated || submitting}
                          className="min-h-25 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={!isHomologated || submitting}
                  className="w-full"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Retirar Homologação
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* ----------------------------------------------------------------
          Histórico de Homologações
          - Movido da aba "Histórico" para cá, mantendo tudo relacionado
            à homologação em um único lugar.
          - Exibe: ação traduzida, motivo (quando UNHOMOLOGATED),
            usuário que executou (performed_by) e data/hora.
          - Paginação local de 10 itens por página (estado `histPage`).
          - Quando não há registros, exibe mensagem informativa.
          ---------------------------------------------------------------- */}
      <HomologationHistory homologations={homologations} />
    </div>
  );
}

// -----------------------------------------------------------------------
// Componente separado para o histórico de homologações com paginação.
// - Recebe `homologations` como prop (lista completa já ordenada desc).
// - Controla a página atual via estado local `histPage`.
// - Exibe 10 itens por página com navegação por botões Anterior / Próximo.
// -----------------------------------------------------------------------
const HIST_PAGE_SIZE = 10;

function HomologationHistory({ homologations }: { homologations: HomologationRecord[] }) {
  // Página atual da paginação (base 0)
  const [histPage, setHistPage] = React.useState(0);

  const totalPages = Math.max(1, Math.ceil(homologations.length / HIST_PAGE_SIZE));

  // Fatia da lista correspondente à página atual
  const pageItems = homologations.slice(
    histPage * HIST_PAGE_SIZE,
    (histPage + 1) * HIST_PAGE_SIZE
  );

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="px-6 py-4 bg-linear-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Homologações</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Últimas ações registradas para esta unidade
            </CardDescription>
          </div>
          {/* Contador total de registros */}
          {homologations.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {homologations.length} {homologations.length === 1 ? "registro" : "registros"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {homologations.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            Nenhuma homologação registrada.
          </div>
        ) : (
          <>
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-2 bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Ação / Detalhes</span>
              <span>Data e Hora</span>
            </div>

            {/* Lista de itens da página atual */}
            <ul className="divide-y">
              {pageItems.map((h, idx) => {
                // Traduz a ação para português e define a cor do badge
                const isHom = h.action === "HOMOLOGATED";
                const actionLabel = isHom
                  ? "Homologada"
                  : h.action === "UNHOMOLOGATED"
                  ? "Homologação Retirada"
                  : h.action;

                // Número sequencial global do item (considerando a página)
                const itemNumber = histPage * HIST_PAGE_SIZE + idx + 1;

                return (
                  <li
                    key={h.id}
                    className="flex flex-col gap-4 px-6 py-5 hover:bg-muted/20 transition-colors"
                  >
                    {/* Linha principal: número + badge (esquerda) | data (direita) */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Número sequencial do registro na lista paginada */}
                        <div className="flex items-center justify-center h-7 w-7 rounded-full border bg-background text-xs font-semibold text-muted-foreground shrink-0 mt-0.5">
                          {itemNumber}
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-0">
                          {/* Badge da ação com cor contextual */}
                          <Badge
                            className={
                              isHom
                                ? "w-fit bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-medium"
                                : "w-fit bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 font-medium"
                            }
                          >
                            {actionLabel}
                          </Badge>
                        </div>
                      </div>

                      {/* Data e hora com ícone Clock em círculo temático */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 pt-0.5">
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground shrink-0">
                          <Clock className="h-4 w-4" />
                        </div>
                        <span className="whitespace-nowrap">{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>

                    {/* Motivo: linha separada abaixo, ocupando toda a largura do item.
                        Exibido apenas quando a ação é UNHOMOLOGATED. */}
                    {h.reason && (
                      <div className="w-full rounded-md border bg-muted/30 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Motivo</p>
                        <p className="text-sm leading-snug">{h.reason}</p>
                      </div>
                    )}

                    {/* Usuário que executou a ação — abaixo da caixa de motivo */}
                    {h.performed_by && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground shrink-0">
                          <UserPen className="h-4 w-4" />
                        </div>
                        <span className="text-xs text-muted-foreground">{h.performed_by}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* -------------------------------------------------------
                Rodapé de paginação
                - Exibe "Página X de Y" e botões Anterior / Próximo.
                - Botões são desabilitados quando não há página anterior/próxima.
                ------------------------------------------------------- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Página {histPage + 1} de {totalPages}
                  <span className="ml-2 text-muted-foreground/60">
                    ({homologations.length} {homologations.length === 1 ? "registro" : "registros"})
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistPage((p) => p - 1)}
                    disabled={histPage === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistPage((p) => p + 1)}
                    disabled={histPage >= totalPages - 1}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
