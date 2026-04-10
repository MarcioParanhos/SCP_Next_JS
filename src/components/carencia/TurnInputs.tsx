"use client";

import React from 'react';
import { Input } from '@/components/ui/input';

type Props = {
  morningCount: number,
  afternoonCount: number,
  nightCount: number,
  setMorningCount: (n: number) => void,
  setAfternoonCount: (n: number) => void,
  setNightCount: (n: number) => void,
  totalCount: number,
}

export default function TurnInputs({ morningCount, afternoonCount, nightCount, setMorningCount, setAfternoonCount, setNightCount, totalCount }: Props) {
  return (
    <div className="mt-4">
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-1">MAT</div>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={String(morningCount)}
            onChange={(e) => setMorningCount(Math.max(0, parseInt(e.target.value || '0') || 0))}
            onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value || '0') || 0); if (v !== morningCount) setMorningCount(v); }}
            className="w-25 text-center py-1"
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-1">VESP</div>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={String(afternoonCount)}
            onChange={(e) => setAfternoonCount(Math.max(0, parseInt(e.target.value || '0') || 0))}
            onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value || '0') || 0); if (v !== afternoonCount) setAfternoonCount(v); }}
            className="w-25 text-center py-1"
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-1">NOT</div>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={String(nightCount)}
            onChange={(e) => setNightCount(Math.max(0, parseInt(e.target.value || '0') || 0))}
            onBlur={(e) => { const v = Math.max(0, parseInt(e.target.value || '0') || 0); if (v !== nightCount) setNightCount(v); }}
            className="w-25 text-center py-1"
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-1">TOTAL</div>
           <Input
             type="number"
             readOnly
             min={0}
             value={totalCount}
             aria-label="Total solicitado"
             className="w-25 text-center py-1"
           />
        </div>
      </div>
    </div>
  )
}
