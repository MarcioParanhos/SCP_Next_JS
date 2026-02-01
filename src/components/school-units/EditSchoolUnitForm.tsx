"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Formulário de edição da unidade escolar (componente cliente).
// - Recebe `initialData` para popular os campos inicialmente.
// - Ao submeter, faz uma chamada `PUT /api/school_units/:id` com os campos alterados.
// - Quando a API retorna o item atualizado, chama `onSaved(updated)` para
//   que o componente pai sincronize o estado (atualização local imediata).
export default function EditSchoolUnitForm({
  id,
  initialData,
  onSaved,
}: {
  id: number;
  initialData: any;
  onSaved?: (updated: any) => void;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [schoolUnit, setSchoolUnit] = React.useState(initialData.schoolUnit ?? "");
  const [secCode, setSecCode] = React.useState(initialData.sec_code ?? "");
  const [typology, setTypology] = React.useState(initialData.typology ?? "");
  const [status, setStatus] = React.useState(initialData.status ?? "1");

  // handleSubmit: prepara payload e chama o endpoint PUT para atualizar
  // - usa `id` para construir a URL
  // - trata erros e mostra feedback com `toast`
  // - em sucesso, repassa o DTO retornado via `onSaved`
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        schoolUnit,
        sec_code: secCode,
        typology,
        status,
      };

      const res = await fetch(`/api/school_units/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update");

      const json = await res.json();
      // Feedback visual para o usuário
      toast.success("Unidade atualizada");
      // Atualiza o pai com o objeto retornado (DTO)
      onSaved?.(json.data ?? json);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar unidade");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nome da unidade</Label>
        <Input value={schoolUnit} onChange={(e) => setSchoolUnit(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Código SEC</Label>
          <Input value={secCode} onChange={(e) => setSecCode(e.target.value)} />
        </div>
        <div>
          <Label>Tipologia</Label>
          <Select value={typology} onValueChange={(v) => setTypology(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEDE">SEDE</SelectItem>
              <SelectItem value="ANEXO">ANEXO</SelectItem>
              <SelectItem value="CEMIT">CEMIT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Ativo</SelectItem>
            <SelectItem value="0">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>{submitting ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}
