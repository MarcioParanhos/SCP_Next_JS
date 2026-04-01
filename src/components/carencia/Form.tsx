"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { CircleUserRound, X, Tag, Check, School } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function RealCarenciaForm() {
  // Estado que contém a lista de unidades escolares carregadas da API.
  // Tipo: Array<any> — no futuro podemos substituir por um tipo específico `SchoolUnit`.
  const [units, setUnits] = React.useState<Array<any>>([]);

  // ID (string) da unidade selecionada no formulário. `null` significa nenhuma seleção.
  // Mantemos como string porque os valores do Select são strings.
  const [selectedUnit, setSelectedUnit] = React.useState<string | null>(null);
  const [selectedUnitData, setSelectedUnitData] = React.useState<any | null>(null);

  // Search/autocomplete state for school units (to avoid loading all 1700 at once)
  const [unitQuery, setUnitQuery] = React.useState<string>("");
  const [debouncedUnitQuery, setDebouncedUnitQuery] = React.useState<string>("");
  const [loadingUnitResults, setLoadingUnitResults] = React.useState<boolean>(false);
  const [unitResultsOpen, setUnitResultsOpen] = React.useState<boolean>(false);
  const [unitHighlightedIndex, setUnitHighlightedIndex] = React.useState<number>(-1);
  const unitResultsRef = React.useRef<HTMLDivElement | null>(null);
  const unitInputRef = React.useRef<HTMLInputElement | null>(null);

  // Estrutura de linhas de disciplina/carga — atualmente usada para extender o formulário
  // cada item tem formato aproximado: { id, discipline, area, reason, startDate, morning, afternoon, night }
  // IDs são `Date.now()` no exemplo; em produção prefira UUIDs ou ids do banco.
  const [rows, setRows] = React.useState<Array<any>>([]);

  // Dados estáticos de exemplo para popular selects. Em integração real, buscar do servidor.
  // Mantidos localmente aqui para simplificar a UI durante o desenvolvimento.
  const disciplines = ["Matemática", "Português", "Ciências", "História", "Geografia"];
  const areas = ["Ensino Fundamental", "Ensino Médio", "Educação Infantil"];
  const motives = ["Substituição", "Aumento de carga", "Afastamento", "Licença"];

  // Opções específicas para tipo profissionalizante
  const cursos = ["Técnico em Informática", "Técnico em Administração", "Técnico em Enfermagem"];
  const eixos = ["Tecnologia", "Gestão e Negócios", "Saúde"];

  // Estados controlados para os campos do card "Dados da Carência".
  // Inicializamos com string vazia para facilitar binding a controles HTML/Componentes.
  const [selectedDiscipline, setSelectedDiscipline] = React.useState<string>("");
  const [selectedArea, setSelectedArea] = React.useState<string>("");
  const [selectedMotive, setSelectedMotive] = React.useState<string>("");
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedCurso, setSelectedCurso] = React.useState<string>("");
  const [selectedEixo, setSelectedEixo] = React.useState<string>("");

  // Quantitativos por turno (MAT / VESP / NOT) e total dinâmico
  const [morningCount, setMorningCount] = React.useState<number>(0);
  const [afternoonCount, setAfternoonCount] = React.useState<number>(0);
  const [nightCount, setNightCount] = React.useState<number>(0);
  const totalCount = React.useMemo(() => morningCount + afternoonCount + nightCount, [morningCount, afternoonCount, nightCount]);

  // Tipo de carência selecionado (controla abas). Usamos a mesma base de form
  // para todos os tipos — abas apenas alteram o 'tipo' que será enviado.
  const [tipo, setTipo] = React.useState<string>("basica");

  // Estados para seleção do servidor que gerou a carência
  // `servers`: lista simples carregada via API (página única)
  const [servers, setServers] = React.useState<Array<any>>([]);
  // ID do servidor selecionado (employee id)
  const [selectedServer, setSelectedServer] = React.useState<string | null>(null);
  // objeto completo do servidor selecionado — usado para mostrar o card com detalhes
  const [selectedServerData, setSelectedServerData] = React.useState<any | null>(null);
  const [loadingServers, setLoadingServers] = React.useState<boolean>(true);
  // Query para busca incremental de servidores (autocomplete)
  const [serverQuery, setServerQuery] = React.useState<string>("");
  const [debouncedServerQuery, setDebouncedServerQuery] = React.useState<string>("");
  // UX: index do item destacado na lista de resultados para navegação por teclado
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  // controla se a lista está aberta (para cliques fora e foco)
  const [resultsOpen, setResultsOpen] = React.useState<boolean>(false);
  // `resultsRef` aponta para o contêiner dos resultados da busca — usado para
  // detectar cliques fora e manter o foco correto ao navegar por teclado.
  const resultsRef = React.useRef<HTMLDivElement | null>(null);
  // `inputRef` é a referência do campo de busca; útil para foco programático
  // e para integrar melhorias de acessibilidade/automação futuramente.
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // We don't pre-load all units (there are ~1700). Use a debounced autocomplete
  // to search units on demand to keep the UI responsive.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedUnitQuery(unitQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [unitQuery]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // require at least 3 chars to avoid heavy/ambiguous searches that return many results
      if (debouncedUnitQuery.length < 3) {
        setUnits([]);
        setUnitResultsOpen(false);
        return;
      }
      try {
        setLoadingUnitResults(true);
        const params = new URLSearchParams();
        params.set("q", debouncedUnitQuery);
        params.set("pageSize", "20");
        const res = await fetch(`/api/school_units?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        // Client-side filter to avoid showing irrelevant matches.
        // Behavior:
        // - If query is numeric: treat as code/id search — match SEC or UO codes (exact or contains)
        // - Otherwise: match by name, SEC or UO (case-insensitive substring)
        const raw = json.data || [];
        const q = debouncedUnitQuery.toLowerCase().trim();
        const isNumeric = /^\d+$/.test(q);
        const filtered = raw.filter((u: any) => {
          const name = (u.schoolUnit || "").toLowerCase();
          const sec = String(u.sec_code ?? u.id ?? "").toLowerCase();
          const uo = String(u.uo_code ?? "").toLowerCase();
          const municipality = (typeof u.municipality === 'string' ? u.municipality : (u.municipality?.name ?? ''))?.toLowerCase();
          if (isNumeric) {
            return sec === q || sec.includes(q) || uo === q || uo.includes(q);
          }
          return name.includes(q) || sec.includes(q) || uo.includes(q) || municipality.includes(q);
        });
        setUnits(filtered);
        setUnitHighlightedIndex(0);
        setUnitResultsOpen(true);
      } catch (err) {
        console.error("Erro ao buscar unidades:", err);
      } finally {
        if (mounted) setLoadingUnitResults(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedUnitQuery]);

  // Close unit results on outside click
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = unitResultsRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setUnitResultsOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Efeito separado para carregar servidores (lista paginada simplificada)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/servidores?pageSize=200`);
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        if (!mounted) return;
        const list = json.data || [];
        setServers(list);
        if (list.length > 0) {
          setSelectedServer(String(list[0].id));
          setSelectedServerData(list[0]);
        }
      } catch (err) {
        console.error(err);
        // não mostramos toast extra aqui para evitar spam caso a rota não exista em dev
      } finally {
        if (mounted) setLoadingServers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Debounce simples para evitar chamadas a cada tecla
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedServerQuery(serverQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [serverQuery]);

  // Sempre que `debouncedServerQuery` mudar, buscamos servidores filtrados.
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      // Se consulta vazia, não sobrescrevemos a lista já carregada (mantemos primeira página).
      // Observação: aqui a busca é feita no servidor (`/api/servidores?q=...`) para
      // escalar melhor quando tivermos milhares de servidores — o servidor já
      // aplica ordenação/limite para resultados relevantes.
      if (debouncedServerQuery === "") return;
      try {
        setLoadingServers(true);
        const params = new URLSearchParams();
        params.set("q", debouncedServerQuery);
        params.set("pageSize", "20");
        const res = await fetch(`/api/servidores?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setServers(json.data || []);
        setHighlightedIndex(0);
        setResultsOpen(true);
      } catch (err) {
        console.error("Erro ao buscar servidores:", err);
      } finally {
        if (mounted) setLoadingServers(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [debouncedServerQuery]);

  // Fecha a lista quando clicar fora
  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = resultsRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setResultsOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Adiciona uma linha de disciplina ao formulário (utilizada para múltiplas vagas por unidade).
  // Nota: aqui usamos `Date.now()` para gerar um id temporário; em implem. real prefira um id robusto.
  function addRow() {
    setRows((r) => [...r, { id: Date.now(), discipline: disciplines[0], area: "", reason: "", startDate: "", morning: 0, afternoon: 0, night: 0 }]);
  }

  // Remove uma linha pelo `id` gerado.
  function removeRow(id: number) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  // Atualiza parcialmente uma linha: recebe o `id` e um `patch` com os campos a alterar.
  // Útil para inputs controlados dentro de uma linha (p.ex. alterar quantidades por turno).
  function updateRow(id: number, patch: any) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  // Handler do submit do formulário. Atualmente apenas monta e loga o payload.
  // Pontos a considerar para persistência real:
  // - Validação do payload (campos obrigatórios, formatos de data, quantidades >= 0, etc.)
  // - Proteção contra envio duplicado (desabilitar botão até resposta)
  // - Endpoint API para salvar a carência e tratamento de erros/retorno
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      unitId: selectedUnit,
      serverId: selectedServer,
      discipline: selectedDiscipline,
      area: selectedArea,
      motive: selectedMotive,
      startDate: selectedDate,
      rows,
    };
    // Em desenvolvimento apenas imprimimos no console. Substituir por `fetch('/api/carencias', { method: 'POST', body: JSON.stringify(payload) })` quando o endpoint existir.
    console.log("carencia payload:", payload);
    toast.success("Dados preparados (não salvos): ver console");
  }

  // selectedUnitData é guardado no estado quando o usuário escolhe uma unidade
  // a fim de evitar depender da lista `units` (que é apenas resultados da busca).

  // Verifica se a unidade está homologada. Se estiver, bloqueamos o envio da carência
  // e mostramos um aviso discreto — regra de negócio definida pelo produto.
  const isSelectedUnitHomologated = React.useMemo(() => {
    const status = selectedUnitData?.homologationStatus;
    return status === "HOMOLOGATED";
  }, [selectedUnitData]);

  return (
    <main className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Carência Real</h1>
        <div aria-hidden className="ml-4 flex-shrink-0">
          <div className="inline-flex items-center gap-2 rounded-md px-3 py-1 bg-primary text-primary-foreground shadow">
            <Tag className="h-4 w-4" />
            <span className="text-sm font-medium">
              {tipo === 'basica' ? 'Educação Básica' : tipo === 'profissionalizante' ? 'Profissionalizante' : tipo === 'especial' ? 'Educação Especial' : 'EMITEC'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        <span className="font-medium">Observação:</span> Campos marcados com <span className="text-rose-500">*</span> são obrigatórios e devem ser preenchidos antes de preparar a carência.
      </div>

      {isSelectedUnitHomologated && (
        <div className="mt-4">
          {/* Aviso visual discreto sobre homologação. Não é um modal — apenas informação contextual. */}
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
              <CardTitle>Unidade Escolar</CardTitle>
              {/* Descrição curta orientando o usuário sobre a seleção da unidade */}
              <CardDescription className="mt-1">Selecione a unidade para carregar seus dados e prosseguir com o lançamento de carência.</CardDescription>
            </div>
            <CardAction>
              {/* Placeholder para ações (p.ex. link de ajuda, atalhos) */}
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                {/* Select controlado que escolhe a unidade. Usamos `value=undefined` quando null para compatibilidade com o componente Select. */}
                <Label className="mb-2">Unidade Escolar <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 15a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <input
                    ref={unitInputRef}
                    aria-label="Buscar unidade"
                    placeholder={loadingUnitResults ? "Carregando..." : "Buscar unidade por nome, código ou município"}
                    value={unitQuery}
                    onChange={(e) => { setUnitQuery(e.target.value); setUnitResultsOpen(true); }}
                    onFocus={() => { if (unitQuery.trim() !== "") setUnitResultsOpen(true); }}
                    onKeyDown={(e) => {
                      if (!unitResultsOpen) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setUnitHighlightedIndex((i) => Math.min(i + 1, units.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setUnitHighlightedIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const u = units[unitHighlightedIndex];
                        if (u) {
                          setSelectedUnit(String(u.id));
                          setSelectedUnitData(u);
                          setUnitQuery("");
                          setDebouncedUnitQuery("");
                          setUnits([]);
                          setUnitResultsOpen(false);
                        }
                      } else if (e.key === "Escape") {
                        setUnitResultsOpen(false);
                      }
                    }}
                    className="w-full rounded-md border pl-8 pr-2 py-1 text-sm"
                  />
                  {loadingUnitResults && (
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                      <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Resultados filtrados em dropdown */}
                {unitResultsOpen && (
                  <div ref={unitResultsRef} className="mt-2 max-h-48 overflow-auto rounded-md border bg-card shadow-sm">
                    {loadingUnitResults && <div className="p-2 text-sm text-muted-foreground">Buscando...</div>}
                    {!loadingUnitResults && units.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">{unitQuery.trim().length < 3 ? 'Digite 3 ou mais caracteres para buscar' : 'Nenhuma unidade encontrada'}</div>
                    )}
                    {!loadingUnitResults && units.map((u, idx) => (
                      <button
                        key={u.id}
                        type="button"
                        onMouseEnter={() => setUnitHighlightedIndex(idx)}
                        onClick={() => {
                          setSelectedUnit(String(u.id));
                          setSelectedUnitData(u);
                          setUnitQuery("");
                          setDebouncedUnitQuery("");
                          setUnits([]);
                          setUnitResultsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 ${unitHighlightedIndex === idx ? 'bg-muted-foreground/5 text-foreground' : 'text-muted-foreground'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{u.schoolUnit}</div>
                          <div className="text-xs text-muted-foreground">{u.sec_code ?? u.uo_code ?? "-"}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{u.municipality ?? '-'}</div>
                      </button>
                    ))}
                  </div>
                )}
                {/* Compact selected unit card (appears after selection) */}
                {selectedUnitData && (
                  <div className="mt-3">
                    <div className="relative rounded-lg border border-muted-foreground/20 bg-card p-3 shadow-sm w-full">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
                            <School className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{selectedUnitData.schoolUnit}</div>
                            <div className="text-xs text-muted-foreground">{selectedUnitData.municipality ?? "-"}</div>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <div className="text-sm text-muted-foreground text-right">&nbsp;</div>
                        </div>
                      </div>

                      {/* Small info cards moved inside the compact card */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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

                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          aria-label="Limpar seleção de unidade"
                          onClick={() => {
                            setSelectedUnit(null);
                            setSelectedUnitData(null);
                            setUnitQuery("");
                            setDebouncedUnitQuery("");
                            setUnits([]);
                            setUnitResultsOpen(false);
                          }}
                          className="p-2 rounded-md hover:bg-muted-foreground/5"
                        >
                          <X className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            

            
          </CardContent>
        </Card>

          {/* Abas de Tipo de Carência: mesmo formulário será usado para todos os tipos */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center rounded-full bg-muted px-1 py-1">
                <button
                  type="button"
                  onClick={() => setTipo('basica')}
                  className={`text-sm px-4 py-1 rounded-full transition-colors ${tipo === 'basica' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/30'}`}>
                  Educação Básica
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('profissionalizante')}
                  className={`ml-1 text-sm px-4 py-1 rounded-full transition-colors ${tipo === 'profissionalizante' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/30'}`}>
                  Profissionalizante
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('especial')}
                  className={`ml-1 text-sm px-4 py-1 rounded-full transition-colors ${tipo === 'especial' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/30'}`}>
                  Educação Especial
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('emitec')}
                  className={`ml-1 text-sm px-4 py-1 rounded-full transition-colors ${tipo === 'emitec' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted/30'}`}>
                  EMITEC
                </button>
              </div>

              
            </div>
          </div>

          {/* Card: Dados da Carência */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Dados da Carência</CardTitle>
              {/* Card que reúne os dados formais da carência: disciplina, área pedagógica, motivo e data de início. */}
              <CardDescription className="mt-1">Coloque os dados da carência.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {/* Grid responsivo: em telas maiores mostramos 4 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                {/* Disciplina: select que define a disciplina da vaga */}
                <Label className="mb-2">Disciplina <span className="text-rose-500">*</span></Label>
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
                {/* Área: p.ex. Ensino Fundamental / Médio — campo obrigatório */}
                <Label className="mb-2">Área <span className="text-rose-500">*</span></Label>
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
                {/* Motivo da Carência: escolha entre substituição, licença, etc. */}
                <Label className="mb-2">Motivo da Carência <span className="text-rose-500">*</span></Label>
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
                {/* Data de início da vaga: input tipo date controlado */}
                <Label className="mb-2">Início da Vaga <span className="text-rose-500">*</span></Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full" />
              </div>
            </div>

            {/* Campos extras apenas para Profissionalizante (Dados da Carência) */}
            {tipo === 'profissionalizante' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2">Curso <span className="text-rose-500">*</span></Label>
                  <Select value={selectedCurso || undefined} onValueChange={(v) => setSelectedCurso(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2">Eixo <span className="text-rose-500">*</span></Label>
                  <Select value={selectedEixo || undefined} onValueChange={(v) => setSelectedEixo(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o eixo" />
                    </SelectTrigger>
                    <SelectContent>
                      {eixos.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Quantitativos por turno: inputs numéricos e total dinâmico */}
            <div className="mt-4">
              <div className="flex items-end gap-4">
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">MAT</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={String(morningCount)}
                    onChange={(e) => setMorningCount(Math.max(0, parseInt(e.target.value || '0') || 0))}
                    onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value || '0') || 0); if (v !== morningCount) setMorningCount(v); }}
                    className="w-25 text-center py-1"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">VESP</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={String(afternoonCount)}
                    onChange={(e) => setAfternoonCount(Math.max(0, parseInt(e.target.value || '0') || 0))}
                    onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value || '0') || 0); if (v !== afternoonCount) setAfternoonCount(v); }}
                    className="w-25 text-center py-1"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">NOT</div>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={String(nightCount)}
                    onChange={(e) => setNightCount(Math.max(0, parseInt(e.target.value || '0') || 0))}
                    onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value || '0') || 0); if (v !== nightCount) setNightCount(v); }}
                    className="w-25 text-center py-1"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1">TOTAL</div>
                   <Input
                     type="number"
                     readOnly
                     min={0}
                     value={totalCount}
                     aria-label="Total solicitado"
                     className="w-25 text-center py-1"
                   />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

         {/* Card: Seleção do servidor que gerou a carência */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Servidor</CardTitle>
              <CardDescription className="mt-1">Selecione o servidor responsável por gerar esta carência.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="flex gap-2 items-center">
                  {/* Coluna principal: campo de busca e resultados */}
                  <div className="flex-1">
                    {/* Campo de busca debounced: busca por nome, CPF ou matrícula */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        {/* search icon */}
                        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 15a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <input
                        ref={inputRef}
                        aria-label="Buscar servidor"
                        placeholder={loadingServers ? "Carregando..." : "Buscar servidor por nome, CPF ou matrícula"}
                        value={serverQuery}
                        onChange={(e) => { setServerQuery(e.target.value); setResultsOpen(true); }}
                        onFocus={() => { if (serverQuery.trim() !== "") setResultsOpen(true); }}
                        onKeyDown={(e) => {
                          if (!resultsOpen) return;
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setHighlightedIndex((i) => Math.min(i + 1, servers.length - 1));
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlightedIndex((i) => Math.max(i - 1, 0));
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            const s = servers[highlightedIndex];
                            if (s) {
                              // guarda o servidor selecionado e limpa o campo de busca
                              setSelectedServer(String(s.id));
                              setSelectedServerData(s);
                              setServerQuery("");
                              setDebouncedServerQuery("");
                              setServers([]);
                              setResultsOpen(false);
                            }
                          } else if (e.key === "Escape") {
                            setResultsOpen(false);
                          }
                        }}
                        className="w-full md:w-1/2 max-w-xl rounded-md border pl-8 pr-2 py-1 text-sm"
                      />
                      {/* loading spinner on the right */}
                      {loadingServers && (
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                          <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Resultados da busca exibidos em lista clicável. */}
                    {serverQuery.trim().length > 0 && (
                      <div ref={resultsRef} className="mt-2 max-h-48 overflow-auto rounded-md border bg-card shadow-sm">
                        {loadingServers && <div className="p-2 text-sm text-muted-foreground">Buscando...</div>}
                        {!loadingServers && servers.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground">Nenhum servidor encontrado</div>
                        )}
                        {!loadingServers && servers.map((s, idx) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => {
                                // guarda o objeto selecionado e limpa pesquisa/resultado
                                setSelectedServer(String(s.id));
                                setSelectedServerData(s);
                                setServerQuery("");
                                setDebouncedServerQuery("");
                                setServers([]);
                                setResultsOpen(false);
                              }}
                            className={`w-full text-left px-3 py-2 ${highlightedIndex === idx ? 'bg-muted-foreground/5 text-foreground' : 'text-muted-foreground'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{s.name}</div>
                              <div className="text-xs text-muted-foreground">{s.enrollment ?? "-"}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{s.bond_type ?? '-'} • {s.work_schedule ?? '-'}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Se um servidor foi selecionado, mostramos dados resumidos adicionais abaixo */}
                    {selectedServerData ? (
                      <div className="mt-3">
                        <div className="relative rounded-lg border border-muted-foreground/20 bg-card p-3 shadow-sm w-full">
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              aria-label="Limpar seleção de servidor"
                              onClick={() => {
                                setSelectedServer(null);
                                setSelectedServerData(null);
                                setServerQuery("");
                                setServers([]);
                              }}
                              className="p-2 rounded-md hover:bg-muted-foreground/5"
                              >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
                                  <CircleUserRound className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                              <div className="text-base font-semibold text-foreground">{selectedServerData.name}</div>
                              <div className="mt-1 text-sm text-muted-foreground">Matrícula: {selectedServerData.enrollment ?? "-"}</div>
                              <div className="text-sm text-muted-foreground">Vínculo: {selectedServerData.bond_type ?? "-"} • Regime: {selectedServerData.work_schedule ?? "-"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-sm px-3 py-2 border border-muted-foreground/10 bg-muted/5 text-sm text-muted-foreground">
                        Nenhum servidor selecionado. Use a busca acima para encontrar o servidor responsável.
                      </div>
                    )}
                  </div>

                  {/* Removido: botão para adicionar servidor conforme solicitado pelo usuário */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de ação: desabilitado se a unidade estiver homologada. */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSelectedUnitHomologated}
            title={isSelectedUnitHomologated ? "Remova a homologação antes de preparar a carência" : undefined}
            className="px-6 py-2 text-sm inline-flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Preparar Carência
          </Button>
        </div>
      </form>
    </main>
  );
}
