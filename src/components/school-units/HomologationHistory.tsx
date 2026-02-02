"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

// Componente que lista o histórico de homologações para uma unidade
// - Faz fetch em GET /api/school_units/:id/homologations
export default function HomologationHistory({ id }: { id: number }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/school_units/${id}/homologations`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setItems(json.data ?? []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <div className="text-sm text-muted-foreground">Carregando histórico...</div>;
  if (items.length === 0) return <div className="text-sm text-muted-foreground">Nenhuma ação registrada.</div>;

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const label = it.action === "HOMOLOGATED" ? "Homologado" : "Homologação Retirada";
        const variant = it.action === "HOMOLOGATED" ? "secondary" : "destructive";
        return (
          <div key={it.id} className="rounded border p-3 bg-background">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <Badge variant={variant}>{label}</Badge>
              </div>
            </div>

            {it.reason && <p className="mt-2 text-sm text-muted-foreground">Motivo: {it.reason}</p>}
            {it.performed_by && <p className="mt-1 text-xs text-muted-foreground">Por: {it.performed_by}</p>}
          </div>
        );
      })}
    </div>
  );
}
