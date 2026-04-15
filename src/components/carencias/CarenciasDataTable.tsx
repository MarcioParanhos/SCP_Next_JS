"use client";

// Componente de tabela para exibir carências agrupadas por Unidade Escolar e Servidor
// - Mostra colunas principais: Unidade Escolar, Servidor, Disciplina, Turnos (M/V/N), Tipo, Ações
// - Possui campo de busca integrado que consulta `/api/carencias?search=` (caso exista)
// Comentários em português conforme preferência do usuário.

import * as React from "react";
import { Filter, TableProperties } from "lucide-react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { IconLayoutColumns, IconChevronDown, IconDotsVertical, IconX, IconCheck, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";

type CarenciaRow = {
  id: number | string;
  schoolUnit: { id: number | string; name: string; code?: string; homologated?: boolean } | null;
  nte?: string | null;
  municipality?: string | null;
  servidor: { id: number | string; name: string; registration?: string } | null;
  discipline?: string | null;
  motive?: string | null;
  morning?: number;
  afternoon?: number;
  night?: number;
  tipo?: "REAL" | "TEMPORARY" | string;
  total?: number;
};

// Badge para exibir filtros ativos com botão de remoção (igual ao SchoolUnitsDataTable)
function FilterBadge({ label, value, onRemove }: { label: string; value: string; onRemove: () => void }) {
  return (
    <Badge className="flex items-center gap-2">
      <span className="font-medium">{label}:</span>
      <span className="max-w-xs truncate">{value}</span>
      <button onClick={onRemove} aria-label={`Remover filtro ${label}`} className="ml-2 p-1 rounded hover:bg-muted">
        <IconX className="w-3 h-3" />
      </button>
    </Badge>
  );
}

