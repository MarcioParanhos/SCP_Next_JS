"use client";

import React from "react";
import { X } from "lucide-react";

interface ComboboxProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}

export default function Combobox({ options, value, onChange, placeholder = "", id }: ComboboxProps) {
  const [query, setQuery] = React.useState<string>(value ?? "");
  const [open, setOpen] = React.useState<boolean>(false);
  const [highlight, setHighlight] = React.useState<number>(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  React.useEffect(() => setHighlight(0), [query]);

  const matches = React.useMemo(() => {
    const q = (query ?? "").toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  function select(v: string) {
    onChange(v);
    setQuery(v);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <div role="combobox" aria-expanded={open} aria-haspopup="listbox" className="w-full">
        <input
          id={id}
          ref={inputRef}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-list` : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim() !== "") setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((i) => Math.min(i + 1, Math.max(0, matches.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter") {
              if (!open) return;
              e.preventDefault();
              const sel = matches[highlight];
              if (sel) select(sel);
            } else if (e.key === "Escape") {
              setOpen(false);
            } else if (e.key === "Tab") {
              if (open) {
                const sel = matches[highlight];
                if (sel) select(sel);
              }
            }
          }}
          className="w-full rounded-md border pl-4 pr-8 py-3 text-sm"
        />

        {query && (
          <button
            type="button"
            aria-label="Limpar"
            onClick={() => { setQuery(""); onChange(""); setOpen(false); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted-foreground/5"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {open && (
        <div id={id ? `${id}-list` : undefined} role="listbox" className="mt-1 absolute z-50 w-full rounded-md border bg-card shadow-sm max-h-48 overflow-auto">
          {matches.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhuma opção encontrada</div>}
          {matches.map((o, idx) => {
            const q = query.toLowerCase();
            const start = o.toLowerCase().indexOf(q);
            const end = start >= 0 ? start + q.length : -1;
            return (
              <div
                key={o}
                role="option"
                aria-selected={highlight === idx}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => select(o)}
                className={`w-full text-left px-3 py-2 cursor-pointer ${highlight === idx ? 'bg-muted-foreground/5 text-foreground' : 'text-muted-foreground'}`}
              >
                <div className="text-sm">
                  {start >= 0 ? (
                    <>
                      {o.substring(0, start)}<span className="font-semibold">{o.substring(start, end)}</span>{o.substring(end)}
                    </>
                  ) : o}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
