"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// Estilos: usamos classes utilitárias e estilos do design system para
// apresentar as informações em um layout mais profissional (cards, dl/dt/dd)
import EditSchoolUnitForm from "./EditSchoolUnitForm";
import HomologationForm from "./HomologationForm";
import HomologationHistory from "./HomologationHistory";
import { useRouter } from "next/navigation";

// Componente cliente que exibe a página de detalhe/edição da unidade.
// - Recebe `initialData` (DTO) fornecido pelo componente server-side (`page.tsx`).
// - Renderiza uma coluna lateral com tabs (Informações, Histórico, Homologação, Editar).
// - A aba "Editar" reutiliza `EditSchoolUnitForm` que faz a chamada PUT e
//   retorna o item atualizado através do callback `onSaved` para sincronizar o estado local.
export default function SchoolUnitDetail({ initialData }: { initialData: any }) {
  const [tab, setTab] = React.useState("info");
  const [data, setData] = React.useState(initialData);
  // chave para forçar recarregar o histórico após uma ação
  const [historyKey, setHistoryKey] = React.useState(0);
  const router = useRouter();

  return (
    <div className="flex gap-6 p-6">
      <aside className="w-56 border rounded p-3">
        
        <nav className="flex flex-col gap-2">
          {/* Cada botão troca a aba atual; o estado `tab` controla o conteúdo */}
          <Button variant={tab === "info" ? "default" : "ghost"} onClick={() => setTab("info")}>Informações</Button>
          <Button variant={tab === "history" ? "default" : "ghost"} onClick={() => setTab("history")}>Histórico</Button>
          <Button variant={tab === "homologation" ? "default" : "ghost"} onClick={() => setTab("homologation")}>Homologação</Button>
          <Button variant={tab === "edit" ? "default" : "ghost"} onClick={() => setTab("edit")}>Editar</Button>
          <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
        </nav>
      </aside>
      

      <main className="flex-1 border rounded p-6">
        {tab === "info" && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Informações</h2>

            {/* Grid responsivo com dois cards: dados principais e metadados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-background p-4">
                {/* Grid interno: Nome ocupa toda a linha, códigos ficam lado a lado em telas >= sm */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">Nome</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">{data.schoolUnit}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Código SEC</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{data.sec_code || "—"}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Código UO</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{data.uo_code || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <dl className="grid gap-3">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Tipologia</dt>
                    <dd className="mt-1 text-sm">{data.typology || "—"}</dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                    <dd className="mt-1">
                      <span className={
                        data.status === "1"
                          ? "inline-flex items-center rounded px-2 py-0.5 text-sm font-medium bg-green-100 text-green-800"
                          : "inline-flex items-center rounded px-2 py-0.5 text-sm font-medium bg-red-100 text-red-800"
                      }>
                        {data.status === "1" ? "Ativo" : "Inativo"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        )}

        {tab === "history" && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Histórico</h2>
            <div className="text-sm text-muted-foreground">Sem histórico disponível — placeholder.</div>
          </section>
        )}

        {tab === "homologation" && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Homologação</h2>
            {/* Formulário para registrar homologação / deshomologação */}
            <div className="mb-4">
              <HomologationForm id={data.id} onSaved={() => setHistoryKey((k) => k + 1)} />
            </div>

            {/* Histórico de ações já executadas */}
            <div>
              <HomologationHistory key={historyKey} id={data.id} />
            </div>
          </section>
        )}

        {tab === "edit" && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Editar Unidade</h2>
            {/* O formulário de edição chama o endpoint PUT e, ao salvar,
                dispara `onSaved` com o item atualizado. Aqui sincronizamos
                o estado local `data` recebendo o objeto atualizado. */}
            <EditSchoolUnitForm id={data.id} initialData={data} onSaved={(updated) => setData(updated)} />
          </section>
        )}
      </main>
    </div>
  );
}
