"use client";

// Componente: AddServidorDialog
// - Wrapper que exibe um modal (Dialog) contendo o formulário `AddServidorForm`.
// - Responsabilidade: controlar abertura/fechamento do modal e repassar
//   callbacks para o formulário.
// - Por que separar Dialog + Form:
//   Separar o wrapper do formulário facilita reusar o formulário em outros
//   contextos (ex: drawer, página dedicada) sem duplicar código.
// - Props:
//   - onCreate?: callback disparado quando um servidor é criado com sucesso.
//     O componente pai normalmente usa isso para inserir o item na tabela local.

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
import { AddServidorForm } from "./AddServidorForm";
import { ServidorRow } from "./schema";

export default function AddServidorDialog({
  onCreate,
}: {
  onCreate?: (item: ServidorRow) => void;
}) {
  // Estado local para controlar visibilidade do Dialog
  const [open, setOpen] = React.useState(false);

  return (
    // `Dialog` shadcn/ui: controlado pelos estados `open` e `onOpenChange`
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger: botão que abre o modal — `asChild` transfere o comportamento de toggle */}
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <IconPlus />
          <span>Adicionar</span>
        </Button>
      </DialogTrigger>

      {/* Conteúdo do Dialog: header com título e o formulário de cadastro */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Servidor</DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          {/*
            Passa dois callbacks para o formulário:
            - onCreate: repassa o servidor criado para o componente pai (tabela)
              e fecha o dialog logo em seguida.
            - onClose: fecha o dialog sem nenhuma ação adicional (ex: botão Cancelar).
          */}
          <AddServidorForm
            onCreate={(item) => {
              onCreate?.(item); // Notifica o pai com o novo servidor
              setOpen(false);   // Fecha o modal
            }}
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
