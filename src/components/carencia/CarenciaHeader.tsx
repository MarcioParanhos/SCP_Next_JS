"use client";

import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import TypeBadge from './TypeBadge';

type Props = {
  carenciaType: 'REAL' | 'TEMPORARY',
  onRequestTypeChange: (next: 'REAL' | 'TEMPORARY') => void,
}

export default function CarenciaHeader({ carenciaType, onRequestTypeChange }: Props) {
  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <CardTitle>Dados da Carência</CardTitle>
          <CardDescription className="mt-1">Coloque os dados da carência.</CardDescription>
        </div>
        <TypeBadge type={carenciaType} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Tipo</Label>
          <Select value={carenciaType} onValueChange={(v) => {
            const next = v as 'REAL' | 'TEMPORARY';
            if (next === carenciaType) return;
            onRequestTypeChange(next);
          }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REAL">Real</SelectItem>
              <SelectItem value="TEMPORARY">Temporária</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
