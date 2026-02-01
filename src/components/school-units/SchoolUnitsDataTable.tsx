"use client";

// Componente cliente que renderiza a tabela de unidades escolares.
// - Busca dados via API quando `initialData` não é fornecido (paginação incremental)
// - Fornece: ordenação, filtros, paginação, seleção de linhas e ações por linha
// - Permite customização de colunas (visibilidade) pelo usuário
// - Usa o tipo `SchoolUnitRow` definido em `schema.ts`
// Observação: a funcionalidade de arrastar/soltar (drag-and-drop) foi removida deste componente;
// a ordem das linhas é controlada pelo estado local `data` e/ou pela paginação.
//
// --- Comentários sobre as modificações realizadas (resumo em português) ---
// Alterações implementadas nesta versão do componente:
// 1) Exclusão de unidade escolar
//    - Função `handleDelete(id)` adicionada: chama o endpoint DELETE em
//      `/api/school_units/:id`, atualiza o estado local `data` removendo o item
//      e exibe feedback com `toast.success` / `toast.error`.
//    - Estado `openDelete` e `deletingId` para controlar o diálogo de
//      confirmação antes de executar a exclusão.
//    - Observação: o endpoint DELETE foi criado em `src/app/api/school_units/[id]/route.ts`.
//
// 2) Painel de filtros (`Sheet`)
//    - Adição de um `Sheet` (painel lateral) com campos: NTE, Município,
//      Unidade Escolar (texto), Código SEC e Status.
//    - Estados locais: `filterNte`, `filterMunicipality`, `filterSchoolUnit`,
//      `filterSecCode`, `filterStatus` e `openSheet`.
//    - `applyFilters()` monta o array `columnFilters` usado pelo TanStack Table
//      e fecha o Sheet; `clearFilters()` limpa tanto o Sheet quanto `columnFilters`.
//    - `removeFilter(id)` permite remover um filtro individual, sincronizando
//      o estado do Sheet com `columnFilters`.
//
// 3) Layout e usabilidade do Sheet
//    - Campos NTE e Município foram posicionados lado a lado usando uma grid
//      responsiva (`sm:grid-cols-3`) — inicialmente NTE ocupava 2/3 e
//      Município 1/3; depois invertido conforme solicitado (Município maior).
//    - Código SEC e Status também posicionados lado a lado (código 1/3,
//      status 2/3) na mesma grid responsiva.
//    - Redução do espaçamento entre campos (`gap-3` → `gap-2`) e labels
//      com margem inferior menor (`mb-2` → `mb-1`).
//    - `SelectTrigger` e `Input` dos campos do Sheet receberam `className="w-full h-9"`
//      para uniformizar largura/altura e eliminar espaçamentos estranhos.
//    - Para evitar erro com `SelectItem value=""`, usamos `value="none"`
//      para representar 'Nenhum' e mapeamos `"none"` para string vazia no
//      `onValueChange` (v === "none" ? "" : v).
//
// 4) Exibição de filtros ativos
//    - Barra de badges exibindo os `columnFilters` foi adicionada acima da tabela.
//    - Cada badge mostra `label: valor` e tem um botão para remover o filtro
//      (agora usando `IconX` em vez de um caractere ×).
//    - A barra só é renderizada quando existe ao menos um filtro ativo,
//      evitando espaço em branco quando não há filtros.
//    - Inserido elemento `role="status" aria-live="polite"` (visível apenas
//      para leitores de tela) que anuncia o número de filtros ativos.
//
// 5) Feedback e acessibilidade
//    - Substituído `alert()` nativo por `react-hot-toast` para feedback não intrusivo.
//    - Badges e botões de remoção receberam `aria-label`/foco para melhor
//      acessibilidade.
//
// 6) Outras mudanças menores
//    - Definição das colunas movida para dentro do componente para permitir
//      uso de `setData` na callback de exclusão.
//    - Comentários em português adicionados nas novas funções e trechos
//      importantes para facilitar manutenção.
//
// Recomendações futuras (não aplicadas automaticamente):
// - Para grandes volumes de dados, migrar os filtros para server-side ou
//   adicionar debounce/autocomplete nos selects para performance.
// - Ajustar contraste das badges se necessário, e testar comportamento do
//   Sheet em dispositivos móveis.
// ---------------------------------------------------------------------------

