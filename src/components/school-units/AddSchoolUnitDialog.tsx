"use client";

import * as React from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddSchoolUnitForm } from "./AddSchoolUnitForm";
import { SchoolUnitRow } from "./schema";

// Componente: AddSchoolUnitDialog
// - Responsabilidade:
//   Este componente é um wrapper que exibe um modal (Dialog) contendo o
//   formulário `AddSchoolUnitForm`. Mantém apenas a responsabilidade de
//   controlar abertura/fechamento do modal e repassar callbacks para o form.
// - Por que separar em Dialog + Form:
//   Separar o wrapper do formulário facilita reuso do formulário em outros
//   contextos (por exemplo: drawer, página dedicada) e deixa o modal focado
//   apenas em comportamentos de exibição.
// - Props:
//   - onCreate?: (item) => void
//       Callback opcional que será chamado quando o formulário criar a
//       unidade com sucesso. Normalmente o componente pai usa esse callback
//       para inserir o novo item na tabela local (optimistic UI).
// - Acessibilidade / comportamento:
//   - Usamos `DialogTrigger asChild` para que o botão funcione como trigger
//     sem envolver markup extra, mantendo foco e semanticidade.
//   - Quando o formulário chama `onClose`, este wrapper fecha o modal
//     via `setOpen(false)`.
export default function AddSchoolUnitDialog({
  onCreate,
}: {
  onCreate?: (item: SchoolUnitRow) => void;
}) {
  // Estado local que controla se o Dialog está aberto
  const [open, setOpen] = React.useState(false);

  return (
    // `Dialog` controla o modal; `open/onOpenChange` permite fechar/abrir programaticamente
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger: usamos `asChild` para que o botão herde o comportamento de abrir o Dialog */}
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <IconPlus />
          <span className="hidden lg:inline">Adicionar Unidade</span>
        </Button>
      </DialogTrigger>

      {/* Conteúdo do Dialog: header e o formulário de criação */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Unidade Escolar</DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          {/*
            Formulário separado (`AddSchoolUnitForm`) para manter responsabilidade única.
            Passamos dois callbacks:
            - onCreate: repassa o item criado para o componente pai e fecha o dialog
            - onClose: apenas fecha o dialog (p.ex. usado pelo form após submit)
          */}
          <AddSchoolUnitForm
            onCreate={(item) => {
              // Repassa para o pai e fecha o modal
              onCreate?.(item);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
