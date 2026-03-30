"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function RealCarenciaForm() {
  const [units, setUnits] = React.useState<Array<any>>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedUnit, setSelectedUnit] = React.useState<string | null>(null);

  // disciplina rows: { id, discipline, morning, afternoon, night }
  const [rows, setRows] = React.useState<Array<any>>([]);

  // lista simples de disciplinas (pode vir do servidor futuramente)
  const disciplines = ["Matemática", "Português", "Ciências", "História", "Geografia"];

  const areas = ["Ensino Fundamental", "Ensino Médio", "Educação Infantil"];
  const motives = ["Substituição", "Aumento de carga", "Afastamento", "Licença"];

  const [selectedDiscipline, setSelectedDiscipline] = React.useState<string>("");
  const [selectedArea, setSelectedArea] = React.useState<string>("");
  const [selectedMotive, setSelectedMotive] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<string>("");

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/school_units?pageSize=200`);
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (!mounted) return;
        const list = json.data || [];
        setUnits(list);
        if (list.length > 0) setSelectedUnit(String(list[0].id));
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar unidades.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function addRow() {
    setRows((r) => [...r, { id: Date.now(), discipline: disciplines[0], area: "", reason: "", startDate: "", morning: 0, afternoon: 0, night: 0 }]);
  }

  function removeRow(id: number) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  function updateRow(id: number, patch: any) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      unitId: selectedUnit,
      discipline: selectedDiscipline,
      rows,
    };
    console.log("carencia payload:", payload);
    toast.success("Dados preparados (não salvos): ver console");
  }

  // detalhes da unidade selecionada (todos os campos retornados pela listagem)
  const selectedUnitData = React.useMemo(() => {
    return units.find((u) => String(u.id) === String(selectedUnit)) ?? null;
  }, [units, selectedUnit]);

  const isSelectedUnitHomologated = React.useMemo(() => {
    const status = selectedUnitData?.homologationStatus;
    return status === "HOMOLOGATED";
  }, [selectedUnitData]);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Carência Real</h1>
      <p className="mt-2 text-muted-foreground">Preencha os dados abaixo seguindo o padrão dos formulários de gerenciamento.</p>

      {isSelectedUnitHomologated && (
        <div className="mt-4">
          <div className="rounded-md p-2 border-l-4 border-amber-300 bg-amber-50 text-amber-800 text-sm">
            <div className="font-medium">Unidade homologada</div>
            <div className="mt-1">Para lançar uma carência é necessário primeiro retirar a homologação desta unidade. Abra a página da unidade para gerenciar homologações.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dados da Carência</CardTitle>
              <CardDescription className="mt-1">Selecione a unidade para carregar seus dados e prosseguir com o lançamento de carência.</CardDescription>
            </div>
            <CardAction>
              {/* Espaço para ações futuras (ex.: botão de ajuda) */}
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="mb-2">Unidade Escolar</Label>
                <Select value={selectedUnit ?? undefined} onValueChange={(v) => setSelectedUnit(v ?? null)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loading ? "Carregando..." : "Selecione uma unidade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.schoolUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedUnitData && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: "Código SEC", value: selectedUnitData.sec_code ?? selectedUnitData.sec_cod ?? "-" },
                  { label: "Código UO", value: selectedUnitData.uo_code ?? "-" },
                  { label: "Tipologia", value: selectedUnitData.typology ?? selectedUnitData.typology?.name ?? "-" },
                  { label: "Município", value: selectedUnitData.municipality ?? selectedUnitData.municipality?.name ?? "-" },
                  { label: "NTE", value: selectedUnitData.nte ?? (selectedUnitData.municipality?.nte?.name) ?? "-" },
                  { label: "Status", value: selectedUnitData.status === "1" ? "Ativa" : (selectedUnitData.status ?? "-") },
                ].map((it) => (
                  <div key={it.label} className="rounded-sm px-2 py-1 border border-muted-foreground/10 bg-transparent">
                    <div className="text-[10px] text-muted-foreground">{it.label}</div>
                    <div className="mt-1 text-xs font-medium text-foreground">{it.value}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Disciplina</CardTitle>
              <CardDescription className="mt-1">Selecione a disciplina associada à carência.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2">Disciplina</Label>
                <Select value={selectedDiscipline || undefined} onValueChange={(v) => setSelectedDiscipline(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Área</Label>
                <Select value={selectedArea || undefined} onValueChange={(v) => setSelectedArea(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Motivo da Carência</Label>
                <Select value={selectedMotive || undefined} onValueChange={(v) => setSelectedMotive(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {motives.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Início da Vaga</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSelectedUnitHomologated} title={isSelectedUnitHomologated ? "Remova a homologação antes de preparar a carência" : undefined}>
            Preparar Carência
          </Button>
        </div>
      </form>
    </main>
  );
}