import * as React from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconLoader,
  IconX,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import toast from "react-hot-toast";
import { SchoolUnitRow } from "./schema";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Importa ícones e componentes de UI usados pelo painel de filtros (Sheet).
// - `Filter`: ícone do Lucide usado no botão que abre o Sheet.
// - `Sheet*`: conjunto de componentes (trigger, content, header, footer)
//    que compõem o painel lateral reutilizável para filtros avançados.
import { SquarePen, TableProperties, Trash2, Filter } from "lucide-react";
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
import AddSchoolUnitDialog from "./AddSchoolUnitDialog";

// Tipo para representar um filtro ativo (usado para tipagem local)
type FilterItem = { id: string; value: string };

/**
 * Hook simples para debouncing de valores.
 * -- Uso: garante que atualizações rápidas de inputs não disparem ações
 * imediatamente (útil para buscas/autocomplete).
 */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * Componente reutilizável para exibir um badge de filtro com botão de fechar.
 * - `label`: rótulo do filtro (ex: "NTE")
 * - `value`: valor do filtro (ex: "Norte")
 * - `onRemove`: callback para remoção do filtro
 */
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

// Nota: As definições das colunas foram movidas para dentro do componente
// `SchoolUnitsDataTable` para que possamos acessar o estado local (`setData`)
// e implementar corretamente o handler de exclusão (`handleDelete`).

