"use client";

/*
  Painel principal de gerenciamento de Listas Suspensas.
  - Exibe um Accordion com categorias e links para as telas de CRUD.
  - Comentários em português para facilitar manutenção futura.

  Estética aplicada (objetivo: aparência profissional):
  - Card com fundo `bg-card`, canto arredondado e sombra sutil (hover eleva).
  - Cabeçalho com leve gradiente, foco acessível e indicador de seleção.
  - Ícone da categoria com ring discreto e fundo primário suave.
  - Itens da lista com separadores minimalistas, hover suave e indicador à esquerda
    quando ativo.
*/

import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText, Tag, Settings2, ChevronRight } from "lucide-react";

// Estrutura de categorias e seus itens de lista.
// Para adicionar novas categorias no futuro, basta inserir um novo objeto neste array.
const categorias = [
  {
    // Identificador único usado pelo Accordion para controle de abertura
    value: "carencia",
    // Título exibido no cabeçalho da categoria
    titulo: "Carência",
    // Ícone representativo da categoria
    icone: <BookOpen className="size-4 shrink-0" />,
    // Descrição auxiliar exibida abaixo do título no cabeçalho
    descricao: "Listas utilizadas nos formulários de carência",
    // Sub-itens: cada um representa uma lista gerenciável com rota própria
    itens: [
      {
        titulo: "Áreas",
        descricao: "Áreas pedagógicas de carência",
        href: "/config/listas/areas",
        icone: <Tag className="size-4" />,
      },
      {
        titulo: "Disciplinas",
        descricao: "Disciplinas / componentes curriculares",
        href: "/config/listas/disciplinas",
        icone: <FileText className="size-4" />,
      },
      {
        titulo: "Motivos de Carência",
        descricao: "Motivos de carência real e temporária",
        href: "/config/listas/motivos",
        icone: <Settings2 className="size-4" />,
      },
    ],
  },
];

// Componente ListsPanel
// Renderiza o accordion de categorias de listas suspensas
// `ListsPanel` agora aceita props opcionais para reutilização:
// - `categorias`: lista de categorias a renderizar (usa o conjunto padrão se não fornecido)
// - `panelId`: identificador único do painel (útil quando houver vários painéis na mesma página)
// - `defaultValue`: valor do item do accordion que deverá vir aberto por padrão neste painel
export function ListsPanel({
  categorias: categoriasProp,
  panelId,
  defaultValue,
}: {
  categorias?: typeof categorias;
  /** Identificador único do painel para evitar conflitos entre múltiplos accordions */
  panelId?: string;
  /** Valor padrão (AccordionItem.value) que ficará aberto ao renderizar este painel */
  defaultValue?: string;
} = {}) {
  // Obtém a rota atual para destacar o item ativo no menu
  const pathname = usePathname();
  // Usa as categorias passadas via prop ou o conjunto padrão
  const cats = categoriasProp ?? categorias;
  // Estado local controlado para o Accordion deste painel.
  // Usamos string vazia ("") para representar "nenhum item aberto".
  // IMPORTANTE: nunca usar `undefined` como value controlado no Radix UI — isso faz
  // o componente alternar entre modo controlado e não-controlado, causando comportamento
  // imprevisível (todos os accordions abrindo junto).
  const [openValue, setOpenValue] = React.useState<string>(defaultValue ?? "");

  return (
    // Card principal: largura limitada e estética refinada
    <Card className="w-full max-w-lg overflow-hidden border bg-card shadow-sm hover:shadow-lg transition-shadow duration-200 py-0 rounded-xl">
      <CardContent className="p-0">
        {/*
          Accordion em modo "single" (apenas um item aberto por vez) com collapsible=true.
          defaultValue="carencia" abre o item de carência automaticamente ao carregar a página.
        */}
        <Accordion
          type="single"
          collapsible
          className="w-full"
          // Modo controlado: `value` e `onValueChange` garantem isolamento total entre painéis.
          // `value=""` = nenhum item aberto; Radix lida corretamente com string vazia.
          value={openValue}
          onValueChange={setOpenValue}
          // data-panel-id facilita seletores CSS e debugging por painel
          {...(panelId ? { "data-panel-id": panelId } : {})}
        >
          {cats.map((categoria) => (
            <AccordionItem key={categoria.value} value={categoria.value} className="border-0">

              {/* Cabeçalho clicável da categoria — fundo destacado com cor primária */}
              {/*
                Observação: `rounded-none` foi adicionado para remover o border-radius inferior
                do cabeçalho, deixando o canto reto quando o conteúdo estiver visível.
              */}
              <AccordionTrigger className="group hover:no-underline px-5 py-4 rounded-t-xl rounded-b-none bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/6 transition-colors border-b data-[state=open]:border-b data-[state=closed]:border-b-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/10 [&[data-state=open]>svg]:rotate-90">
                <div className="flex items-center gap-3 flex-1">
                  {/* Ícone dentro de um círculo no tom primário */}
                  <div className="flex items-center justify-center size-9 rounded-full bg-primary/15 text-primary shrink-0 ring-1 ring-primary/10">
                    {categoria.icone}
                  </div>
                  <div className="text-left">
                    {/* Título principal do accordion — maior e mais pesado */}
                    <p className="font-bold text-base leading-tight text-foreground tracking-wide uppercase">
                      {categoria.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{categoria.descricao}</p>
                  </div>
                  {/* Seta personalizada à direita — [[data-state=open]_&] aplica rotate quando
                      qualquer ancestral (incluindo o AccordionTrigger) tiver data-state=open */}
                  <ChevronRight className="ml-auto size-4 text-muted-foreground shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-90" />
                </div>
              </AccordionTrigger>

              {/* Conteúdo expansível: lista de sub-itens da categoria */}
              <AccordionContent className="pb-0">
                {/* Área de conteúdo: fundo do card com padding interno */}
                <div className="bg-card">
                  <ul className="divide-y divide-border">
                  {categoria.itens.map((item) => {
                    // Determina se o item corresponde à rota atual para aplicar estilo ativo
                    const ativo = pathname === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            // Estilo base do link: ocupa toda a linha com padding generoso
                            "flex items-center gap-4 px-5 py-3.5 text-sm transition-colors relative",
                            // Estado ativo: indicador à esquerda e destaque sutil
                            ativo
                              ? "bg-primary/8 border-l-4 border-primary text-primary font-medium"
                              : "border-l-4 border-transparent text-foreground/80 hover:bg-muted/50"
                          )}
                        >
                          {/* Ícone do sub-item */}
                          <span className={cn(
                            "flex items-center justify-center size-7 rounded-md shrink-0",
                            ativo ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {item.icone}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium leading-none">{item.titulo}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                  </ul>
                </div>
              </AccordionContent>

            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
