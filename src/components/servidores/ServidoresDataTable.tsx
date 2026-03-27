"use client";

// ============================================================
// ServidoresDataTable
// ============================================================
// Renderiza a lista de servidores (employees) em uma tabela interativa.
// Layout e estrutura visual identicos ao SchoolUnitsDataTable:
//   - Tabs no topo com Select mobile + TabsList desktop
//   - Header com personalizacao de colunas e botao de adicionar
//   - Tabela com cabecalho fixo, estados de loading/vazio, linhas selecionaveis
//   - Rodape com seletor de linhas por pagina, paginacao e contagem
//   - Dialog de confirmacao de exclusao
//   - Dialog de edicao inline (sem pagina separada)
//
// Funcionalidades:
//   - Criacao via AddServidorDialog (botao no header)
//   - Edicao via Dialog com AddServidorForm (icone no menu de acoes)
//   - Exclusao com confirmacao (icone no menu de acoes)
//   - Personalizacao de colunas visiveis (DropdownMenu)
//   - Ordenacao, paginacao e selecao de linhas (TanStack Table)

import * as React from "react";
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
import toast from "react-hot-toast";

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconLoader,
} from "@tabler/icons-react";

import { SquarePen, TableProperties, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AddServidorDialog from "./AddServidorDialog";
import { AddServidorForm } from "./AddServidorForm";
import { ImportServidoresDialog } from "./ImportServidoresDialog";
import { ServidorRow } from "./schema";

// Linha da tabela com suporte a estado "selecionado" (data-state=selected).
// Mantida como componente separado para clareza e possível extensão futura
// (ex.: suporte a drag-and-drop ou comportamentos específicos por linha).
function DraggableRow({ row }: { row: Row<ServidorRow> }) {
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

export function ServidoresDataTable({
  data: initialData,
}: {
  data?: ServidorRow[];
}) {
  // Estados locais do componente:
  // - `data`: lista de servidores exibida na tabela
  // - `loading`: indicador de carregamento enquanto busca do backend
  // - `sorting`, `columnFilters`, `columnVisibility`: estados usados pelo TanStack Table
  // - `rowSelection`: linhas atualmente selecionadas
  // - `pagination`: controle de paginação local (índice e tamanho de página)
  // - `editingItem`: servidor atualmente em edição (abre dialog de edição)
  // - `openDelete`/`deletingId`: controle do diálogo de confirmação de exclusão
  const [data, setData] = React.useState<ServidorRow[]>(() => initialData ?? []);
  const [loading, setLoading] = React.useState<boolean>(!initialData);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [editingItem, setEditingItem] = React.useState<ServidorRow | null>(null);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  // Remove um servidor pelo ID chamando a rota DELETE e atualiza a UI
  async function handleDelete(id: number | null) {
    if (id === null) return;
    try {
      const res = await fetch(`/api/servidores/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => prev.filter((item) => item.id !== id));
        setOpenDelete(false);
        setDeletingId(null);
        toast.success("Servidor excluido com sucesso.");
      } else {
        let detail = await res.text();
        try { const j = JSON.parse(detail); detail = j?.error ?? j?.message ?? detail; } catch (_) {}
        toast.error("Falha ao excluir: " + detail);
      }
    } catch (err) {
      console.error("Erro ao excluir servidor:", err);
      toast.error("Erro inesperado. Tente novamente.");
    }
  }

  // Atualiza o item na lista após edição bem-sucedida
  function handleUpdate(updated: ServidorRow) {
    setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setEditingItem(null);
  }

  // Insere um novo servidor no topo da lista (após criação)
  function handleCreate(item: ServidorRow) {
    setData((prev) => [item, ...prev]);
  }

  // Handler chamado pelo diálogo de importação CSV
  // Coloca os registros importados no topo para feedback imediato ao usuário
  function handleImport(imported: ServidorRow[]) {
    setData((prev) => [...imported, ...prev]);
  }

  // Rótulos amigáveis para o menu de personalização de colunas
  // Usado para exibir nomes legíveis no DropdownMenu quando o usuário
  // escolhe quais colunas mostrar/ocultar.
  const columnLabelMap: Record<string, string> = {
    select:        "Selecionar",
    name:          "Servidor",
    cpf:           "CPF",
    enrollment:    "Matricula",
    bond_type:     "Vinculo",
    work_schedule: "Regime",
    createdAt:     "Data do Cadastro",
    actions:       "Acoes",
  };

  // Definição das colunas para o TanStack Table.
  // Cada coluna especifica como renderizar header e cell, e controla
  // se pode ser ocultada ou ordenada.
  const columns: ColumnDef<ServidorRow>[] = React.useMemo(
    () => [
      // Coluna de selecao (checkbox)
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Selecionar todos"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Selecionar linha"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // Nome completo do servidor
      {
        accessorKey: "name",
        header: "Servidor",
        enableHiding: false,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      // CPF do servidor
      {
        accessorKey: "cpf",
        header: "CPF",
        cell: ({ row }) => row.original.cpf,
      },
      // Matricula funcional  exibe "Pendente" quando valor for "PENDING"
      {
        accessorKey: "enrollment",
        header: () => <div className="w-full text-center">Matricula</div>,
        cell: ({ row }) => {
          const val = row.original.enrollment;
          const isPending = val === "PENDING";
          return (
            <div className="w-full flex justify-center">
              <Badge
                variant="outline"
                className={
                  isPending
                    ? "text-muted-foreground px-1.5"
                    : "text-foreground px-1.5"
                }
              >
                {isPending ? "Pendente" : val}
              </Badge>
            </div>
          );
        },
      },
      // Tipo de vinculo (REDA, EFETIVO, etc.)
      {
        accessorKey: "bond_type",
        header: () => <div className="w-full text-center">Vinculo</div>,
        cell: ({ row }) => (
          <div className="w-full flex justify-center">
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              {row.original.bond_type}
            </Badge>
          </div>
        ),
      },
      // Regime de trabalho (20H, 40H, DE)
      {
        accessorKey: "work_schedule",
        header: () => <div className="w-full text-center">Regime</div>,
        cell: ({ row }) => (
          <div className="w-full flex justify-center">
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              {row.original.work_schedule}
            </Badge>
          </div>
        ),
      },
      // Data do cadastro formatada para pt-BR
      {
        accessorKey: "createdAt",
        header: () => <div className="w-full text-center">Data do Cadastro</div>,
        cell: ({ row }) => (
          <div className="w-full text-center">
            {new Date(row.original.createdAt).toLocaleDateString("pt-BR")}
          </div>
        ),
      },
      // Menu de acoes por linha
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setEditingItem(row.original)}>
                <SquarePen /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setDeletingId(row.original.id);
                  setOpenDelete(true);
                }}
                className="text-destructive"
              >
                <Trash2 /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  // Inicializa a instância da tabela com dados, colunas e os modelos
  // de execução (filtros, paginação, ordenação, etc.).
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
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

  // Efeito de montagem: carrega os servidores do backend se `initialData`
  // não foi fornecido (caso SSR/SSG). Faz paginação por cursor para
  // evitar sobrecarregar a API em listas grandes.
  React.useEffect(() => {
    if (initialData) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const pageSize = 100;
        let all: ServidorRow[] = [];
        let cursor: string | null = null;
        while (true) {
          const params = new URLSearchParams();
          params.set("pageSize", String(pageSize));
          if (cursor) params.set("cursor", cursor);
          const res = await fetch(`/api/servidores?${params.toString()}`);
          if (!res.ok) break;
          const json = await res.json();
          all = all.concat(json.data ?? []);
          if (json.hasNext && json.nextCursor) {
            cursor = json.nextCursor;
          } else break;
        }
        if (mounted) setData(all);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar lista de servidores.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [initialData]);

  return (
    <>
      <Tabs defaultValue="general" className="w-full flex-col justify-start gap-6">
        <div className="flex items-center justify-between px-4 lg:px-6">

          {/* Select mobile (visivel abaixo de @4xl) */}
          <Label htmlFor="servidor-view-selector" className="sr-only">Visualizacao</Label>
          <Select defaultValue="general">
            <SelectTrigger
              className="flex w-fit @4xl/main:hidden"
              size="sm"
              id="servidor-view-selector"
            >
              <SelectValue placeholder="Selecionar aba" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Geral</SelectItem>
            </SelectContent>
          </Select>

          {/* TabsList desktop (visivel acima de @4xl) */}
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="general">
              <TableProperties /> Geral
            </TabsTrigger>
          </TabsList>

          {/* Botoes do lado direito */}
          <div className="flex items-center gap-2">
            {/* Personalizacao de colunas */}
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
                {table
                  .getAllColumns()
                  .filter(
                    (col) => typeof col.accessorFn !== "undefined" && col.getCanHide()
                  )
                  .map((col) => {
                    const label =
                      columnLabelMap[col.id] ??
                      (typeof col.columnDef.header === "string"
                        ? col.columnDef.header
                        : col.id);
                    return (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        checked={col.getIsVisible()}
                        onCheckedChange={(v) => col.toggleVisibility(!!v)}
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botão de importação CSV em massa */}
            <ImportServidoresDialog onImport={handleImport} />

            <AddServidorDialog onCreate={handleCreate} />
          </div>
        </div>

        {/* Conteudo da aba Geral */}
        <TabsContent
          value="general"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <IconLoader className="animate-spin" />
                        Carregando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Nenhum servidor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Rodape de paginacao */}
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
            </div>

            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="srv-rows-per-page" className="text-sm font-medium">
                  Linhas por página
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(v) => table.setPageSize(Number(v))}
                >
                  <SelectTrigger size="sm" className="w-20" id="srv-rows-per-page">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((s) => (
                      <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
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
                  <span className="sr-only">Primeira página</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Página anterior</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Próxima página</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Última página</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>


      </Tabs>

      {/* Dialog de confirmacao de exclusao */}
      <Dialog
        open={openDelete}
        onOpenChange={(v) => {
          if (!v) setDeletingId(null);
          setOpenDelete(v);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este servidor? Esta ação é irreversível.
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setOpenDelete(false); setDeletingId(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => { await handleDelete(deletingId); }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de edicao de servidor */}
      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => { if (!open) setEditingItem(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Servidor</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            {editingItem && (
              <AddServidorForm
                servidorId={editingItem.id}
                defaultValues={{
                  name:          editingItem.name,
                  cpf:           editingItem.cpf,
                  enrollment:    editingItem.enrollment,
                  bond_type:     editingItem.bond_type,
                  work_schedule: editingItem.work_schedule,
                }}
                onUpdate={handleUpdate}
                onClose={() => setEditingItem(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}