"use client";

// Tabela CRUD de Disciplinas / Componentes Curriculares
// - Lista disciplinas buscadas via /api/disciplines
// - Permite criar, editar e excluir disciplinas via dialog
// - A disciplina não tem campo "active" no schema, portanto usa exclusão física

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar a disciplina.");
        return;
      }

      toast.success(editando ? "Disciplina atualizada!" : "Disciplina criada!");
      fecharDialog();
      buscarDisciplinas();
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
        <Input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={abrirCriacao} size="sm">
          <Plus className="mr-2 size-4" />
          Nova Disciplina
        </Button>
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
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {/* Botão editar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEdicao(d)}
                      title="Editar disciplina"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {/* Botão excluir */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExcluindoId(d.id)}
                      title="Excluir disciplina"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
