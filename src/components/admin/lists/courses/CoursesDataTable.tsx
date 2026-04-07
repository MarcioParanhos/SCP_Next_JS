"use client";

// CRUD de Cursos — versão simplificada que usa `eixo_id` como relação
// Comentários em português para facilitar entendimento e manutenção.

import * as React from "react";
import { Pencil, Plus, Trash2, MoreVertical, Undo2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// Tipagem do curso conforme API: { id, name, eixo_id }
type Curso = {
  id: number;
  name: string;
  eixo_id: number;
};

// Estado inicial do formulário
const formVazio = { name: "", eixoId: "" };

export function CoursesDataTable() {
  // Estados principais
  const [cursos, setCursos] = React.useState<Curso[]>([]);
  const [eixosList, setEixosList] = React.useState<Array<{ id: number; name: string }>>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [editando, setEditando] = React.useState<Curso | null>(null);
  const [form, setForm] = React.useState(formVazio);
  const [salvando, setSalvando] = React.useState(false);
  const [desativandoId, setDesativandoId] = React.useState<number | null>(null);
  const [busca, setBusca] = React.useState("");

  // Carrega eixos e cursos ao montar
  React.useEffect(() => {
    buscarEixos();
    buscarCursos();
  }, []);

  // Busca de eixos para popular o select
  async function buscarEixos() {
    try {
      const res = await fetch("/api/eixos?pageSize=500");
      const json = await res.json();
      setEixosList(json.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar eixos.");
    }
  }

  // Busca de cursos
  async function buscarCursos() {
    setCarregando(true);
    try {
      const res = await fetch("/api/courses?all=true");
      const json = await res.json();
      setCursos(json.data ?? []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar os cursos.");
    } finally {
      setCarregando(false);
    }
  }

  // Funções de UI: abrir/fechar dialogs
  function abrirEdicao(c: Curso) {
    setEditando(c);
    setForm({ name: c.name, eixoId: String(c.eixo_id ?? "") });
    setDialogAberto(true);
  }

  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setDialogAberto(true);
  }

  function fecharDialog() {
    setDialogAberto(false);
    setEditando(null);
    setForm(formVazio);
  }

  // Salva (POST/PUT) incluindo eixo_id
  async function salvar() {
    if (!form.name.trim() || !String(form.eixoId).trim()) {
      toast.error("Preencha o nome do curso e selecione o eixo.");
      return;
    }
    setSalvando(true);
    try {
      const url = editando ? `/api/courses/${editando.id}` : "/api/courses";
      const method = editando ? "PUT" : "POST";
      const payload = {
        name: form.name.trim(),
        eixo_id: Number(form.eixoId),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar o curso.");
        return;
      }
      toast.success(editando ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!");
      fecharDialog();
      buscarCursos();
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Exclui (DELETE) — cliente remove localmente após sucesso
  async function desativar(id: number) {
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erro ao excluir o curso.");
        return;
      }
      toast.success("Curso excluído com sucesso!");
      setCursos((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setDesativandoId(null);
    }
  }

  // Filtra por nome (coerção para string protege contra undefined)
  const cursosFiltrados = cursos.filter((c) => {
    const name = (c.name ?? "").toString();
    const q = (busca ?? "").toString().toLowerCase();
    return name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Barra de ações: busca, voltar e novo curso */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 min-w-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground pointer-events-none">
            <Search className="size-4" />
          </span>
          <Input placeholder="Buscar por nome do curso..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-10 w-full" />
        </div>

        <div className="flex items-center gap-2">
          <Link href="/config/listas">
            <Button variant="default" size="icon" aria-label="Voltar para Listas Suspensas">
              <Undo2 className="size-4" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="icon" className="flex items-center justify-center" aria-label="Abrir opções">
                <MoreVertical />
                <span className="sr-only">Abrir opções</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={abrirCriacao}>
                <Plus className="size-4" /> Novo Curso
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabela de cursos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do curso</TableHead>
              <TableHead>Eixo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : cursosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum curso encontrado.
                </TableCell>
              </TableRow>
            ) : (
              cursosFiltrados.map((c) => (
                <TableRow key={c.id} className={`h-14`}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{eixosList.find((e) => e.id === c.eixo_id)?.name ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => abrirEdicao(c)}>
                          <Pencil className="size-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDesativandoId(c.id)}>
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

      {/* Diálogo de criação/edição: Nome + Eixo */}
      <Dialog open={dialogAberto} onOpenChange={(v) => { if (!v) fecharDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Curso" : "Novo Curso"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nome do curso</Label>
              <Input id="name" placeholder="Ex: Análise e Desenvolvimento de Sistemas" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={120} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="eixo">Eixo</Label>
              <Select onValueChange={(v) => setForm((f) => ({ ...f, eixoId: v }))} value={form.eixoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um eixo" />
                </SelectTrigger>
                <SelectContent>
                  {eixosList.map((ex) => (
                    <SelectItem key={ex.id} value={String(ex.id)}>
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={fecharDialog} disabled={salvando}>Cancelar</Button>
            <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={desativandoId !== null} onOpenChange={(v) => { if (!v) setDesativandoId(null); }} title="Excluir curso" description="Deseja realmente excluir este curso? Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => desativandoId !== null && desativar(desativandoId)} />
    </div>
  );
}
