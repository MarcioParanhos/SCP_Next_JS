"use client";

import React from 'react';

type Row = { id: number | string; discipline?: string | any; area?: string | null; reason?: string | null; morning?: number; afternoon?: number; night?: number };

type Props = {
  rows: Row[];
  addRow: () => void;
  removeRow: (id: number | string) => void;
  updateRow: (id: number | string, patch: any) => void;
}

export default function RowsTable({ rows, addRow, removeRow, updateRow }: Props) {
  return (
    <div className="mt-4">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={String(r.id)} className="flex items-center justify-between rounded-md border p-2">
            <div className="flex-1 text-sm">{typeof r.discipline === 'string' ? r.discipline : (r.discipline?.name ?? '—')}</div>
            <div className="flex items-center gap-4">
              <div className="text-sm">M: {r.morning ?? 0}</div>
              <div className="text-sm">V: {r.afternoon ?? 0}</div>
              <div className="text-sm">N: {r.night ?? 0}</div>
              <button type="button" onClick={() => removeRow(r.id)} className="text-rose-600">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
