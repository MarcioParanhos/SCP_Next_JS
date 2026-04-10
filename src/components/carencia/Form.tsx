"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { CircleUserRound, X, Tag, Check, School } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import SchoolUnitSearch from "@/components/school-unit/SchoolUnitSearch";
import SchoolUnitCard from "@/components/school-unit/SchoolUnitCard";
import ServerSearch from "@/components/server/ServerSearch";
import ServerCard from "@/components/server/ServerCard";
import Combobox from "@/components/ui/combobox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast, { Toaster as HotToaster } from "react-hot-toast";
import Link from 'next/link';
import CarenciaHeader from './CarenciaHeader';
import TurnInputs from './TurnInputs';
import RowsTable from './RowsTable';

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

  // Lista de disciplinas: carregada do servidor (tabela `disciplines` via API)
  // Agora armazenamos objetos `{ id, name }` para permitir enviar o id selecionado.
  const [disciplines, setDisciplines] = React.useState<Array<{ id: number; name: string }>>([]);
  // Áreas carregadas do banco
  const [areasList, setAreasList] = React.useState<Array<{ id: number; code: string; name: string }>>([]);
  const [loadingAreas, setLoadingAreas] = React.useState<boolean>(true);
  // Motivos carregados do banco (via /api/motives). Cada motivo tem: id, code, description, type
  const [motivesList, setMotivesList] = React.useState<Array<{ id: number; code: string; description: string; type: string }>>([]);
  const [loadingMotives, setLoadingMotives] = React.useState<boolean>(true);

  // Campos do formulário: seleção de disciplina, área, motivo e data
  const [selectedDiscipline, setSelectedDiscipline] = React.useState<string>("");
  const [selectedDisciplineId, setSelectedDisciplineId] = React.useState<number | null>(null);
  const [selectedArea, setSelectedArea] = React.useState<string | undefined>(undefined);
  const [selectedMotive, setSelectedMotive] = React.useState<string | undefined>(undefined);
  const [selectedMotiveId, setSelectedMotiveId] = React.useState<number | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string>("");

  // Cursos / Eixos (usados na aba profissionalizante)
  const [eixosList, setEixosList] = React.useState<Array<{ id: number; name: string }>>([]);
  const [coursesList, setCoursesList] = React.useState<Array<{ id: number; name: string; eixo_id: number }>>([]);
  const [loadingCourses, setLoadingCourses] = React.useState<boolean>(false);
  const [selectedCurso, setSelectedCurso] = React.useState<string>("");
  const [selectedCursoId, setSelectedCursoId] = React.useState<number | null>(null);
  const [selectedEixo, setSelectedEixo] = React.useState<string>("");

  // Fetch disciplines from API on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/disciplines?pageSize=500');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setDisciplines(json.data || []);
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Carrega eixos uma vez ao montar
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/eixos?pageSize=200');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setEixosList(json.data || []);
      } catch (err) {
        console.error('Erro ao carregar eixos:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Carrega áreas do banco
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingAreas(true);
        const res = await fetch('/api/areas');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setAreasList(json.data || []);
      } catch (err) {
        console.error('Erro ao carregar areas:', err);
      } finally {
        if (mounted) setLoadingAreas(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Carrega motivos do banco na montagem
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMotives(true);
        const res = await fetch('/api/motives');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setMotivesList(json.data || []);
      } catch (err) {
        console.error('Erro ao carregar motivos:', err);
      } finally {
        if (mounted) setLoadingMotives(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Carrega todos os cursos ao montar (permitindo escolher o curso primeiro)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCourses(true);
        const res = await fetch(`/api/courses?pageSize=500`);
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setCoursesList(json.data || []);
      } catch (err) {
        console.error('Erro ao carregar cursos:', err);
      } finally {
        if (mounted) setLoadingCourses(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Disciplina será controlada via Combobox (componente reutilizável)

  // Quantitativos por turno (MAT / VESP / NOT) e total dinâmico
  const [morningCount, setMorningCount] = React.useState<number>(0);
  const [afternoonCount, setAfternoonCount] = React.useState<number>(0);
  const [nightCount, setNightCount] = React.useState<number>(0);
  const totalCount = React.useMemo(() => morningCount + afternoonCount + nightCount, [morningCount, afternoonCount, nightCount]);

  // Tipo da carência: REAL ou TEMPORARY. Permite ao usuário escolher qual tipo
  // será persistido no banco. Default é 'REAL'. Comentários em português para manutenção.
  const [carenciaType, setCarenciaType] = React.useState<'REAL' | 'TEMPORARY'>('REAL');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingType, setPendingType] = React.useState<'REAL' | 'TEMPORARY' | null>(null);
  // Chave para forçar remount do formulário quando necessário (limpar estados internos de componentes)
  const [formKey, setFormKey] = React.useState<number>(0);
  // Evita envios concorrentes do formulário
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [savedCarencia, setSavedCarencia] = React.useState<any | null>(null);

  // Tipo de carência selecionado (controla abas). Usamos a mesma base de form
  // para todos os tipos — abas apenas alteram o 'tipo' que será enviado.
  const [tipo, setTipo] = React.useState<string>("basica");

  // Ao mudar de aba, limpamos campos específicos que pertencem apenas a uma aba
  // (por exemplo: `curso` e `eixo` da aba 'profissionalizante') para evitar
  // que valores residuais sejam enviados posteriormente.
  React.useEffect(() => {
    if (tipo !== 'profissionalizante') {
      setSelectedCurso("");
      setSelectedCursoId(null);
      setSelectedEixo("");
    }
  }, [tipo]);

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

  // Remove uma linha pelo `id` gerado (aceita string ou number para compatibilidade).
  function removeRow(id: string | number) {
    setRows((r) => r.filter((x) => x.id !== id));
  }

  // Atualiza parcialmente uma linha: recebe o `id` e um `patch` com os campos a alterar.
  // Aceita `id` string|number para compatibilidade com RowsTable.
  function updateRow(id: string | number, patch: any) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  // Handler do submit do formulário. Atualmente apenas monta e loga o payload.
  // Pontos a considerar para persistência real:
  // - Validação do payload (campos obrigatórios, formatos de data, quantidades >= 0, etc.)
  // - Proteção contra envio duplicado (desabilitar botão até resposta)
  // - Endpoint API para salvar a carência e tratamento de erros/retorno
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validação mínima no cliente: evita enviar sem campos obrigatórios
    const missing: string[] = [];
    if (!selectedUnit) missing.push('Unidade escolar');
    // Disciplina: aceita disciplina selecionada ou linhas preenchidas
    const hasDiscipline = Boolean(selectedDisciplineId) || (rows && rows.length > 0 && rows.some(r => r.discipline));
    if (!hasDiscipline) missing.push('Disciplina');
    if (!selectedArea) missing.push('Área');
    if (!selectedMotiveId) missing.push('Motivo da Carência');
    if (!selectedDate) missing.push('Início da Vaga');
    if (tipo === 'profissionalizante') {
      if (!selectedCursoId) missing.push('Curso');
    }
    if (missing.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missing.join(', ')}`);
      return;
    }
    // Monta o payload incluindo ids quando disponíveis (disciplina e curso)
    const areaObj = areasList.find((a) => String(a.id) === String(selectedArea));
    const payload: any = {
    // Dados principais da carência
    // Usa o tipo selecionado pelo usuário no seletor (REAL | TEMPORARY)
    type: carenciaType,
      unitId: selectedUnit,
      serverId: selectedServer,
      discipline: { id: selectedDisciplineId, name: selectedDiscipline },
      area: {
        id: areaObj ? areaObj.id : null,
        code: areaObj ? areaObj.code : null,
        name: areaObj ? areaObj.name : null,
      },
      motive: {
        id: selectedMotiveId,
        code: selectedMotive,
        description: motivesList.find((m) => m.code === selectedMotive)?.description ?? null,
      },
      startDate: selectedDate,
      // Quantitativos por turno (valores exibidos no topo do formulário)
      morningCount,
      afternoonCount,
      nightCount,
      totalCount,
      // Linhas detalhadas (por disciplina). Se o usuário não adicionou linhas,
      // enviaremos uma linha agregada com os quantitativos informados no topo.
      rows: rows && rows.length > 0 ? rows : (totalCount > 0 ? [{
        discipline: selectedDiscipline || null,
        area: selectedArea || null,
        reason: '',
        morning: morningCount,
        afternoon: afternoonCount,
        night: nightCount,
      }] : []),
    };
    // Se for profissionalizante, inclua também o curso selecionado com id
    if (tipo === 'profissionalizante') {
      payload.course = { id: selectedCursoId, name: selectedCurso };
    }
    // Envia o payload para a API que persiste a carência no banco.
    // Comentários em português para facilitar manutenção futura.
    try {
      setIsSaving(true)
      const savePromise = (async () => {
        const res = await fetch('/api/carencias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          const msg = json?.error || `Erro ao salvar (status ${res.status})`
          throw new Error(msg)
        }
        return await res.json()
      })()

      const json = await toast.promise(savePromise, {
        loading: 'Salvando carência...',
        success: 'Carência salva com sucesso',
        error: (err: any) => `Erro ao salvar: ${err?.message ?? 'Erro desconhecido'}`,
      })

      // Se a API retornou o objeto criado, guardamos para exibir link de acesso rápido
      if (json && json.data) {
        setSavedCarencia(json.data);
      }

      // Sucesso: limpa estados relevantes após salvar (não limpa unidade selecionada)
      setSelectedServer(null)
      setSelectedServerData(null)
      setRows([])
      setMorningCount(0)
      setAfternoonCount(0)
      setNightCount(0)
      setSelectedDiscipline("")
      setSelectedDisciplineId(null)
      // Limpa seleção de curso e eixo conforme solicitado
      setSelectedCurso("")
      setSelectedCursoId(null)
      setSelectedEixo("")
      setSelectedArea(undefined)
      setSelectedMotive(undefined)
      setSelectedMotiveId(null)
      setSelectedDate("")
      setFormKey((k) => k + 1)
    } catch (err) {
      console.error('Erro no submit:', err)
    } finally {
      setIsSaving(false)
    }
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
      {/* Toaster global para exibir toasts gerados por react-hot-toast */}
      <HotToaster position="top-center" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Carência {carenciaType === 'REAL' ? 'Real' : 'Temporária'}</h1>
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

      {/* Banner de sucesso com link para ver a carência criada */}
      {savedCarencia && (
        <div className="mt-4">
          <div className="rounded-md p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-between">
            <div>
              <div className="font-semibold">Carência salva</div>
              <div className="text-sm">A carência foi criada com sucesso.</div>
            </div>
            <div>
              <Link href={`/carencia/${savedCarencia.id}`} className="inline-flex items-center rounded-md bg-emerald-600 text-white px-3 py-1 text-sm">Ver carência</Link>
            </div>
          </div>
        </div>
      )}

      {isSelectedUnitHomologated && (
        <div className="mt-4">
          {/* Aviso visual discreto sobre homologação. Não é um modal — apenas informação contextual. */}
          <div className="rounded-md p-2 border-l-4 border-amber-300 bg-amber-50 text-amber-800 text-sm">
            <div className="font-medium">Unidade homologada</div>
            <div className="mt-1">Para lançar uma carência é necessário primeiro retirar a homologação desta unidade. Abra a página da unidade para gerenciar homologações.</div>
          </div>
        </div>
      )}

      <div className="relative mt-6">
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
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
                <div>
                  {/* Usa o componente de busca reutilizável (controlado pelo Form).
                      A lógica de fetch/debounce permanece no Form para manter controle do estado. */}
                  <SchoolUnitSearch
                    unitQuery={unitQuery}
                    setUnitQuery={setUnitQuery}
                    loading={loadingUnitResults}
                    units={units}
                    resultsOpen={unitResultsOpen}
                    setResultsOpen={setUnitResultsOpen}
                    highlightedIndex={unitHighlightedIndex}
                    setHighlightedIndex={setUnitHighlightedIndex}
                    inputRef={unitInputRef}
                    onSelectUnit={(u) => {
                      setSelectedUnit(String(u.id));
                      setSelectedUnitData(u);
                      setUnitQuery("");
                      setDebouncedUnitQuery("");
                      setUnits([]);
                      setUnitResultsOpen(false);
                    }}
                  />

                  {/* Usa o componente de cartão reutilizável para mostrar a unidade selecionada */}
                  <SchoolUnitCard unit={selectedUnitData} onClear={() => {
                    setSelectedUnit(null);
                    setSelectedUnitData(null);
                    setUnitQuery("");
                    setDebouncedUnitQuery("");
                    setUnits([]);
                    setUnitResultsOpen(false);
                  }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={(open) => {
              setConfirmOpen(open);
              if (!open) setPendingType(null);
            }}
            title={pendingType === 'REAL' ? 'Confirmar: Carência Real' : 'Confirmar: Carência Temporária'}
            description={pendingType === 'REAL' ? 'Deseja definir esta carência como Real? Confirme para alterar o tipo.' : 'Deseja definir esta carência como Temporária? Confirme para alterar o tipo.'}
            confirmLabel="Confirmar"
            cancelLabel="Cancelar"
            confirmVariant="default"
            onConfirm={() => {
              if (pendingType) {
                setCarenciaType(pendingType as 'REAL' | 'TEMPORARY');
                try { toast.success(`Tipo alterado para ${pendingType === 'REAL' ? 'Real' : 'Temporária'}`); } catch (e) {}
              }
              setPendingType(null);
            }}
          />

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
                {/* Abas 'Educação Especial' e 'EMITEC' removidas temporariamente */}
              </div>

              
            </div>
          </div>

          {/* Card: Dados da Carência */}
        <Card>
          <CardHeader>
            <CarenciaHeader carenciaType={carenciaType} onRequestTypeChange={(next) => { setPendingType(next); setConfirmOpen(true); }} />
          </CardHeader>
          <CardContent>
            {/* Grid responsivo: em telas maiores mostramos 4 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2">Disciplina <span className="text-rose-500">*</span></Label>
                {/* Combobox para disciplinas: mostramos os nomes, mas também gravamos o id correspondente */}
                <Combobox
                  options={disciplines.map((d) => d.name)}
                  value={selectedDiscipline}
                  onChange={(v) => {
                    setSelectedDiscipline(v);
                    const found = disciplines.find((d) => d.name === v);
                    setSelectedDisciplineId(found ? Number(found.id) : null);
                  }}
                  placeholder="Pesquisar disciplina..."
                  id="disciplina"
                />
              </div>

              <div>
                {/* Área: p.ex. Ensino Fundamental / Médio — campo obrigatório */}
                <Label className="mb-2">Área <span className="text-rose-500">*</span></Label>
                <Select value={selectedArea ?? undefined} onValueChange={(v) => setSelectedArea(v ?? undefined)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingAreas && <div className="p-2 text-sm text-muted-foreground">Carregando...</div>}
                    {!loadingAreas && areasList.map((a) => (
                      <SelectItem key={a.code} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                {/* Motivo da Carência: escolha entre substituição, licença, etc. */}
                <Label className="mb-2">Motivo da Carência <span className="text-rose-500">*</span></Label>
                <Select value={selectedMotive ?? undefined} onValueChange={(v) => {
                  const code = v ?? undefined;
                  setSelectedMotive(code);
                  const found = motivesList.find((m) => m.code === code);
                  setSelectedMotiveId(found ? found.id : null);
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingMotives && <div className="p-2 text-sm text-muted-foreground">Carregando...</div>}
                    {!loadingMotives && (
                      <div>
                                {/* Filtra motivos de acordo com o tipo selecionado (REAL / TEMPORARY) */}
                                {motivesList.filter((m) => m.type === carenciaType).map((m) => (
                          <SelectItem key={m.code} value={m.code}>{m.description}</SelectItem>
                        ))}
                      </div>
                    )}
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
                  {/* Combobox reutilizável para escolher o curso por nome.
                      Observação: armazenamos o nome do curso em `selectedCurso` (igual ao comportamento da disciplina),
                      e preenchemos automaticamente `selectedEixo` buscando o `eixo_id` do curso selecionado. */}
                  <Combobox
                    options={coursesList.map((c) => c.name)}
                    value={selectedCurso}
                    onChange={(v) => {
                      // Quando o usuário seleciona um curso (pelo nome), atualizamos o estado
                      // do curso selecionado e procuramos seu eixo para preencher o campo de Eixo.
                      setSelectedCurso(v);
                      const found = coursesList.find((c) => c.name === v);
                      if (found) {
                        setSelectedEixo(String(found.eixo_id));
                        setSelectedCursoId(found.id ?? null);
                      } else {
                        setSelectedEixo("");
                        setSelectedCursoId(null);
                      }
                    }}
                    placeholder={loadingCourses ? "Carregando..." : coursesList.length === 0 ? "Nenhum curso cadastrado" : "Pesquisar curso..."}
                    id="curso"
                  />
                </div>

                <div>
                  <Label className="mb-2">Eixo</Label>
                  {/* Campo somente leitura que mostra o nome do eixo do curso selecionado.
                      Estilizado com `text-sm` para combinar com os outros inputs do formulário. */}
                  <input
                    readOnly
                    value={eixosList.find((e) => String(e.id) === selectedEixo)?.name ?? ""}
                    placeholder={eixosList.length === 0 ? "Carregando..." : "Escolha um curso"}
                    className="w-full rounded-md border px-4 py-3 text-sm bg-transparent text-foreground"
                  />
                </div>
              </div>
            )}

            <TurnInputs
              morningCount={morningCount}
              afternoonCount={afternoonCount}
              nightCount={nightCount}
              setMorningCount={setMorningCount}
              setAfternoonCount={setAfternoonCount}
              setNightCount={setNightCount}
              totalCount={totalCount}
            />
            <RowsTable rows={rows} addRow={addRow} removeRow={removeRow} updateRow={updateRow} />
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
                    {/* Componente reutilizável de busca de servidores (controlado pelo Form) */}
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
                      onSelectServer={(s) => {
                        setSelectedServer(String(s.id));
                        setSelectedServerData(s);
                        setServerQuery("");
                        setDebouncedServerQuery("");
                        setServers([]);
                        setResultsOpen(false);
                      }}
                    />
                    {/* Se um servidor foi selecionado, mostramos dados resumidos adicionais abaixo */}
                    {/* Mostra cartão de servidor selecionado usando componente reutilizável */}
                    <ServerCard server={selectedServerData} onClear={() => {
                      setSelectedServer(null);
                      setSelectedServerData(null);
                      setServerQuery("");
                      setServers([]);
                    }} />
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
            disabled={isSelectedUnitHomologated || isSaving}
            title={isSelectedUnitHomologated ? "Remova a homologação antes de preparar a carência" : undefined}
            className="px-6 py-2 text-sm inline-flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Preparar Carência'}
          </Button>
        </div>
        </form>

        {isSaving && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    </main>
  );
}