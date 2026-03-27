"use client";

// Componente: AddServidorForm
// - Responsabilidade: renderizar o formulário de criação/edição de um servidor.
// - Quando `servidorId` é fornecido, faz uma requisição PUT (edição).
// - Quando `servidorId` não é fornecido, faz uma requisição POST (criação).
// - Utiliza react-hook-form + Zod para validação dos campos.
// - Props:
//   - defaultValues?: valores iniciais para pré-preencher o formulário (modo edição)
//   - servidorId?:   id do servidor a ser editado (determina o modo da operação)
//   - onCreate?:     callback chamado após criação bem-sucedida
//   - onUpdate?:     callback chamado após edição bem-sucedida
//   - onClose?:      callback para fechar o modal após submit

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServidorRow } from "./schema";

// -----------------------------------------------------------------------
// Opções dos campos de seleção
// -----------------------------------------------------------------------

// Tipos de vínculo disponíveis para seleção no formulário
const VINCULOS = [
  { value: "REDA", label: "REDA" },
  { value: "EFETIVO", label: "EFETIVO" },
  { value: "DESIGNADO", label: "DESIGNADO" },
  { value: "TEMPORÁRIO", label: "TEMPORÁRIO" },
  { value: "CLT", label: "CLT" },
];

// Regimes de trabalho disponíveis para seleção no formulário
const REGIMES = [
  { value: "20H", label: "20H" },
  { value: "40H", label: "40H" },
  { value: "DE", label: "DE (Dedicação Exclusiva)" },
];

// -----------------------------------------------------------------------
// Schema Zod do formulário — define regras de validação de cada campo
// -----------------------------------------------------------------------
const formSchema = z.object({
  name:          z.string().min(3, "O nome precisa ter ao menos 3 caracteres"),
  cpf:           z.string().min(11, "CPF inválido (mínimo 11 dígitos)"),
      enrollment:    z.string().min(1, "Informe a matrícula ou mantenha PENDING"),
  bond_type:     z.string().min(1, "Selecione o tipo de vínculo"),
  work_schedule: z.string().min(1, "Selecione o regime de trabalho"),
});

// Tipo inferido do schema (usado para tipar o react-hook-form)
type FormValues = z.infer<typeof formSchema>;

// -----------------------------------------------------------------------
// Componente principal
// -----------------------------------------------------------------------
export function AddServidorForm({
  defaultValues,
  servidorId,
  onCreate,
  onUpdate,
  onClose,
}: {
  defaultValues?: Partial<FormValues>;
  servidorId?: number;
  onCreate?: (item: ServidorRow) => void;
  onUpdate?: (item: ServidorRow) => void;
  onClose?: () => void;
}) {
  // Estado de loading: impede cliques múltiplos durante o envio
  const [submitting, setSubmitting] = React.useState(false);

  // Determina se o formulário está em modo edição (servidorId foi fornecido)
  const isEditing = servidorId !== undefined;

  // Inicializa o react-hook-form com o zodResolver e os valores padrão
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:          defaultValues?.name          ?? "",
      cpf:           defaultValues?.cpf           ?? "",
      // Pré-preenche enrollment com "PENDING" ao criar; usa o valor existente ao editar
      enrollment:    defaultValues?.enrollment    ?? "PENDING",
      bond_type:     defaultValues?.bond_type     ?? "",
      work_schedule: defaultValues?.work_schedule ?? "",
    },
  });

  // -----------------------------------------------------------------------
  // Handler de submit
  // Determina se é criação (POST) ou edição (PUT) pelo `isEditing`.
  // -----------------------------------------------------------------------
  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      let res: Response;

      if (isEditing) {
        // Modo edição: envia PUT para /api/servidores/:id
        res = await fetch(`/api/servidores/${servidorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      } else {
        // Modo criação: envia POST para /api/servidores
        res = await fetch("/api/servidores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      }

      if (!res.ok) {
        // Tenta extrair mensagem de erro detalhada da resposta
        let detail = await res.text();
        try {
          const json = JSON.parse(detail);
          detail = json?.error ?? json?.message ?? detail;
        } catch (_) {}
        toast.error(`Erro: ${detail}`);
        return;
      }

      // Parse da resposta com os dados do servidor criado/atualizado
      const data: ServidorRow = await res.json();

      if (isEditing) {
        toast.success("Servidor atualizado com sucesso!");
        onUpdate?.(data); // Notifica o pai para atualizar a linha na tabela
      } else {
        toast.success("Servidor cadastrado com sucesso!");
        onCreate?.(data); // Notifica o pai para inserir o novo item na tabela
      }

      onClose?.(); // Fecha o modal após operação bem-sucedida
    } catch (err) {
      console.error("Erro ao salvar servidor:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    // `Form` do shadcn/ui é um wrapper que integra react-hook-form com os campos
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Campo: Nome do Servidor */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Servidor</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage /> {/* Mensagem de erro de validação */}
            </FormItem>
          )}
        />

        {/* Campo: CPF */}
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input placeholder="000.000.000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo: Matrícula — pré-preenchido com "PENDING" no modo criação */}
        <FormField
          control={form.control}
          name="enrollment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="PENDING" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Linha com Vínculo e Regime lado a lado */}
        <div className="grid grid-cols-2 gap-4">

          {/* Campo: Vínculo (select) */}
          <FormField
            control={form.control}
            name="bond_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vínculo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Mapeia as opções de vínculo definidas acima */}
                    {VINCULOS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campo: Regime de Trabalho (select) */}
          <FormField
            control={form.control}
            name="work_schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regime</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Mapeia as opções de regime definidas acima */}
                    {REGIMES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Botões de ação: Cancelar e Salvar */}
        <div className="flex justify-end gap-2 pt-2">
          {/* Cancelar: fecha o modal sem salvar */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>

          {/* Salvar: submete o formulário */}
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Salvando..."
              : isEditing
              ? "Atualizar"
              : "Cadastrar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
