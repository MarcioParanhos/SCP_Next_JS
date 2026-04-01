"use client";

import React from "react";

// Regras do tipo Server — usamos `any` para flexibilidade; o pai pode tipar melhor.
type Server = any;

interface Props {
  serverQuery: string;
  setServerQuery: (v: string) => void;
  loading: boolean;
  servers: Server[];
  resultsOpen: boolean;
  setResultsOpen: (b: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelectServer: (s: Server) => void;
}

// Componente controlado para busca de servidores: campo + dropdown de resultados.
// O componente não faz fetch; mantenha a lógica de busca (debounce/fetch) no pai.
export default function ServerSearch({
  serverQuery,
  setServerQuery,
  loading,
  servers,
  resultsOpen,
  setResultsOpen,
  highlightedIndex,
  setHighlightedIndex,
  inputRef,
  onSelectServer,
}: Props) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Servidor <span className="text-rose-500">*</span></label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 15a6 6 0 100-12 6 6 0 000 12z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 17l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          ref={inputRef}
          aria-label="Buscar servidor"
          placeholder={loading ? "Carregando..." : "Buscar servidor por nome, CPF ou matrícula"}
          value={serverQuery}
          onChange={(e) => { setServerQuery(e.target.value); setResultsOpen(true); }}
          onFocus={() => { if (serverQuery.trim() !== "") setResultsOpen(true); }}
          onKeyDown={(e) => {
            if (!resultsOpen) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.min(i + 1, servers.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const s = servers[highlightedIndex];
              if (s) onSelectServer(s);
            } else if (e.key === "Escape") {
              setResultsOpen(false);
            }
          }}
          className="w-full md:w-1/2 max-w-xl rounded-md border pl-8 pr-2 py-3 text-sm"
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
          {!loading && servers.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground">Nenhum servidor encontrado</div>
          )}
          {!loading && servers.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setHighlightedIndex(idx)}
              onClick={() => onSelectServer(s)}
              className={`w-full text-left px-3 py-2 ${highlightedIndex === idx ? 'bg-muted-foreground/5 text-foreground' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.enrollment ?? "-"}</div>
              </div>
              <div className="text-xs text-muted-foreground">{s.bond_type ?? '-'} • {s.work_schedule ?? '-'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
