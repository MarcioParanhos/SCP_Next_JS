"use client";

import React from "react";
import { X, CircleUserRound } from "lucide-react";

// Cartão que mostra detalhes resumidos de um servidor selecionado.
export default function ServerCard({ server, onClear }: { server: any; onClear: () => void }) {
  if (!server) return null;
  return (
    <div className="mt-3">
      <div className="relative rounded-lg border border-muted-foreground/20 bg-card p-3 shadow-sm w-full">
        <div className="absolute top-2 right-2">
          <button
            type="button"
            aria-label="Limpar seleção de servidor"
            onClick={onClear}
            className="p-2 rounded-md hover:bg-muted-foreground/5"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
              <CircleUserRound className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">{server.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">Matrícula: {server.enrollment ?? "-"}</div>
            <div className="text-sm text-muted-foreground">Vínculo: {server.bond_type ?? "-"} • Regime: {server.work_schedule ?? "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
