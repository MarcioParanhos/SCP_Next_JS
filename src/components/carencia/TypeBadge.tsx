"use client";

import React from 'react';
import { AlarmClockCheck, UserCheck } from 'lucide-react';

type Props = {
  type: 'REAL' | 'TEMPORARY'
}

export default function TypeBadge({ type }: Props) {
  return (
    <div className={`ml-2 inline-flex items-center rounded-sm px-4 py-2 text-base font-semibold uppercase ${type === 'REAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
      {type === 'REAL' ? <UserCheck className="h-5 w-5 mr-3" /> : <AlarmClockCheck className="h-5 w-5 mr-3" />}
      {type === 'REAL' ? 'REAL' : 'TEMPORÁRIA'}
    </div>
  )
}
