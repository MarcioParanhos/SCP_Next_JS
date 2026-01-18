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

// Componente wrapper que exibe um Dialog para criar uma nova unidade escolar.
// - Responsabilidade: renderizar o trigger (botão), controlar o estado aberto/fechado
//   do Dialog e injetar o formulário `AddSchoolUnitForm` dentro do content.
// - Props:
//   - onCreate: callback opcional chamado quando a unidade é criada com sucesso
//     (o pai pode usar esse callback para atualizar a lista localmente).
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