export function CarenciasDataTable() {
  // campo de busca livre removido — usamos apenas os filtros estruturados
  const [rows, setRows] = React.useState<CarenciaRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  // Paginação client-side
  const [pageSize, setPageSize] = React.useState(10);
  const [pageIndex, setPageIndex] = React.useState(0);
  // Filtros inteligentes (NTE -> Município, Disciplina)
  const [ntes, setNtes] = React.useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = React.useState<{ id: string; name: string }[]>([]);
  const [disciplines, setDisciplines] = React.useState<{ id: number; name: string }[]>([]);
  const [motives, setMotives] = React.useState<{ id: number; name: string }[]>([]);

  const [selectedNte, setSelectedNte] = React.useState<string | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = React.useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = React.useState<string | null>(null);
  const [selectedMotive, setSelectedMotive] = React.useState<string | null>(null);
  // Sheet (painel) de filtros avançados
  const [openSheet, setOpenSheet] = React.useState(false);
  const [sheetNte, setSheetNte] = React.useState<string>(selectedNte ?? "ALL");
  const [sheetMunicipality, setSheetMunicipality] = React.useState<string>(selectedMunicipality ?? "ALL");
  const [sheetUnitName, setSheetUnitName] = React.useState<string>("");
  const [sheetSecCode, setSheetSecCode] = React.useState<string>("");
  const [sheetDiscipline, setSheetDiscipline] = React.useState<string>(selectedDiscipline ?? "ALL");
  const [sheetType, setSheetType] = React.useState<string>("ALL");
  const [sheetMotive, setSheetMotive] = React.useState<string>(selectedMotive ?? "ALL");
  const [sheetRegistration, setSheetRegistration] = React.useState<string>("");
  const [appliedUnitName, setAppliedUnitName] = React.useState<string | null>(null);
  const [appliedSecCode, setAppliedSecCode] = React.useState<string | null>(null);
  const [appliedType, setAppliedType] = React.useState<string | null>(null);
  const [appliedMotive, setAppliedMotive] = React.useState<string | null>(null);
  const [appliedRegistration, setAppliedRegistration] = React.useState<string | null>(null);

  // Mapa de colunas para visibilidade customizável (Customizar Colunas)
  const columnDefs = [
    { id: "nte", label: "NTE" },
    { id: "municipality", label: "Município" },
    { id: "schoolUnit", label: "Unidade Escolar" },
    { id: "homologated", label: "Homologada" },
    { id: "servidor", label: "Servidor" },
    { id: "discipline", label: "Disciplina" },
    { id: "motive", label: "Motivo" },
    { id: "morning", label: "Manhã" },
    { id: "afternoon", label: "Tarde" },
    { id: "night", label: "Noite" },
    { id: "total", label: "Total" },
    { id: "tipo", label: "Tipo" },
  ] as const;
  const [colVisibility, setColVisibility] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(columnDefs.map((c) => [c.id, true]))
  );
  // Estado para controlar exclusão de carência
  const [deletingId, setDeletingId] = React.useState<number | string | null>(null);
  const show = (id: string) => colVisibility[id] !== false;
  const toggleCol = (id: string) => setColVisibility((prev) => ({ ...prev, [id]: !prev[id] }));

  React.useEffect(() => {
    buscarCarencias();
    carregarFiltrosIniciais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarFiltrosIniciais() {
    try {
      const [resNtes, resDisc] = await Promise.all([
        fetch("/api/ntes"),
        fetch("/api/disciplines?pageSize=500"),
      ]);
      if (resNtes.ok) {
        const ntesJson = await resNtes.json();
        setNtes(ntesJson ?? []);
      }
      if (resDisc.ok) {
        const discJson = await resDisc.json();
        setDisciplines(discJson.data ?? []);
      }
      // carregar motivos para filtro
      try {
        const resMot = await fetch("/api/motives?pageSize=500");
        if (resMot.ok) {
          const motJson = await resMot.json();
          const raw = motJson.data ?? motJson ?? [];
          const mapped = raw.map((m: any) => ({ id: m.id, name: m.description ?? m.name ?? m.code ?? String(m.id) }));
          setMotives(mapped);
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
  }

  type BuscaOpts = { q?: string; nteId?: string | null; municipalityId?: string | null; disciplineId?: string | null; typeFilter?: string | null; motiveId?: string | null; registration?: string | null };

  async function buscarCarencias(opts?: BuscaOpts) {
    // Usa valores do opts quando fornecidos (evita problema de stale closure após setState)
    const nteId        = opts && "nteId"        in opts ? opts.nteId        : selectedNte;
    const municipalityId = opts && "municipalityId" in opts ? opts.municipalityId : selectedMunicipality;
    const disciplineId = opts && "disciplineId" in opts ? opts.disciplineId : selectedDiscipline;
    const motiveId     = opts && "motiveId"     in opts ? opts.motiveId     : appliedMotive;
    const registration = opts && "registration" in opts ? opts.registration : appliedRegistration;
    const typeFilter   = opts && "typeFilter"   in opts ? opts.typeFilter   : appliedType;
    const q            = opts?.q;

    setLoading(true);
    try {
      const pageSize = 100;
      let all: CarenciaRow[] = [];
      let cursor: string | null = null;
      while (true) {
        const params = new URLSearchParams();
        params.set("pageSize", String(pageSize));
        if (cursor) params.set("cursor", cursor);
        if (q) params.set("search", q);
        if (nteId) params.set("nteId", nteId);
        if (municipalityId) params.set("municipalityId", municipalityId);
        if (disciplineId) params.set("disciplineId", disciplineId);
        if (motiveId) params.set("motiveId", motiveId);
        if (registration) params.set("registration", registration);
        if (typeFilter) params.set("type", typeFilter);

        const res = await fetch(`/api/carencias?${params.toString()}`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? "Erro ao buscar carências");
        }

        const json = await res.json();
        const chunk = json.data ?? [];
        all = all.concat(chunk);

        if (json.hasNext && json.nextCursor) {
          cursor = json.nextCursor;
        } else break;
      }

      setRows(all);

      // Enriquecer com NTEs faltantes consultando /api/school_units/:id
      try {
        const missing = Array.from(new Set(all.filter((r) => ((!r.nte || r.nte === null) || (!r.municipality || r.municipality === null)) && r.schoolUnit?.id).map((r) => String(r.schoolUnit?.id))));
        if (missing.length > 0) {
          await Promise.all(
            missing.map(async (id) => {
              try {
                const res = await fetch(`/api/school_units/${id}`);
                if (!res.ok) return;
                const json = await res.json();
                const nte = json?.data?.nte ?? null;
                const municipality = json?.data?.municipality ?? null;
                if (nte || municipality) {
                  setRows((prev) => prev.map((row) => (String(row.schoolUnit?.id) === id ? { ...row, nte, municipality } : row)));
                }
              } catch (e) {
                // ignore individual failures
              }
            })
          );
        }
      } catch (e) {
        // ignore enrichment errors
      }
    } catch (err: any) {
      setRows([]);
      toast.error(err?.message ?? "Não foi possível obter carências");
    } finally {
      setLoading(false);
    }
  }

  // função onSearch removida (busca livre removida)

  // Ao selecionar NTE, buscamos municípios relacionados e limpamos seleção de município
  React.useEffect(() => {
    if (!selectedNte) {
      setMunicipalities([]);
      setSelectedMunicipality(null);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/municipalities?nteId=${encodeURIComponent(selectedNte)}`);
        if (!res.ok) return;
        const json = await res.json();
        setMunicipalities(json ?? []);
        setSelectedMunicipality(null);
      } catch (e) {
        // ignore
      }
    })();
  }, [selectedNte]);

  // Quando o Sheet abre, inicializamos os campos do Sheet com os valores selecionados atuais
  React.useEffect(() => {
    if (openSheet) {
      setSheetNte(selectedNte ?? "ALL");
      setSheetMunicipality(selectedMunicipality ?? "ALL");
      setSheetDiscipline(selectedDiscipline ?? "ALL");
      setSheetMotive(selectedMotive ?? "ALL");
      setSheetRegistration(appliedRegistration ?? "");
      // carrega municípios para o sheet caso NTE já esteja definido
      if (selectedNte) {
        (async () => {
          try {
            const res = await fetch(`/api/municipalities?nteId=${encodeURIComponent(String(selectedNte))}`);
            if (!res.ok) return;
            const json = await res.json();
            setMunicipalities(json ?? []);
          } catch (e) {
            // ignore
          }
        })();
      }
    }
  }, [openSheet]);

  // Atualiza lista de municípios disponível no Sheet quando o valor do NTE do Sheet mudar
  React.useEffect(() => {
    if (!sheetNte || sheetNte === "ALL") {
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/municipalities?nteId=${encodeURIComponent(sheetNte)}`);
        if (!res.ok) return;
        const json = await res.json();
        setMunicipalities(json ?? []);
      } catch (e) {
        // ignore
      }
    })();
  }, [sheetNte]);

  // Aplicar filtros do Sheet: captura os valores antes de setar o estado para passar diretamente
  function applyFilters() {
    const newNte   = sheetNte === "ALL" ? null : sheetNte;
    const newMun   = sheetMunicipality === "ALL" ? null : sheetMunicipality;
    const newDisc  = sheetDiscipline === "ALL" ? null : sheetDiscipline;
    const newType  = sheetType === "ALL" ? null : sheetType;
    const newMot   = sheetMotive === "ALL" ? null : sheetMotive;
    const newReg   = sheetRegistration.trim() || null;
    const newUnit  = sheetUnitName.trim() || null;
    const newSec   = sheetSecCode.trim() || null;
    setSelectedNte(newNte);
    setSelectedMunicipality(newMun);
    setSelectedDiscipline(newDisc);
    setSelectedMotive(newMot);
    setAppliedType(newType);
    setAppliedUnitName(newUnit);
    setAppliedSecCode(newSec);
    setAppliedMotive(newMot);
    setAppliedRegistration(newReg);
    setOpenSheet(false);
    const searchFragments: string[] = [];
    if (newUnit) searchFragments.push(newUnit);
    if (newSec) searchFragments.push(newSec);
    if (newReg) searchFragments.push(newReg);
    buscarCarencias({ q: searchFragments.join(" ") || undefined, nteId: newNte, municipalityId: newMun, disciplineId: newDisc, typeFilter: newType, motiveId: newMot, registration: newReg });
  }

  function clearFilters() {
    setSheetNte("ALL");
    setSheetMunicipality("ALL");
    setSheetUnitName("");
    setSheetSecCode("");
    setSheetDiscipline("ALL");
    setSheetType("ALL");
    setSheetMotive("ALL");
    setSheetRegistration("");
    setSelectedNte(null);
    setSelectedMunicipality(null);
    setSelectedDiscipline(null);
    setAppliedType(null);
    setAppliedUnitName(null);
    setAppliedSecCode(null);
    setSelectedMotive(null);
    setAppliedMotive(null);
    setAppliedRegistration(null);
    buscarCarencias({ nteId: null, municipalityId: null, disciplineId: null, typeFilter: null });
  }

  function removeAppliedFilter(id: string) {
    const newNte  = id === "nte"        ? null : selectedNte;
    const newMun  = id === "municipality" ? null : selectedMunicipality;
    const newDisc = id === "discipline"  ? null : selectedDiscipline;
    const newType = id === "type"        ? null : appliedType;
    const newUnit = id === "unitName"    ? null : appliedUnitName;
    const newSec  = id === "secCode"     ? null : appliedSecCode;
    const newMot  = id === "motive"      ? null : appliedMotive;
    const newReg  = id === "registration" ? null : appliedRegistration;
    setSelectedNte(newNte);
    setSelectedMunicipality(newMun);
    setSelectedDiscipline(newDisc);
    setAppliedType(newType);
    setAppliedUnitName(newUnit);
    setAppliedSecCode(newSec);
    setSelectedMotive(newMot);
    setAppliedMotive(newMot);
    setAppliedRegistration(newReg);
    const searchFragments: string[] = [];
    if (newUnit) searchFragments.push(newUnit);
    if (newSec) searchFragments.push(newSec);
    if (newReg) searchFragments.push(newReg);
    buscarCarencias({ q: searchFragments.join(" ") || undefined, nteId: newNte, municipalityId: newMun, disciplineId: newDisc, typeFilter: newType, motiveId: newMot, registration: newReg });
  }

  // Filtros ativos para renderizar os badges
  const activeFilters = [
    ...(selectedNte        ? [{ id: "nte",        label: "NTE",        value: ntes.find((n) => n.id === selectedNte)?.name ?? selectedNte }] : []),
    ...(selectedMunicipality ? [{ id: "municipality", label: "Município",  value: municipalities.find((m) => m.id === selectedMunicipality)?.name ?? selectedMunicipality }] : []),
    ...(selectedDiscipline ? [{ id: "discipline",  label: "Disciplina", value: disciplines.find((d) => String(d.id) === selectedDiscipline)?.name ?? selectedDiscipline }] : []),
    ...(appliedUnitName    ? [{ id: "unitName",    label: "Unidade",    value: appliedUnitName }] : []),
    ...(appliedSecCode     ? [{ id: "secCode",     label: "Código SEC", value: appliedSecCode }] : []),
    ...(appliedType        ? [{ id: "type",        label: "Tipo",       value: appliedType === "REAL" ? "Real" : "Temporária" }] : []),
    ...(appliedMotive      ? [{ id: "motive",      label: "Motivo",     value: motives.find((m) => String(m.id) === appliedMotive)?.name ?? appliedMotive }] : []),
    ...(appliedRegistration ? [{ id: "registration", label: "Matrícula", value: appliedRegistration }] : []),
  ];

  // Agrupamento por contexto: quando o usuário filtra por NTE / Município / Unidade,
  // exibimos um card de contexto no topo e ocultamos as colunas redundantes.
  const contextParts: string[] = [];
  if (selectedNte) {
    contextParts.push(ntes.find((n) => n.id === selectedNte)?.name ?? selectedNte);
  }
  if (selectedMunicipality) {
    contextParts.push(municipalities.find((m) => m.id === selectedMunicipality)?.name ?? selectedMunicipality);
  }
  if (appliedUnitName) {
    contextParts.push(appliedUnitName);
  }
  const hasContext = contextParts.length > 0;

  const isContextHidden = (id: string) => {
    if (id === "nte" && selectedNte) return true;
    if (id === "municipality" && selectedMunicipality) return true;
    if (id === "schoolUnit" && appliedUnitName) return true;
    return false;
  };

  const showEff = (id: string) => show(id) && !isContextHidden(id);

  // Reseta para a primeira página sempre que os dados ou o tamanho de página mudar
  React.useEffect(() => {
    setPageIndex(0);
  }, [rows, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  return (
    <>
      <Tabs defaultValue="geral" className="w-full flex-col justify-start gap-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <Label htmlFor="carencia-view-selector" className="sr-only">Visualização</Label>
          <Select defaultValue="geral">
            <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="carencia-view-selector">
              <SelectValue placeholder="Selecionar aba" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
            </SelectContent>
          </Select>

          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="geral">
              <TableProperties /> Geral
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Customizar Colunas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customizar Colunas</span>
                  <span className="lg:hidden">Colunas</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {columnDefs.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={show(col.id)}
                    onCheckedChange={() => toggleCol(col.id)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filtros avançados (Sheet lateral) */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter />
                  <span className="hidden lg:inline">Filtros</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Filtros avançados</SheetTitle>
                  <SheetDescription>Filtre por NTE, município, unidade, código e disciplina.</SheetDescription>
                </SheetHeader>

                <div className="px-4 pb-4 flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label htmlFor="sheet-nte" className="mb-1">NTE</Label>
                      <Select value={sheetNte} onValueChange={(v) => setSheetNte(v)}>
                        <SelectTrigger id="sheet-nte" size="sm" className="w-full h-9">
                          <SelectValue placeholder="Selecione NTE" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Nenhum</SelectItem>
                          {ntes.map((n) => (<SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sheet-municipality" className="mb-1">Município</Label>
                      <Select value={sheetMunicipality} onValueChange={(v) => setSheetMunicipality(v)}>
                        <SelectTrigger id="sheet-municipality" size="sm" className="w-full h-9">
                          <SelectValue placeholder="Selecione município" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Nenhum</SelectItem>
                          {municipalities.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sheet-unitName" className="mb-2">Unidade Escolar</Label>
                    <Input id="sheet-unitName" className="w-full h-9" placeholder="Nome da unidade" value={sheetUnitName} onChange={(e) => setSheetUnitName(e.target.value)} />
                  </div>

                  <div>
                    <Label htmlFor="sheet-discipline" className="mb-1">Disciplina</Label>
                    <Select value={sheetDiscipline} onValueChange={(v) => setSheetDiscipline(v)}>
                      <SelectTrigger id="sheet-discipline" size="sm" className="w-full h-9">
                        <SelectValue placeholder="Selecione disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Nenhuma</SelectItem>
                        {disciplines.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sheet-motive" className="mb-1">Motivo</Label>
                    <Select value={sheetMotive} onValueChange={(v) => setSheetMotive(v)}>
                      <SelectTrigger id="sheet-motive" size="sm" className="w-full h-9">
                        <SelectValue placeholder="Selecione motivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Nenhum</SelectItem>
                        {motives.map((m) => (<SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sheet-registration" className="mb-2">Matrícula do servidor</Label>
                    <Input id="sheet-registration" className="w-full h-9" placeholder="Matrícula" value={sheetRegistration} onChange={(e) => setSheetRegistration(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="sheet-secCode" className="mb-2">Código SEC</Label>
                      <Input id="sheet-secCode" className="w-full h-9" placeholder="Código SEC" value={sheetSecCode} onChange={(e) => setSheetSecCode(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="sheet-tipo" className="mb-1">Tipo</Label>
                      <Select value={sheetType} onValueChange={(v) => setSheetType(v)}>
                        <SelectTrigger id="sheet-tipo" size="sm" className="w-full h-9">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos</SelectItem>
                          <SelectItem value="REAL">Real</SelectItem>
                          <SelectItem value="TEMPORARY">Temporária</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <SheetFooter>
                  <div className="flex items-center justify-between w-full">
                    <Button variant="ghost" onClick={clearFilters}>Limpar</Button>
                    <div className="flex gap-2">
                      <SheetClose asChild>
                        <Button variant="outline">Fechar</Button>
                      </SheetClose>
                      <Button onClick={applyFilters}>Aplicar</Button>
                    </div>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* botão 'Adicionar Carência' removido conforme solicitado */}
          </div>
        </div>

        <TabsContent value="geral" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
          {/* Card de contexto quando filtrado por NTE/Município/Unidade */}
          {hasContext && (
            <div className="p-3 bg-muted rounded-md mb-2">
              <div className="text-sm text-muted-foreground">Exibindo carências para:</div>
              <div className="font-medium">{contextParts.join(" | ")}</div>
            </div>
          )}

          {/* Barra de filtros ativos */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {activeFilters.map((f) => (
                <FilterBadge key={f.id} label={f.label} value={f.value} onRemove={() => removeAppliedFilter(f.id)} />
              ))}
              <Button variant="ghost" size="sm" onClick={clearFilters}>Limpar filtros</Button>
              <div role="status" aria-live="polite" className="sr-only">{activeFilters.length} filtro(s) ativo(s)</div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10 border-b-2 border-muted-foreground/30">
                <TableRow>
                {showEff("nte")          && <TableHead className="w-24 font-semibold">NTE</TableHead>}
                {showEff("municipality") && <TableHead className="w-36 font-semibold">Município</TableHead>}
                {showEff("schoolUnit")   && <TableHead className="font-semibold">Unidade Escolar</TableHead>}
                {showEff("homologated")  && <TableHead className="w-24 font-semibold">Homologada</TableHead>}
                {showEff("servidor")     && <TableHead className="font-semibold">Servidor</TableHead>}
                {showEff("discipline")   && <TableHead className="font-semibold">Disciplina</TableHead>}
                {showEff("motive")       && <TableHead className="font-semibold">Motivo</TableHead>}
                {showEff("morning")      && <TableHead className="w-20 text-center font-semibold"><span className="hidden sm:inline">Manhã</span><span className="inline sm:hidden">M</span></TableHead>}
                {showEff("afternoon")    && <TableHead className="w-20 text-center font-semibold"><span className="hidden sm:inline">Tarde</span><span className="inline sm:hidden">T</span></TableHead>}
                {showEff("night")        && <TableHead className="w-20 text-center font-semibold"><span className="hidden sm:inline">Noite</span><span className="inline sm:hidden">N</span></TableHead>}
                {showEff("total")        && <TableHead className="w-24 text-center font-semibold">Total</TableHead>}
                {showEff("tipo")         && <TableHead className="w-28 font-semibold">Tipo</TableHead>}
                  <TableHead className="w-12 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {loading ? (
                  <>
                    {Array.from({ length: 6 }).map((_, rIdx) => (
                      <TableRow key={`skeleton-${rIdx}`}>
                        {Array.from({ length: Object.values(colVisibility).filter(Boolean).length + 1 }).map((_, cIdx) => (
                          <TableCell key={`s-${rIdx}-${cIdx}`}>
                            <div className="h-4 bg-muted/30 rounded animate-pulse w-full my-2" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                      Nenhuma carência encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((r) => (
                    <TableRow key={String(r.id)}>
                      {showEff("nte")          && <TableCell className="text-sm text-muted-foreground">{r.nte ?? <span className="text-muted-foreground">—</span>}</TableCell>}
                      {showEff("municipality") && <TableCell className="text-sm text-muted-foreground">{r.municipality ?? <span className="text-muted-foreground">—</span>}</TableCell>}
                      {showEff("schoolUnit")   && (
                        <TableCell>
                          <div className="max-w-55">
                            <div className="font-medium truncate">{r.schoolUnit?.name ? r.schoolUnit.name : <span className="text-muted-foreground">—</span>}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.schoolUnit?.code ?? ""}</div>
                          </div>
                        </TableCell>
                      )}
                      {showEff("homologated") && (
                        <TableCell className="text-center">
                          {r.schoolUnit?.homologated ? (
                            <Badge className="bg-green-600 text-white w-20 justify-center flex items-center gap-2">
                              <IconCheck className="w-4 h-4" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground w-20 justify-center flex items-center gap-2">
                              <IconX className="w-4 h-4" />
                              Não
                            </Badge>
                          )}
                        </TableCell>
                      )}
                      {showEff("servidor") && (
                        <TableCell>
                          <div className="max-w-45">
                            <div className="font-medium truncate">{r.servidor?.name ? r.servidor.name : <span className="text-muted-foreground">—</span>}</div>
                            <div className="text-xs text-muted-foreground truncate">{r.servidor?.registration ?? ""}</div>
                          </div>
                        </TableCell>
                      )}
                      {showEff("discipline")   && <TableCell>{r.discipline ? r.discipline : <span className="text-muted-foreground">—</span>}</TableCell>}
                      {showEff("motive")       && <TableCell className="whitespace-normal max-w-xs">{r.motive ? r.motive : <span className="text-muted-foreground">—</span>}</TableCell>}
                      {showEff("morning")      && <TableCell className="text-center">{r.morning ?? 0}</TableCell>}
                      {showEff("afternoon")    && <TableCell className="text-center">{r.afternoon ?? 0}</TableCell>}
                      {showEff("night")        && <TableCell className="text-center">{r.night ?? 0}</TableCell>}
                      {showEff("total")        && <TableCell className="text-center font-semibold">{r.total ?? (Number(r.morning || 0) + Number(r.afternoon || 0) + Number(r.night || 0))}</TableCell>}
                      {showEff("tipo") && (
                        <TableCell>
                          <Badge className={`${r.tipo === "REAL" ? "bg-blue-600 text-white" : r.tipo === "TEMPORARY" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"} w-20 justify-center`}>
                            {r.tipo === "REAL" ? "Real" : r.tipo === "TEMPORARY" ? "Temporária" : (r.tipo ? r.tipo : <span className="text-muted-foreground">—</span>)}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="data-[state=open]:bg-muted text-muted-foreground flex size-8" size="icon">
                              <IconDotsVertical />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setDeletingId(r.id); }} className="text-destructive">
                                  <Trash2 className="size-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
              <ConfirmDialog
                open={deletingId !== null}
                onOpenChange={(v) => { if (!v) setDeletingId(null); }}
                title="Excluir carência"
                description="Deseja realmente excluir esta carência? Esta ação não pode ser desfeita."
                confirmLabel="Excluir"
                onConfirm={async () => {
                  if (deletingId == null) return;
                  try {
                    const res = await fetch(`/api/carencias/${deletingId}`, { method: "DELETE" });
                    const j = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      toast.error(j.error ?? "Erro ao excluir carência");
                    } else {
                      toast.success("Carência excluída com sucesso");
                      // Recarrega os dados
                      buscarCarencias();
                    }
                  } catch (e) {
                    toast.error("Erro de conexão. Tente novamente.");
                  } finally {
                    setDeletingId(null);
                  }
                }}
              />

          {/* Rodapé de paginação */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {rows.length} registro(s) no total
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page-carencias" className="text-sm font-medium">
                  Linhas por página
                </Label>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page-carencias">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((ps) => (
                      <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Página {pageIndex + 1} de {pageCount}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setPageIndex(0)}
                  disabled={pageIndex === 0}
                >
                  <span className="sr-only">Ir para a primeira página</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  disabled={pageIndex === 0}
                >
                  <span className="sr-only">Ir para a página anterior</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
                  disabled={pageIndex >= pageCount - 1}
                >
                  <span className="sr-only">Ir para a próxima página</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => setPageIndex(pageCount - 1)}
                  disabled={pageIndex >= pageCount - 1}
                >
                  <span className="sr-only">Ir para a última página</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>

        </TabsContent>
      </Tabs>
    </>
  );
}

export default CarenciasDataTable;
