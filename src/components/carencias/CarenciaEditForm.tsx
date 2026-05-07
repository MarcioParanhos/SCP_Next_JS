"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X, Save, User } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import ServerSearch from "@/components/server/ServerSearch";

type Row = {
  id?: number;
  discipline: string;
  area: string;
  morning: number;
  afternoon: number;
  night: number;
};

type Option = { id: number | string; name: string };

type Props = {
  carenciaId: number;
  initial: {
    server_id?: number | null;
    server_name?: string | null;
    motive_id?: number | null;
    area_id?: number | null;
    discipline_id?: number | null;
    rows: Row[];
  };
  servidores: Option[];
  motives: Option[];
  areas: Option[];
  disciplines: Option[];
};

export default function CarenciaEditForm({ carenciaId, initial, motives, areas, disciplines }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  // Servidor com busca
  const [serverQuery, setServerQuery]           = React.useState<string>(initial.server_name ?? "");
  const [debouncedQuery, setDebouncedQuery]     = React.useState<string>("");
  const [servers, setServers]                   = React.useState<any[]>([]);
  const [loadingServers, setLoadingServers]     = React.useState(false);
  const [resultsOpen, setResultsOpen]           = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [selectedServer, setSelectedServer]     = React.useState<any | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [motiveId, setMotiveId]         = React.useState<string>(initial.motive_id     ? String(initial.motive_id)     : "");
  const [areaId, setAreaId]             = React.useState<string>(initial.area_id       ? String(initial.area_id)       : "");
  const [disciplineId, setDisciplineId] = React.useState<string>(initial.discipline_id ? String(initial.discipline_id) : "");
  const [rows, setRows]                 = React.useState<Row[]>(initial.rows);
  const [saving, setSaving]             = React.useState(false);

  // Debounce
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(serverQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [serverQuery]);

  // Listen for CustomEvent dispatched by the header Edit button
  React.useEffect(() => {
    function handler() {
      setOpen(true);
    }
    window.addEventListener("open-carencia-edit", handler);
    return () => window.removeEventListener("open-carencia-edit", handler);
  }, []);

  // Fetch servidores quando query mudar
  React.useEffect(() => {
    if (!debouncedQuery) { setServers([]); return; }
    let mounted = true;
    (async () => {
      setLoadingServers(true);
      try {
        const res = await fetch(`/api/servidores?q=${encodeURIComponent(debouncedQuery)}&pageSize=20`);
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) { setServers(json.data ?? []); setHighlightedIndex(0); setResultsOpen(true); }
      } catch { /* ignore */ } finally {
        if (mounted) setLoadingServers(false);
      }
    })();
    return () => { mounted = false; };
  }, [debouncedQuery]);

  function updateRow(idx: number, field: "morning" | "afternoon" | "night", value: number) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/carencias/${carenciaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server_id:     selectedServer?.id ?? (initial.server_id ?? null),
          motive_id:     motiveId     || null,
          area_id:       areaId       || null,
          discipline_id: disciplineId || null,
          rows: rows.map((r) => ({
            discipline: r.discipline || null,
            area:       r.area       || null,
            morning:    Number(r.morning   || 0),
            afternoon:  Number(r.afternoon || 0),
            night:      Number(r.night     || 0),
          })),
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Carência atualizada com sucesso");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {open && (
        <div className="mt-5 rounded-xl border bg-card shadow-lg overflow-hidden">
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-3 bg-muted/40 border-b">
            <span className="text-sm font-semibold tracking-tight">Editar Carência</span>
            <button
              aria-label="Fechar edição"
              onClick={() => setOpen(false)}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 p-2 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-6 py-6 flex flex-col gap-7">

            {/* ── Servidor ───────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-0.5">
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Servidor</span>
              </div>
              {selectedServer ? (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{selectedServer.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Matrícula: {selectedServer.enrollment ?? "-"} • {selectedServer.bond_type ?? "-"} • {selectedServer.work_schedule ?? "-"}
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedServer(null); setServerQuery(""); }}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-4"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <ServerSearch
                  serverQuery={serverQuery}
                  setServerQuery={setServerQuery}
                  loading={loadingServers}
                  servers={servers}
                  resultsOpen={resultsOpen}
                  setResultsOpen={setResultsOpen}
                  highlightedIndex={highlightedIndex}
                  setHighlightedIndex={setHighlightedIndex}
                  inputRef={inputRef}
                  onSelectServer={(s) => { setSelectedServer(s); setResultsOpen(false); setServerQuery(s.name); }}
                />
              )}
            </div>

            {/* ── Motivo / Área / Disciplina ─────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-1">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Motivo</Label>
                <Select value={motiveId} onValueChange={setMotiveId}>
                  <SelectTrigger className="h-14 text-sm px-3 w-140 truncate">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                   <SelectContent>
                    <SelectItem value="0">— Nenhum —</SelectItem>
                    {motives.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Área</Label>
                <Select value={areaId} onValueChange={setAreaId}>
                  <SelectTrigger className="h-14 text-sm px-3 w-140 truncate">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                   <SelectContent>
                    <SelectItem value="0">— Nenhuma —</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disciplina</Label>
                <Select value={disciplineId} onValueChange={setDisciplineId}>
                  <SelectTrigger className="h-14 text-sm px-3 w-140 truncate">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                   <SelectContent>
                    <SelectItem value="0">— Nenhuma —</SelectItem>
                    {disciplines.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Quantidades por turno ──────────────────────────── */}
            {rows.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantidades por Turno</span>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>

                        <th className="text-center font-semibold px-3 py-2.5 text-xs text-muted-foreground w-24">Manhã</th>
                        <th className="text-center font-semibold px-3 py-2.5 text-xs text-muted-foreground w-24">Tarde</th>
                        <th className="text-center font-semibold px-3 py-2.5 text-xs text-muted-foreground w-24">Noite</th>
                        <th className="text-center font-semibold px-3 py-2.5 text-xs text-muted-foreground w-20">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => {
                        const total = Number(r.morning || 0) + Number(r.afternoon || 0) + Number(r.night || 0);
                        return (
                          <tr key={idx} className="border-t hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-2">
                              <Input type="number" min={0} value={r.morning}
                                onChange={(e) => updateRow(idx, "morning", Number(e.target.value))}
                                className="h-14 text-sm text-center w-full" />
                            </td>
                            <td className="px-3 py-2">
                              <Input type="number" min={0} value={r.afternoon}
                                onChange={(e) => updateRow(idx, "afternoon", Number(e.target.value))}
                                className="h-14 text-sm text-center w-full" />
                            </td>
                            <td className="px-3 py-2">
                              <Input type="number" min={0} value={r.night}
                                onChange={(e) => updateRow(idx, "night", Number(e.target.value))}
                                className="h-14 text-sm text-center w-full" />
                            </td>
                            <td className="px-3 py-2 text-center font-semibold tabular-nums text-sm">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Ações ──────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" size="lg" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button size="lg" className="flex items-center gap-2" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-14" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
