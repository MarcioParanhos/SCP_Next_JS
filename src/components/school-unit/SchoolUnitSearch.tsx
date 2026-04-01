"use client";

import React from "react";
import { Label } from "@/components/ui/label";

type Unit = any;

interface Props {
  unitQuery: string;
  setUnitQuery: (v: string) => void;
  loading: boolean;
  units: Unit[];
  resultsOpen: boolean;
  setResultsOpen: (b: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelectUnit: (u: Unit) => void;
}

// Componente controlado que renderiza o campo de busca por unidade e o dropdown
// de resultados. A lógica de busca/fetch permanece no componente pai, permitindo
// reuso com diferentes fontes de dados.
export default function SchoolUnitSearch({
  unitQuery,
  setUnitQuery,
  loading,
  units,
  resultsOpen,
  setResultsOpen,
  highlightedIndex,
  setHighlightedIndex,
  inputRef,
  onSelectUnit,
}: Props) {
  return (
    <div>
      <Label className="mb-2">Unidade Escolar <span className="text-rose-500">*</span></Label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 15a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          ref={inputRef}
          aria-label="Buscar unidade"
          placeholder={loading ? "Carregando..." : "Buscar unidade por nome, código ou município"}
          value={unitQuery}
          onChange={(e) => { setUnitQuery(e.target.value); setResultsOpen(true); }}
          onFocus={() => { if (unitQuery.trim() !== "") setResultsOpen(true); }}
          onKeyDown={(e) => {
            if (!resultsOpen) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, units.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const u = units[highlightedIndex];
              if (u) onSelectUnit(u);
            } else if (e.key === "Escape") {
              setResultsOpen(false);
            }
          }}
          className="w-full rounded-md border pl-8 pr-2 py-1 text-sm"
        />

        {loading && (
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        )}

      </div>

      {resultsOpen && (
        <div className="mt-2 max-h-48 overflow-auto rounded-md border bg-card shadow-sm">
          {loading && <div className="p-2 text-sm text-muted-foreground">Buscando...</div>}
          {!loading && units.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">{unitQuery.trim().length < 3 ? 'Digite 3 ou mais caracteres para buscar' : 'Nenhuma unidade encontrada'}</div>
          )}
          {!loading && units.map((u, idx) => (
            <button
              key={u.id}
              type="button"
              onMouseEnter={() => setHighlightedIndex(idx)}
              onClick={() => onSelectUnit(u)}
              className={`w-full text-left px-3 py-2 ${highlightedIndex === idx ? 'bg-muted-foreground/5 text-foreground' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{u.schoolUnit}</div>
                <div className="text-xs text-muted-foreground">{u.sec_code ?? u.uo_code ?? "-"}</div>
              </div>
              <div className="text-xs text-muted-foreground">{u.municipality ?? '-'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
