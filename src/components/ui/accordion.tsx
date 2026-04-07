"use client"

// Componente Accordion baseado no @radix-ui/react-accordion
// Segue o padrão shadcn/ui (estilo new-york) já utilizado no projeto.
// Exporta: Accordion, AccordionItem, AccordionTrigger, AccordionContent

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Componente raiz do Accordion — controla o estado de abertura/fechamento
function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

// Item individual do Accordion — representa uma entrada expansível
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

// Cabeçalho clicável do Accordion — dispara a abertura/fechamento do conteúdo
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
                // Estilo base: flex, largura total, alinhamento, transição e foco acessível
                // Rotaciona o SVG filho quando o Trigger estiver com data-state=open
                "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90",
                className
              )}
        {...props}
      >
        {children}
        {/*
          NOTA: removi o ícone interno padrão do Trigger para evitar duplicação
          quando o consumidor (ex.: ListsPanel) renderiza a sua própria seta.
          Se precisar do ícone padrão em outros lugares, podemos adicionar uma
          prop opcional para renderizá-lo novamente.
        */}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

// Conteúdo expansível do Accordion — exibido quando o item está aberto
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      // Animações de abertura e fechamento via classes do Tailwind (definidas no globals.css)
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
