"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Componente cliente para editar uma unidade escolar.
// Todos os comentários estão em português para servir de referência.
export default function EditSchoolUnitForm({
  unitId,
  defaultValues,
  ntes,
  municipalities,
  defaultMunicipalityId,
  defaultNteId,
  typologies,
  defaultTypologyId,
}: {
  unitId: number;
  defaultValues: { name: string; sec_cod: string; uo_code: string; status: string };
  ntes: { id: number; name: string }[];
  municipalities: { id: number; name: string; nte_id: number }[];
  defaultMunicipalityId?: number | null;
  defaultNteId?: number | null;
  typologies?: { id: number; name: string }[];
  defaultTypologyId?: number | null;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(defaultValues.name ?? "");
  const [secCod, setSecCod] = React.useState(defaultValues.sec_cod ?? "");
  const [uoCode, setUoCode] = React.useState(defaultValues.uo_code ?? "");
  const [status, setStatus] = React.useState(defaultValues.status ?? "1");
  // Estado para selects dependentes: NTE selecionado e Municipio selecionado
  const [selectedNte, setSelectedNte] = React.useState<string | null>(
    defaultNteId ? String(defaultNteId) : null
  );
  const [selectedMunicipality, setSelectedMunicipality] = React.useState<string | null>(
    defaultMunicipalityId ? String(defaultMunicipalityId) : null
  );
  const [selectedTypology, setSelectedTypology] = React.useState<string | null>(
    defaultTypologyId ? String(defaultTypologyId) : null
  );
  const [busy, setBusy] = React.useState(false);
  // Estado local para observações (textarea local, não persistido no banco)
  const [note, setNote] = React.useState<string>("");

  // Envia o PUT para atualizar a unidade
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: any = { name, sec_cod: secCod, uo_code: uoCode, status };
      if (selectedMunicipality) body.municipality = Number(selectedMunicipality);
      if (selectedTypology) body.typology = Number(selectedTypology);

      const res = await fetch(`/api/school_units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success("Unidade atualizada com sucesso.");
        // Atualiza a página/SSG data
        router.refresh();
      } else {
        const text = await res.text();
        let msg = text;
        try { const j = JSON.parse(text); msg = j?.error ?? j?.message ?? text; } catch (_) {}
        toast.error("Falha ao atualizar: " + msg);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao atualizar unidade.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <Label>Nome da Unidade</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {/* Coloca Código SEC, Código UO, Tipologia e Status na mesma linha em telas médias para frente */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label>Código SEC</Label>
          <Input value={secCod} onChange={(e) => setSecCod(e.target.value)} />
        </div>

        <div>
          <Label>UO Code</Label>
          <Input value={uoCode} onChange={(e) => setUoCode(e.target.value)} />
        </div>

        <div>
          <Label>Tipologia</Label>
          <Select
            value={selectedTypology ?? undefined}
            onValueChange={(v) => setSelectedTypology(v ?? null)}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="Selecione uma tipologia" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {typologies?.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          {/* Usa o Select compartilhado do design system para manter aparência consistente */}
          <Select value={status} onValueChange={(v) => setStatus(String(v))}>
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="1">Ativa</SelectItem>
              <SelectItem value="0">Inativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Linha com selects dependentes: NTE -> Município */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>NTE</Label>
          <Select
            value={selectedNte ?? undefined}
            onValueChange={(v) => {
              setSelectedNte(v ?? null);
              // Reset municipalidade quando NTE muda
              setSelectedMunicipality(null);
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="Selecione um NTE" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {ntes.map((n) => (
                <SelectItem key={n.id} value={String(n.id)}>
                  {n.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Município</Label>
          <Select
            value={selectedMunicipality ?? undefined}
            onValueChange={(v) => setSelectedMunicipality(v ?? null)}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="Selecione um município" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              {(selectedNte
                ? municipalities.filter((m) => m.nte_id === Number(selectedNte))
                : municipalities
              ).map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      

      {/* Campo de texto para observações livres sobre a unidade (não salvo no servidor) */}
      <div>
        <Label>Observações</Label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escreva algo sobre a unidade (não será salvo)"
          className="w-full mt-1 p-2 border rounded-md min-h-[100px] text-sm"
        />
      </div>


      {/* Botão de ação fica em linha separada, alinhado à direita */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
