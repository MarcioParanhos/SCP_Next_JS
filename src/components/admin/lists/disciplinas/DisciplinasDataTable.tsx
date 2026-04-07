"use client";

// Tabela CRUD de Disciplinas / Componentes Curriculares
// - Lista disciplinas buscadas via /api/disciplines
// - Permite criar, editar e excluir disciplinas via dialog
// - A disciplina não tem campo "active" no schema, portanto usa exclusão física

import * as React from "react";
import { Pencil, Plus, Trash2, MoreVertical, Undo2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Tipagem de uma disciplina retornada pela API
type Disciplina = {
  id: number;
  name: string;
};

// Estado inicial do formulário de disciplina
const formVazio = { name: "" };

export function DisciplinasDataTable() {
  // Lista de disciplinas carregadas da API
  const [disciplinas, setDisciplinas] = React.useState<Disciplina[]>([]);
  // Estado de carregamento da listagem
  const [carregando, setCarregando] = React.useState(true);
  // Controla abertura do dialog de criação/edição
  const [dialogAberto, setDialogAberto] = React.useState(false);
  // Disciplina em edição; null = modo criação
  const [editando, setEditando] = React.useState<Disciplina | null>(null);
  // Valor do formulário (nome)
  const [form, setForm] = React.useState(formVazio);
  // Estado de submissão (evita duplo clique)
  const [salvando, setSalvando] = React.useState(false);
  // ID da disciplina a confirmar exclusão
  const [excluindoId, setExcluindoId] = React.useState<number | null>(null);
  // Filtro de texto para a busca
  const [busca, setBusca] = React.useState("");

  // Carrega as disciplinas ao montar o componente
  React.useEffect(() => {
    buscarDisciplinas();
  }, []);

  // Busca todas as disciplinas da API
  async function buscarDisciplinas() {
    setCarregando(true);
    try {
      const res = await fetch("/api/disciplines?pageSize=500");
      const json = await res.json();
      setDisciplinas(json.data ?? []);
    } catch {
      toast.error("Erro ao carregar as disciplinas.");
    } finally {
      setCarregando(false);
    }
  }

  // Abre o dialog em modo edição populando o formulário
  function abrirEdicao(d: Disciplina) {
    setEditando(d);
    setForm({ name: d.name });
    setDialogAberto(true);
  }

  // Abre o dialog em modo criação com formulário vazio
  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setDialogAberto(true);
  }

  // Fecha o dialog e limpa o estado
  function fecharDialog() {
    setDialogAberto(false);
    setEditando(null);
    setForm(formVazio);
  }

  // Salva o formulário: cria (POST) ou atualiza (PUT)
  async function salvar() {
    if (!form.name.trim()) {
      toast.error("Preencha o nome da disciplina.");
      return;
    }
    setSalvando(true);
    try {
      const url = editando ? `/api/disciplines/${editando.id}` : "/api/disciplines";
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim() }),
      });

      // Se não estiver OK, tente extrair a mensagem de erro do body.
      if (!res.ok) {
        try {
          const errJson = await res.json();
          toast.error(errJson?.error ?? "Erro ao salvar a disciplina.");
        } catch (e) {
          toast.error("Erro ao salvar a disciplina.");
        }
        return;
      }

      // Sucesso: mostra toast imediatamente
      toast.success(editando ? "Disciplina atualizada!" : "Disciplina criada!");
      fecharDialog();
      // Atualiza a lista, mas capture erros para não sobrescrever o toast de sucesso
      try {
        await buscarDisciplinas();
      } catch (e) {
        console.error("Erro ao atualizar lista de disciplinas após criação:", e);
        toast.error("Disciplina criada, mas houve erro ao atualizar a lista.");
      }
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Exclui fisicamente a disciplina de ID informado
  async function excluir(id: number) {
    try {
      const res = await fetch(`/api/disciplines/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao excluir a disciplina.");
        return;
      }

      toast.success("Disciplina excluída com sucesso!");
      // Remove da lista local para evitar refetch
      setDisciplinas((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setExcluindoId(null);
    }
  }

  // Aplica o filtro de busca por nome
  const disciplinasFiltradas = disciplinas.filter((d) =>
    d.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
            <Search className="size-4" />
          </span>
          <Input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="flex items-center justify-center" aria-label="Abrir opções">
                <MoreVertical />
                <span className="sr-only">Abrir opções</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={abrirCriacao}>
                <Plus className="size-4" /> Nova Disciplina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/config/listas">
            <Button variant="default" size="icon" aria-label="Voltar para Listas Suspensas">
              <Undo2 className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabela de disciplinas */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : disciplinasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                  Nenhuma disciplina encontrada.
                </TableCell>
              </TableRow>
            ) : (
              disciplinasFiltradas.map((d) => (
                <TableRow key={d.id} className="h-14 align-middle">
                  <TableCell>{d.name}</TableCell>
                  <TableCell className="text-right flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="data-[state=open]:bg-muted text-muted-foreground flex items-center justify-center size-8 mr-2"
                        >
                          <MoreVertical />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => abrirEdicao(d)}>
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setExcluindoId(d.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" /> Excluir
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

      {/* Dialog de criação / edição de disciplina */}
      <Dialog open={dialogAberto} onOpenChange={(v) => { if (!v) fecharDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Disciplina" : "Nova Disciplina"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Campo: Nome da disciplina */}
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Língua Portuguesa"
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                maxLength={150}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={fecharDialog} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={excluindoId !== null}
        onOpenChange={(v) => { if (!v) setExcluindoId(null); }}
        title="Excluir Disciplina"
        description="Esta disciplina será excluída permanentemente. Deseja continuar?"
        confirmLabel="Excluir"
        onConfirm={() => excluindoId !== null && excluir(excluindoId)}
      />
    </div>
  );
}