function DraggableRow({ row }: { row: Row<SchoolUnitRow> }) {
  // Renderizador de linha genérico
  // - Recebe um `Row<SchoolUnitRow>` do TanStack Table e itera sobre `row.getVisibleCells()`.
  // - Define `data-state="selected"` quando a linha está selecionada para permitir estilos visuais.
  // - Não contém lógica de reordenação; a manipulação da ordem (se necessária) deve ser feita
  //   explicitamente no estado `data` ou via ações do usuário.
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function SchoolUnitsDataTable({
  data: initialData,
}: {
  data?: SchoolUnitRow[];
}) {
  // Estado local da tabela
  // - `data`: linhas atuais exibidas
  // - `loading`: estado de carregamento ao buscar via API
  const [data, setData] = React.useState<SchoolUnitRow[]>(
    () => initialData ?? [],
  );
  const [loading, setLoading] = React.useState<boolean>(
    initialData ? false : true,
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Estados para o Sheet de filtros
  // - `openSheet`: controla visibilidade do Sheet
  // - filtros individuais para cada campo que o usuário pediu
  const [openSheet, setOpenSheet] = React.useState(false);
  const [filterNte, setFilterNte] = React.useState<string>("");
  const [filterMunicipality, setFilterMunicipality] = React.useState<string>("");
  const [filterSchoolUnit, setFilterSchoolUnit] = React.useState<string>("");
  const [filterSecCode, setFilterSecCode] = React.useState<string>("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterTypology, setFilterTypology] = React.useState<string>("");

  // Gera opções simples a partir dos dados carregados atualmente
  // - Isso evita criar dependências adicionais para endpoints de busca.
  const nteOptions = Array.from(
    new Set(data.map((d) => d.nte).filter(Boolean) as string[]),
  );
  const municipalityOptions = Array.from(
    new Set(data.map((d) => d.municipality).filter(Boolean) as string[]),
  );
  const typologyOptions = Array.from(
    new Set(data.map((d) => d.typology).filter(Boolean) as string[]),
  );

  // Aplica os filtros selecionados no Sheet para o TanStack Table
  /**
   * Aplica os filtros do Sheet ao estado `columnFilters` da tabela.
   * Fecha o Sheet após aplicar.
   */
  function applyFilters() {
    const newFilters: { id: string; value: string }[] = [];

    if (filterNte && filterNte !== "") newFilters.push({ id: "nte", value: filterNte });
    if (filterMunicipality && filterMunicipality !== "") newFilters.push({ id: "municipality", value: filterMunicipality });
    if (filterSchoolUnit && filterSchoolUnit.trim() !== "") newFilters.push({ id: "schoolUnit", value: filterSchoolUnit.trim() });
    if (filterSecCode && filterSecCode.trim() !== "") newFilters.push({ id: "sec_code", value: filterSecCode.trim() });
    if (filterTypology && filterTypology !== "") newFilters.push({ id: "typology", value: filterTypology });
    if (filterStatus && filterStatus !== "all") newFilters.push({ id: "status", value: filterStatus });

    // Define os filtros das colunas no estado da tabela (tipado)
    setColumnFilters(newFilters as ColumnFiltersState);
    // Fecha o Sheet após aplicar
    setOpenSheet(false);
  }

  /**
   * Limpa filtros do Sheet e sincroniza o estado da tabela.
   */
  function clearFilters() {
    setFilterNte("");
    setFilterMunicipality("");
    setFilterSchoolUnit("");
    setFilterSecCode("");
    setFilterTypology("");
    setFilterStatus("all");
    setColumnFilters([]);
  }

  /**
   * Remove um filtro individual pelo `id` e sincroniza os estados do Sheet.
   */
  function removeFilter(id: string) {
    // Remove do estado da tabela
    setColumnFilters((prev) => (prev as any[]).filter((f) => f.id !== id) as any);

    // Sincroniza também o estado do Sheet caso esteja aberto
    switch (id) {
      case "nte":
        setFilterNte("");
        break;
      case "municipality":
        setFilterMunicipality("");
        break;
      case "schoolUnit":
        setFilterSchoolUnit("");
        break;
      case "typology":
        setFilterTypology("");
        break;
      case "sec_code":
        setFilterSecCode("");
        break;
      case "status":
        setFilterStatus("all");
        break;
      default:
        break;
    }
  }

  // Estado para controlar o diálogo de confirmação de exclusão
  const [openDelete, setOpenDelete] = React.useState(false);
  // Armazena o id da unidade que está sendo considerada para exclusão
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // -----------------------------------------------------------------------
  // Função: handleDelete
  // - Esta função é responsável por realizar a chamada ao endpoint DELETE
  //   que implementamos em `src/app/api/school_units/[id]/route.ts`.
  // - Passos executados:
  //   1) Solicita confirmação ao usuário via `confirm`.
  //   2) Envia `fetch` com método HTTP `DELETE` para `/api/school_units/:id`.
  //   3) Em caso de sucesso, atualiza o estado local `data` removendo o item.
  //   4) Exibe feedback ao usuário usando `toast` (sucesso ou erro).
  // - Comentários adicionais em português para facilitar manutenção.
  // -----------------------------------------------------------------------
  /**
   * Executa chamada ao endpoint DELETE para remover uma unidade escolar.
   * Em caso de sucesso, atualiza o estado local e mostra toast de sucesso.
   * Em caso de erro, tenta ler o JSON de erro e exibe mensagem apropriada.
   */
  async function handleDelete(id: number | null) {
    // Se não houver id válido, nada a fazer
    if (id === null) return;

    try {
      // Realiza a chamada ao endpoint DELETE implementado no backend
      const res = await fetch(`/api/school_units/${id}`, { method: "DELETE" });

      if (res.ok) {
        // Remove do estado local para refletir a exclusão imediatamente na UI
        setData((prev) => prev.filter((item) => item.id !== id));
        // Fecha o diálogo de confirmação
        setOpenDelete(false);
        setDeletingId(null);
        // Exibe feedback visual ao usuário: apenas toast (removido alert nativo)
        toast.success("Unidade escolar excluída com sucesso.");
      } else {
        // Tenta ler JSON com detalhe do erro, se houver
        let detail = await res.text();
        try {
          const json = JSON.parse(detail);
          detail = json?.error ?? json?.message ?? detail;
        } catch (_) {
          // mantém texto bruto
        }
        toast.error("Falha ao excluir: " + detail);
      }
    } catch (err) {
      console.error("Erro ao chamar API DELETE:", err);
      toast.error("Erro ao excluir unidade escolar. Tente novamente.");
    }
  }

  // Definição das colunas da tabela (agora aqui dentro do componente)
  // Mantemos os mesmos campos visuais, mas o campo `actions` passa a chamar
  // a função `handleDelete` implementada acima.
  const columns: ColumnDef<SchoolUnitRow>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "nte",
      header: "NTE",
      cell: ({ row }) => (
        <div className="w-full">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.nte || "—"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "municipality",
      header: "Municipio",
      cell: ({ row }) => {
        const isAssigned = row.original.municipality !== "Assign reviewer";

        if (isAssigned) {
          return row.original.municipality;
        }

        return (
          <>
            <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
              Reviewer
            </Label>
            <Select>
              <SelectTrigger
                className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                size="sm"
                id={`${row.original.id}-reviewer`}
              >
                <SelectValue placeholder="Assign reviewer" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                <SelectItem value="Jamik Tashpulatov">Jamik Tashpulatov</SelectItem>
              </SelectContent>
            </Select>
          </>
        );
      },
    },
    {
      accessorKey: "schoolUnit",
      header: "Unidade Escolar",
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} />;
      },
      enableHiding: false,
    },
    {
      accessorKey: "sec_code",
      header: () => <div className="w-full text-center">Código SEC</div>,
      cell: ({ row }) => (
        <div className="w-full text-center">{row.original.sec_code}</div>
      ),
    },
    // Coluna para exibir o Código UO (uo_code)
    {
      accessorKey: "uo_code",
      header: () => <div className="w-full text-center">Código UO</div>,
      cell: ({ row }) => (
        <div className="w-full text-center">{(row.original as any).uo_code ?? "—"}</div>
      ),
    },
    {
      accessorKey: "typology",
      header: () => <div className="w-full text-center">Tipologia</div>,
      cell: ({ row }) => (
        <div className="w-full flex justify-center">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original.typology}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="w-full text-center">Status</div>,
      cell: ({ row }) => {
        const code = String(row.original.status ?? "");
        const isActive = code === "1";
        const label = isActive ? "Ativo" : "Inativo";

        return (
          <div className="w-full flex justify-center">
            <Badge
              className={
                isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-1.5"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 px-1.5"
              }
            >
              {isActive ? (
                <IconCircleCheckFilled className="size-4 inline mr-1 align-middle text-green-600 dark:text-green-300" />
              ) : (
                <IconLoader className="size-4 inline mr-1 align-middle text-red-600 dark:text-red-300" />
              )}
              {label}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      // Note: o `cell` aqui tem acesso ao `handleDelete` via closure.
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>
              <SquarePen /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Item de exclusão que chama `handleDelete` com o id numérico */}
            <DropdownMenuItem
              onClick={() => {
                // Abre o diálogo de confirmação reutilizando o modal
                // (sem excluir imediatamente). O botão de confirmação
                // dentro do diálogo chamará `handleDelete`.
                setDeletingId(Number(row.original.id));
                setOpenDelete(true);
              }}
              className="text-destructive"
            >
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [handleDelete]);

  // Mapa de rótulos das colunas para o menu de customização (em português)
  const columnLabelMap: Record<string, string> = {
    select: "Selecionar",
    nte: "NTE",
    municipality: "Município",
    schoolUnit: "Unidade Escolar",
    sec_code: "Código SEC",
    uo_code: "Código UO",
    typology: "Tipologia",
    status: "Status",
    limit: "Limit",
    actions: "Ações",
  };

  const handleCreate = (item: SchoolUnitRow) => {
    setData((prev) => [item, ...prev])
  }

  

  React.useEffect(() => {
    if (initialData) return;

    let mounted = true;

    (async () => {
      // Estratégia de fetch paginado:
      // - Faz requests para `/api/school_units` em páginas de `pageSize`
      // - Concatena resultados em `all` até que `hasNext` seja false
      // - Essa abordagem evita buscar tudo de uma vez com `findMany()` sem limites
      try {
        setLoading(true);
        const pageSize = 100;
        let all: SchoolUnitRow[] = [];
        let cursor: string | null = null;

        // fetch pages until hasNext is false
        while (true) {
          const params = new URLSearchParams();
          params.set("pageSize", String(pageSize));
          if (cursor) params.set("cursor", cursor);
          const res = await fetch(`/api/school_units?${params.toString()}`);
          if (!res.ok) throw new Error("Failed to fetch school units");
          const json = await res.json();
          const chunk = json.data ?? [];
          all = all.concat(chunk);
          if (json.hasNext && json.nextCursor) {
            cursor = json.nextCursor;
          } else break;
        }

        // Ao terminar, atualizamos `data` com todos os registros coletados
        if (mounted) setData(all);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialData]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Observação sobre ordenação e reordenação
  // - A funcionalidade de arrastar/soltar foi removida deste componente.
  // - A ordem das linhas exibidas é determinada pelo estado `data` e pela paginação/ordenacao aplicada
  //   via TanStack Table. Se for necessária reordenação manual, implemente ações explícitas
  //   (botões para mover para cima/baixo, endpoint que persiste posição, etc.).

  return (
    <>
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="geral">
              Geral
            </SelectItem>
            {/* <SelectItem value="past-performance">Past Performance</SelectItem> */}
            {/* <SelectItem value="key-personnel">Key Personnel</SelectItem> */}
            {/* <SelectItem value="focus-documents">Focus Documents</SelectItem> */}
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">
            <TableProperties />Geral
          </TabsTrigger>
          {/* <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger> */}
          {/* <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger> */}
          {/* <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger> */}
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customizar Colunas</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  const label = columnLabelMap[column.id] ??
                    (typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Botão que abre o Sheet de filtros (lado direito) */}
          <Sheet open={openSheet} onOpenChange={setOpenSheet}>
            {/* Trigger: botão com ícone de filtro (lucide `Filter`) */}
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter />
                <span className="hidden lg:inline">Filtros</span>
              </Button>
            </SheetTrigger>

            {/* Conteúdo do Sheet: seções para NTE, Município, Unidade, Código e Status */}
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filtros avançados</SheetTitle>
                <SheetDescription>Filtre por NTE, município, unidade, código e status.</SheetDescription>
              </SheetHeader>

              <div className="px-4 pb-4 flex flex-col gap-3">
                {/*
                  Layout atualizado: NTE e Município em linhas separadas,
                  cada campo ocupa 100% da largura do painel de filtros.
                */}
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <Label htmlFor="sheet-nte" className="mb-1">NTE</Label>
                    <Select value={filterNte} onValueChange={(v) => setFilterNte(v === "none" ? "" : v)}>
                      <SelectTrigger id="sheet-nte" size="sm" className="w-full h-9">
                        <SelectValue placeholder="Selecione NTE" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {nteOptions.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sheet-municipality" className="mb-1">Município</Label>
                    <Select value={filterMunicipality} onValueChange={(v) => setFilterMunicipality(v === "none" ? "" : v)}>
                      <SelectTrigger id="sheet-municipality" size="sm" className="w-full h-9">
                        <SelectValue placeholder="Selecione município" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {municipalityOptions.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Unidade escolar (texto) */}
                <div>
                  <Label htmlFor="sheet-schoolUnit" className="mb-2">Unidade Escolar</Label>
                  <Input id="sheet-schoolUnit" className="w-full h-9" placeholder="Nome da unidade" value={filterSchoolUnit} onChange={(e) => setFilterSchoolUnit(e.target.value)} />
                </div>

                {/* Tipologia (select full width) */}
                <div>
                  <Label htmlFor="sheet-typology" className="mb-1">Tipologia</Label>
                  <Select value={filterTypology} onValueChange={(v) => setFilterTypology(v === "none" ? "" : v)}>
                    <SelectTrigger id="sheet-typology" size="sm" className="w-full h-9">
                      <SelectValue placeholder="Selecione tipologia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {typologyOptions.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Linha: Código SEC e Status lado a lado (Código SEC 1/3, Status 2/3) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <Label htmlFor="sheet-seccode" className="mb-1">Código SEC</Label>
                    <Input id="sheet-seccode" className="w-full h-9" placeholder="Código SEC" value={filterSecCode} onChange={(e) => setFilterSecCode(e.target.value)} />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="sheet-status" className="mb-1">Status</Label>
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v)}>
                      <SelectTrigger id="sheet-status" size="sm" className="w-full h-9">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="1">Ativo</SelectItem>
                        <SelectItem value="0">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <SheetFooter>
                {/* Botões de ações: Limpar e Aplicar */}
                <div className="flex w-full justify-between">
                  <Button variant="ghost" onClick={() => clearFilters()}>Limpar</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOpenSheet(false)}>Fechar</Button>
                    <Button onClick={() => applyFilters()}>Aplicar</Button>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          {/* Chama o Dialog de adicionar unidade escolar */}
          <AddSchoolUnitDialog onCreate={handleCreate} />
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {/* Barra de filtros ativos: mostra badges com cada filtro aplicado e botão para limpar */}
                {columnFilters && columnFilters.length > 0 && (
                  <div className="px-4 lg:px-6">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {(columnFilters as FilterItem[]).map((f) => {
                        const label = columnLabelMap[f.id] ?? f.id;
                        let display = String(f.value);
                        if (f.id === "status") {
                          display = f.value === "1" ? "Ativo" : f.value === "0" ? "Inativo" : "Todos";
                        }

                        return (
                          <FilterBadge key={`${f.id}-${f.value}`} label={label} value={display} onRemove={() => removeFilter(f.id)} />
                        );
                      })}

                      <Button variant="ghost" size="sm" onClick={() => clearFilters()}>Limpar filtros</Button>
                      <div role="status" aria-live="polite" className="sr-only">{columnFilters.length} filtro(s) ativo(s)</div>
                    </div>
                  </div>
                )}
        <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <IconLoader className="animate-spin" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  <>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Linhas por página
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para a primeira página</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para a página anterior</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para a próxima página</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para a última página</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
    {/* Diálogo reutilizável de confirmação de exclusão.
        - Reaproveita o padrão de layout do modal de logout (título, texto e botões).
        - `openDelete` controla visibilidade; ao confirmar chamamos `handleDelete`.
    */}
    <Dialog open={openDelete} onOpenChange={(v) => { if (!v) { setDeletingId(null); } setOpenDelete(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar exclusão</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir esta unidade escolar? Esta ação é irreversível.
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setOpenDelete(false); setDeletingId(null); }}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              // chama handleDelete com o id armazenado e fecha o modal
              await handleDelete(deletingId);
            }}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function TableCellViewer({ item }: { item: SchoolUnitRow }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.schoolUnit}
        </Button>
      </DrawerTrigger>
      {/* Viewer lateral que mostra detalhes da unidade ao clicar no nome */}
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.schoolUnit}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={item.schoolUnit} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="typology">Tipologia</Label>
                <Select defaultValue={item.typology}>
                  <SelectTrigger id="typology" className="w-full">
                    <SelectValue placeholder="Select a typology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">
                      Table of Contents
                    </SelectItem>
                    <SelectItem value="Executive Summary">
                      Executive Summary
                    </SelectItem>
                    <SelectItem value="Technical Approach">
                      Technical Approach
                    </SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capabilities</SelectItem>
                    <SelectItem value="Focus Documents">
                      Focus Documents
                    </SelectItem>
                    <SelectItem value="Narrative">Narrative</SelectItem>
                    <SelectItem value="Cover Page">Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Ativo</SelectItem>
                    <SelectItem value="0">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="sec_code">Sec Code</Label>
                <Input id="sec_code" defaultValue={item.sec_code} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Municipio</Label>
              <Select defaultValue={item.municipality}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
