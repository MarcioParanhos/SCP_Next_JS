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

// Componente: AddSchoolUnitForm
// - Responsabilidade: renderizar o formulário de criação de uma unidade escolar,
//   validar os campos com Zod/react-hook-form e enviar para a rota `POST /api/school_units`.
// - Props:
//   - onCreate?: callback que recebe o item criado (útil para atualizar listas no pai)
//   - onClose?: callback chamado após submit bem-sucedido para fechar o modal
// - Dependências da API esperadas:
//   - GET /api/ntes -> retorna array [{ id: string, name: string }]
//   - GET /api/municipalities?nteId=<id> -> retorna array [{ id: string, name: string }]
//   - POST /api/school_units -> recebe payload conforme `payload` abaixo e retorna o item criado

// Schema do formulário com Zod — validação e tipos
const formSchema = z.object({
  // NTE: id da Núcleo de Tecnologia Educacional (string)
  // - Obrigatório: o select no frontend fornece o `id` como string.
  // - Quando alterado, o formulário carrega os municípios que pertencem a esse NTE.
  nte: z.string().min(1, "Required"),
  // Município: id do município (string)
  // - Obrigatório: depende do NTE escolhido. O backend espera o id do município.
  municipality: z.string().min(1, "Required"),
  // Código SEC: código da escola usado pelo sistema SEC
  // - Obrigatório: será enviado ao backend como `sec_code` (ou mapeado conforme o schema do DB).
  // - Validação mínima: campo não vazio.
  sec_code: z.string().min(1, "Required"),
  // Tipologia: tipo da unidade (ex.: SEDE, ANEXO, CEMIT)
  // - Obrigatório: selecionado a partir de um Select com opções estáticas.
  typology: z.string().min(1, "Required"),
  // Categorias: campo livre onde o usuário digita categorias separadas por vírgula
  // - Opcional no formulário. Antes de enviar, transformamos a string em um array de strings.
  categories: z.string().optional(),
  // Nome da unidade: nome exibido da escola/unidade
  // - Obrigatório e com tamanho mínimo de 2 caracteres.
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
          {/*
            NTE (Select)
            - O usuário escolhe um NTE (núcleo); o valor armazenado é o `id` (string).
            - Obrigatório: validação feita pelo schema Zod acima.
            - Efeito colateral: ao selecionar um NTE, limpamos o município atual
              e chamamos `loadMunicipalities(nteId)` para popular o select de municípios.
            - Estado de carregamento: `loadingNtes` controla o placeholder enquanto a lista carrega.
          */}
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

          {/*
            Município (Select)
            - Lista dependente do NTE selecionado.
            - Fica desabilitado até que um NTE seja escolhido (evita seleção inválida).
            - Usa `municipalities` carregado pelo endpoint `/api/municipalities?nteId=`.
            - O valor armazenado é o `id` do município (string), que será enviado ao backend.
          */}
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

        {/* Código SEC e Tipologia lado a lado: grid com duas colunas */}
        <div className="grid grid-cols-2 gap-4">
          {/*
            Código SEC (Input)
            - Campo textual curto que representa o código SEC da unidade.
            - Obrigatório: será enviado como `sec_code` no payload POST.
            - Observação: no banco pode haver mapeamento de nomes (ex.: `sec_cod`),
              mas aqui tratamos como `sec_code` seguindo o formulário.
          */}
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

          {/*
            Tipologia (Select)
            - Select com opções estáticas: `SEDE`, `ANEXO`, `CEMIT`.
            - Obrigatório: o valor escolhido será enviado como `typology` no payload.
            - Dica: podemos mapear valores legíveis para códigos diferentes se o backend exigir.
          */}
          <FormField
            control={form.control}
            name="typology"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipologia</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={(val) => field.onChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma tipologia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEDE">SEDE</SelectItem>
                      <SelectItem value="ANEXO">ANEXO</SelectItem>
                      <SelectItem value="CEMIT">CEMIT</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/*
          Nome da unidade (Input)
          - Campo principal: representa o nome público da escola/unidade.
          - Obrigatório no schema com mínimo de 2 caracteres.
          - Valor enviado no payload como `schoolUnit`.
        */}
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

        {/*
          Categorias (Input)
          - Campo livre onde o usuário informa categorias separadas por vírgula.
          - Opcional no formulário; antes do envio transformamos a string em um array
            usando `.split(',').map(s => s.trim())`.
          - Útil para etiquetar ou agrupar unidades por atributos customizados.
        */}
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
