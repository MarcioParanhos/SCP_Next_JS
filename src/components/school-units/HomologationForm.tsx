"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Formulário de homologação/deshomologação
// - envia POST para `/api/school_units/:id/homologations`
// - aceita `onSaved` callback para atualizar a lista de histórico
export default function HomologationForm({ id, onSaved }: { id: number; onSaved?: () => void }) {
  const [submitting, setSubmitting] = React.useState(false);
  const [action, setAction] = React.useState<string>("HOMOLOGATED");
  const [reason, setReason] = React.useState<string>("");
  // Estado para saber se a unidade já está homologada (null = carregando)
  const [isHomologated, setIsHomologated] = React.useState<boolean | null>(null);

  // Carrega histórico para avaliar o último estado (mais recente)
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/school_units/${id}/homologations`);
        if (!res.ok) return setIsHomologated(false);
        const json = await res.json();
        const items = json.data ?? [];
        const latest = items[0]; // endpoint ordena por createdAt desc
        if (!mounted) return;
        setIsHomologated(latest?.action === "HOMOLOGATED");
        // define ação padrão de acordo com o estado atual (mas não confiamos somente nisso no submit)
        setAction(latest?.action === "HOMOLOGATED" ? "UNHOMOLOGATED" : "HOMOLOGATED");
      } catch (err) {
        console.error(err);
        if (mounted) setIsHomologated(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Determina a ação com base no estado atual para evitar inversões
      const actionToSend = isHomologated ? "UNHOMOLOGATED" : "HOMOLOGATED";

      // Validação: se estivermos retirando a homologação, o motivo é obrigatório
      if (actionToSend === "UNHOMOLOGATED" && (!reason || reason.trim() === "")) {
        toast.error("Informe o motivo para retirar a homologação");
        setSubmitting(false);
        return;
      }

      const payload = { action: actionToSend, reason };
      console.debug("Homologation payload:", payload);
      const res = await fetch(`/api/school_units/${id}/homologations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit");

      toast.success("Ação registrada");
      setReason("");
      // atualiza o estado do histórico no componente pai/listeners
      onSaved?.();
      // após criar a ação, recarregamos o status para manter consistência
      try {
        const statusRes = await fetch(`/api/school_units/${id}/homologations`);
        if (statusRes.ok) {
          const j = await statusRes.json();
          const latest = (j.data ?? [])[0];
          setIsHomologated(latest?.action === "HOMOLOGATED");
          setAction(latest?.action === "HOMOLOGATED" ? "UNHOMOLOGATED" : "HOMOLOGATED");
        }
      } catch (e) {
        console.error("Erro ao recarregar histórico após ação", e);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar ação");
    } finally {
      setSubmitting(false);
    }
  }
  // Se ainda estiver carregando o estado, exibe indicador simples
  if (isHomologated === null) return <div className="text-sm text-muted-foreground">Carregando status de homologação...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Se já homologada, oferecemos somente a ação de retirar homologação */}
      {isHomologated ? (
        <div>
          <div className="text-sm text-muted-foreground mb-2">Unidade atualmente <strong>homologada</strong>. Você pode retirar a homologação abaixo.</div>

          {/* Layout horizontal: textarea (flex-1) + botão à direita */}
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Label>Motivo (opcional)</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo para retirada..."
                className="w-full min-h-[88px] rounded border px-3 py-2 text-sm"
              />
            </div>

            <div className="shrink-0 self-end">
              <Button
                type="submit"
                variant="destructive"
                disabled={submitting || (isHomologated && (!reason || reason.trim() === ""))}
              >
                {submitting ? "Removendo..." : "Retirar Homologação"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm text-muted-foreground mb-2">Unidade não homologada. Você pode homologar abaixo.</div>

          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Label>Motivo (opcional)</Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo para homologação..."
                className="w-full min-h-[88px] rounded border px-3 py-2 text-sm"
              />
            </div>

            <div className="shrink-0 self-end">
              <Button type="submit" disabled={submitting}>{submitting ? "Registrando..." : "Homologar"}</Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
