"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Biblioteca de notificações (toast)
import { toast } from "sonner";
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

import { SchoolUnitRow } from "./schema";

// Schema do formulário com Zod — validação e tipos
const formSchema = z.object({
  // NTE: campo obrigatório (string)
  nte: z.string().min(1, "Required"),
  // Município: obrigatório
  municipality: z.string().min(1, "Required"),
  // Código SEC: obrigatório
  sec_code: z.string().min(1, "Required"),
  // Tipologia: obrigatório
  typology: z.string().min(1, "Required"),
  // Categorias: texto opcional, separado por vírgulas (iremos transformar em array)
  categories: z.string().optional(),
  // Nome da unidade: obrigatório com tamanho mínimo
  schoolUnit: z.string().min(2, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

// Componente do formulário — recebe callbacks para integração com o pai
export function AddSchoolUnitForm({
  onCreate,
  onClose,
}: {
  onCreate?: (item: SchoolUnitRow) => void;
  onClose?: () => void;
}) {
  // Estado local para controlar loading/submit
  const [submitting, setSubmitting] = React.useState(false);

  // Estado para armazenar NTEs e Municípios carregados da API
  const [ntes, setNtes] = React.useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = React.useState<{ id: string; name: string }[]>([]);
  const [loadingNtes, setLoadingNtes] = React.useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = React.useState(false);

  // Inicializa o react-hook-form com o zodResolver para validação
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nte: "",
      municipality: "",
      sec_code: "",
      typology: "",
      categories: "",
      schoolUnit: "",
    },
  });

  // Carrega a lista de NTEs do servidor
  async function loadNtes() {
    setLoadingNtes(true);
    try {
      const res = await fetch("/api/ntes");
      if (!res.ok) throw new Error("Failed to load NTEs");
      const json = await res.json();
      setNtes(json.data ?? json);
    } catch (e) {
      console.error(e);
      setNtes([]);
    } finally {
      setLoadingNtes(false);
    }
  }

  // Carrega municípios para um NTE específico
  async function loadMunicipalities(nteId: string) {
    if (!nteId) {
      setMunicipalities([]);
      return;
    }
    setLoadingMunicipalities(true);
    try {
      const res = await fetch(`/api/municipalities?nteId=${encodeURIComponent(nteId)}`);
      if (!res.ok) throw new Error("Failed to load municipalities");
      const json = await res.json();
      setMunicipalities(json.data ?? json);
    } catch (e) {
      console.error(e);
      setMunicipalities([]);
    } finally {
      setLoadingMunicipalities(false);
    }
  }

  // Ao montar o componente, carregamos as NTEs
  React.useEffect(() => {
    loadNtes();
  }, []);

  // Handler de submit: converte categorias em array, chama a API e notifica o pai
  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // Prepara payload: categories vira array (se informado)
      const payload = {
        ...values,
        categories: values.categories
          ? values.categories.split(",").map((s) => s.trim())
          : [],
      };

      // Requisição POST para criar a unidade (rota de API do projeto)
      const res = await fetch("/api/school_units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create school unit");

      // resposta esperada: { data: createdItem }
      const json = await res.json();
      const created: SchoolUnitRow = json.data ?? json;

      // Feedback para o usuário e comunicação com o componente pai
      toast.success("Unidade criada");
      onCreate?.(created);
      form.reset(); // limpa o formulário
      onClose?.(); // fecha o dialog, se fornecido
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar unidade");
    } finally {
      setSubmitting(false);
    }
  }

  // JSX do formulário: cada campo usa FormField do design system
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* NTE e Município lado a lado: grid com duas colunas */}
        <div className="grid grid-cols-2 gap-4">
          {/* NTE (Select) - ao selecionar, carregamos os municípios daquele NTE */}
          <FormField
            control={form.control}
            name="nte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NTE</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      // Atualiza o valor no react-hook-form
                      field.onChange(val);
                      // Limpa o município selecionado anterior
                      form.setValue("municipality", "");
                      // Carrega municípios associados ao NTE selecionado
                      loadMunicipalities(val);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingNtes ? "Carregando NTEs..." : "Selecione um NTE"} />
                    </SelectTrigger>
                    <SelectContent>
                      {ntes.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Município (Select) - depende do NTE; fica desabilitado até um NTE ser escolhido */}
          <FormField
            control={form.control}
            name="municipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Município</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val)}
                    disabled={!form.getValues("nte") || loadingMunicipalities}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        loadingMunicipalities ? "Carregando municípios..." : !form.getValues("nte") ? "Escolha um NTE primeiro" : "Selecione um município"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalities.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Código SEC */}
        <FormField
          control={form.control}
          name="sec_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código SEC</FormLabel>
                <FormControl>
                <Input className="w-full" placeholder="Código SEC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipologia */}
        <FormField
          control={form.control}
          name="typology"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipologia</FormLabel>
                <FormControl>
                <Input className="w-full" placeholder="Tipologia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categorias: campo livre que será separado por vírgula */}
        <FormField
          control={form.control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categorias (vírgula separadas)</FormLabel>
                <FormControl>
                <Input className="w-full" placeholder="categoria1, categoria2" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nome da unidade */}
        <FormField
          control={form.control}
          name="schoolUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da unidade</FormLabel>
                <FormControl>
                <Input className="w-full" placeholder="Nome da escola" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botão de submit com estado de envio */}
        <div className="flex gap-2 justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
