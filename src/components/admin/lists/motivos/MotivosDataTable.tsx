"use client";

// Tabela CRUD de Motivos de Carência
// - Lista motivos buscados via /api/motives?all=true
// - Exibe tipo (REAL / TEMPORÁRIA) com badge colorido
// - Permite criar, editar e desativar motivos via dialog
// - Inclui filtro por tipo e busca por texto

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

// Tipagem de um motivo retornado pela API
type Motivo = {
  id: number;
  code: string;
  description: string;
  type: "REAL" | "TEMPORARY";
  active: boolean;
};

// Estado inicial do formulário de motivo
const formVazio = { code: "", description: "", type: "" as "REAL" | "TEMPORARY" | "" };

export function MotivosDataTable() {
  // Lista de motivos carregados da API
  const [motivos, setMotivos] = React.useState<Motivo[]>([]);
  // Estado de carregamento da listagem
  const [carregando, setCarregando] = React.useState(true);
  // Controla abertura do dialog de criação/edição
  const [dialogAberto, setDialogAberto] = React.useState(false);
  // Motivo em edição; null = modo criação
  const [editando, setEditando] = React.useState<Motivo | null>(null);
  // Valores do formulário
  const [form, setForm] = React.useState(formVazio);
  // Estado de submissão (evita duplo clique)
  const [salvando, setSalvando] = React.useState(false);
  // ID do motivo a confirmar desativação
  const [desativandoId, setDesativandoId] = React.useState<number | null>(null);
  // Filtro de texto para busca
  const [busca, setBusca] = React.useState("");
  // Filtro por tipo de carência
  const [filtroTipo, setFiltroTipo] = React.useState<"" | "REAL" | "TEMPORARY">("");

  // Carrega os motivos ao montar o componente
  React.useEffect(() => {
    buscarMotivos();
  }, []);

  // Busca todos os motivos da API (ativos e inativos para gestão completa)
  async function buscarMotivos() {
    setCarregando(true);
    try {
      const res = await fetch("/api/motives?all=true");
      const json = await res.json();
      setMotivos(json.data ?? []);
    } catch {
      toast.error("Erro ao carregar os motivos.");
    } finally {
      setCarregando(false);
    }
  }

  // Abre o dialog em modo edição populando o formulário
  function abrirEdicao(m: Motivo) {
    setEditando(m);
    setForm({ code: m.code, description: m.description, type: m.type });
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
    if (!form.code.trim() || !form.description.trim() || !form.type) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSalvando(true);
    try {
      const url = editando ? `/api/motives/${editando.id}` : "/api/motives";
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          description: form.description.trim(),
          type: form.type,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao salvar o motivo.");
        return;
      }

      toast.success(editando ? "Motivo atualizado!" : "Motivo criado!");
      fecharDialog();
      buscarMotivos();
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  // Desativa (exclusão lógica) o motivo de ID informado
  async function desativar(id: number) {
    try {
      const res = await fetch(`/api/motives/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao desativar o motivo.");
        return;
      }

      toast.success("Motivo desativado com sucesso!");
      // Atualiza o estado local para evitar refetch
      setMotivos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: false } : m))
      );
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setDesativandoId(null);
    }
  }

  // Aplica filtro combinado de texto e tipo
  const motivosFiltrados = motivos.filter((m) => {
    const matchTexto =
      m.code.toLowerCase().includes(busca.toLowerCase()) ||
      m.description.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === "" || m.type === filtroTipo;
    return matchTexto && matchTipo;
  });

  // Retorna o rótulo legível para o tipo de carência
  function labelTipo(type: string) {
    return type === "REAL" ? "Real" : "Temporária";
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações: busca, filtro de tipo e botão de novo motivo */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar por código ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-72"
          />
          {/* Filtro por tipo de carência */}
          <Select
            value={filtroTipo || "todos"}
            onValueChange={(v) => setFiltroTipo(v === "todos" ? "" : (v as "REAL" | "TEMPORARY"))}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="REAL">Real</SelectItem>
              <SelectItem value="TEMPORARY">Temporária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={abrirCriacao} size="sm">
          <Plus className="mr-2 size-4" />
          Novo Motivo
        </Button>
      </div>

      {/* Tabela de motivos */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-32 text-center">Tipo</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : motivosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum motivo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              motivosFiltrados.map((m) => (
                <TableRow key={m.id} className={!m.active ? "opacity-50" : ""}>
                  <TableCell className="font-mono text-sm font-semibold">{m.code}</TableCell>
                  <TableCell>{m.description}</TableCell>
                  <TableCell className="text-center">
                    {/* Badge colorido para distinguir visualmente os tipos de carência */}
                    <Badge
                      variant={m.type === "REAL" ? "default" : "secondary"}
                      className={m.type === "REAL" ? "bg-blue-600 hover:bg-blue-600" : ""}
                    >
                      {labelTipo(m.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={m.active ? "default" : "secondary"}>
                      {m.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {/* Botão editar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirEdicao(m)}
                      title="Editar motivo"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {/* Botão desativar — só para motivos ativos */}
                    {m.active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDesativandoId(m.id)}
                        title="Desativar motivo"
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

      {/* Dialog de criação / edição de motivo */}
      <Dialog open={dialogAberto} onOpenChange={(v) => { if (!v) fecharDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Motivo" : "Novo Motivo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Campo: Código do motivo */}
            <div className="space-y-1">
              <Label htmlFor="mcode">Código</Label>
              <Input
                id="mcode"
                placeholder="Ex: CAR01"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                maxLength={20}
              />
            </div>

            {/* Campo: Tipo de carência */}
            <div className="space-y-1">
              <Label htmlFor="mtype">Tipo</Label>
              <Select
                value={form.type || ""}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as "REAL" | "TEMPORARY" }))}
              >
                <SelectTrigger id="mtype">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REAL">Real</SelectItem>
                  <SelectItem value="TEMPORARY">Temporária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo: Descrição do motivo */}
            <div className="space-y-1">
              <Label htmlFor="mdesc">Descrição</Label>
              <Input
                id="mdesc"
                placeholder="Ex: Inexistência de professor habilitado"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={200}
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
        title="Desativar Motivo"
        description="Este motivo será marcado como inativo e não aparecerá mais nos formulários. Deseja continuar?"
        confirmLabel="Desativar"
        onConfirm={() => desativandoId !== null && desativar(desativandoId)}
      />
    </div>
  );
}
