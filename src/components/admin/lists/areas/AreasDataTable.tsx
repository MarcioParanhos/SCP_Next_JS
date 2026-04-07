"use client";

// Tabela CRUD de Áreas Pedagógicas de Carência
// - Lista todas as áreas (ativas e inativas) buscadas via /api/areas?all=true
// - Permite criar, editar e desativar áreas via dialog
// - Usa shadcn/ui: Table, Dialog, Input, Button, Badge

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  ConfirmDialog,
} from "@/components/ui/confirm-dialog";

// Tipagem de uma área retornada pela API
type Area = {
  id: number;
  code: string;
  name: string;
  active: boolean;
};

// Estado inicial do formulário de área (vazio para criação)
const formVazio = { code: "", name: "" };

export function AreasDataTable() {
  // Lista de áreas carregadas da API
  const [areas, setAreas] = React.useState<Area[]>([]);
  // Estado de carregamento da listagem
  const [carregando, setCarregando] = React.useState(true);
  // Controla abertura do dialog de criação/edição
  const [dialogAberto, setDialogAberto] = React.useState(false);
  // Área em edição; null = modo criação
  const [editando, setEditando] = React.useState<Area | null>(null);
  // Valores do formulário de área (código e nome)
  const [form, setForm] = React.useState(formVazio);
  // Estado de submissão do formulário (evita duplo clique)
  const [salvando, setSalvando] = React.useState(false);
  // ID da área a ser desativada no dialog de confirmação
  const [desativandoId, setDesativandoId] = React.useState<number | null>(null);
  // Filtro de busca por texto
  const [busca, setBusca] = React.useState("");

  // Carrega as áreas ao montar o componente
  React.useEffect(() => {
    buscarAreas();
  }, []);

  // Busca todas as áreas na API (incluindo inativas para gestão completa)
  async function buscarAreas() {
    setCarregando(true);
    try {
      const res = await fetch("/api/areas?all=true");
      const json = await res.json();
      setAreas(json.data ?? []);
    } catch {
      toast.error("Erro ao carregar as áreas.");
    } finally {
      setCarregando(false);
    }
  }

  // Abre o dialog em modo edição populando o formulário com os dados da área
  function abrirEdicao(area: Area) {
    setEditando(area);
    setForm({ code: area.code, name: area.name });
    setDialogAberto(true);
  }

  // Abre o dialog em modo criação com formulário vazio
  function abrirCriacao() {
    setEditando(null);
    setForm(formVazio);
    setDialogAberto(true);
  }

  // Fecha o dialog e limpa o estado do formulário
  function fecharDialog() {
    setDialogAberto(false);
    setEditando(null);
    setForm(formVazio);
  }

  // Salva o formulário: cria (POST) ou atualiza (PUT) conforme o modo
  async function salvar() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Preencha o código e o nome da área.");
      return;
    }
    setSalvando(true);
    try {
      const url = editando ? `/api/areas/${editando.id}` : "/api/areas";
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.code.trim(), name: form.name.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar a área.");
        return;
      }

      toast.success(editando ? "Área atualizada com sucesso!" : "Área criada com sucesso!");
      fecharDialog();
      // Recarrega a lista para refletir a alteração
      buscarAreas();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Desativa (exclusão lógica) a área de ID informado
  async function desativar(id: number) {
    try {
      const res = await fetch(`/api/areas/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao desativar a área.");
        return;
      }

      toast.success("Área desativada com sucesso!");
      // Atualiza o estado local para evitar refetch desnecessário
      setAreas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: false } : a))
      );
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setDesativandoId(null);
    }
  }

  // Filtra as áreas pelo texto digitado no campo de busca (código ou nome)
  const areasFiltradas = areas.filter(
    (a) =>
      a.code.toLowerCase().includes(busca.toLowerCase()) ||
      a.name.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Barra de ações: busca e botão de nova área */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por código ou nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={abrirCriacao} size="sm">
          <Plus className="mr-2 size-4" />
          Nova Área
        </Button>
      </div>

      {/* Tabela de áreas */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando ? (
              // Linha de carregamento
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : areasFiltradas.length === 0 ? (
              // Mensagem quando não há resultados
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma área encontrada.
                </TableCell>
              </TableRow>
            ) : (
              areasFiltradas.map((area) => (
                <TableRow key={area.id} className={!area.active ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-sm font-semibold">{area.code}</TableCell>
                  <TableCell>{area.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={area.active ? "default" : "secondary"}>
                      {area.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {/* Botão editar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEdicao(area)}
                      title="Editar área"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {/* Botão desativar — só exibido para áreas ativas */}
                    {area.active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDesativandoId(area.id)}
                        title="Desativar área"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de criação / edição de área */}
      <Dialog open={dialogAberto} onOpenChange={(v) => { if (!v) fecharDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Área" : "Nova Área"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Campo: Código da área */}
            <div className="space-y-1">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                placeholder="Ex: MAT"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                maxLength={20}
              />
            </div>

            {/* Campo: Nome da área */}
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Ex: Matemática"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={120}
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

      {/* Dialog de confirmação de desativação */}
      <ConfirmDialog
        open={desativandoId !== null}
        onOpenChange={(v) => { if (!v) setDesativandoId(null); }}
        title="Desativar Área"
        description="Esta área será marcada como inativa e não aparecerá mais nos formulários. Deseja continuar?"
        confirmLabel="Desativar"
        onConfirm={() => desativandoId !== null && desativar(desativandoId)}
      />
    </div>
  );
}
