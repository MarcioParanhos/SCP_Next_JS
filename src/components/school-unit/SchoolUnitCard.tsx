"use client";

import React from "react";
import { X, School } from "lucide-react";

// Cartão para exibir detalhes de uma unidade escolar selecionada.
// É um componente controlado: recebe a unidade e um handler `onClear`.
export default function SchoolUnitCard({ unit, onClear }: { unit: any; onClear: () => void }) {
  if (!unit) return null;
  return (
    <div className="mt-3">
      <div className="relative rounded-lg border border-muted-foreground/20 bg-card p-3 shadow-sm w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
              <School className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{unit.schoolUnit}</div>
              <div className="text-xs text-muted-foreground">{unit.municipality ?? "-"}</div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <div className="text-sm text-muted-foreground text-right">&nbsp;</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: "Código SEC", value: unit.sec_code ?? unit.sec_cod ?? "-" },
            { label: "Código UO", value: unit.uo_code ?? "-" },
            { label: "Tipologia", value: unit.typology ?? unit.typology?.name ?? "-" },
            { label: "Município", value: unit.municipality ?? unit.municipality?.name ?? "-" },
            { label: "NTE", value: unit.nte ?? (unit.municipality?.nte?.name) ?? "-" },
            { label: "Status", value: unit.status === "1" ? "Ativa" : (unit.status ?? "-") },
          ].map((it) => (
            <div key={it.label} className="rounded-sm px-2 py-1 border border-muted-foreground/10 bg-transparent">
              <div className="text-[10px] text-muted-foreground">{it.label}</div>
              <div className="mt-1 text-xs font-medium text-foreground">{it.value}</div>
            </div>
          ))}
        </div>

        <div className="absolute top-2 right-2">
          <button
            type="button"
            aria-label="Limpar seleção de unidade"
            onClick={onClear}
            className="p-2 rounded-md hover:bg-muted-foreground/5"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
