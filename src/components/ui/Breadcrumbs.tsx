"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Componente cliente que constrói breadcrumbs a partir do pathname do Next.js
// - Usa `usePathname()` para obter a rota atual
// - Mapeia segmentos para rótulos legíveis (dicionário abaixo)
// - Exibe links cumulativos para cada segmento exceto o último, que vira `BreadcrumbPage`
// Observação: para páginas dinâmicas (ex: /school_units/:id) mostramos o id
// como "Detalhe #id"; se quiser buscar o nome da unidade aqui, podemos
// estender para buscar via API e trocar o label pelo nome real.
export default function Breadcrumbs() {
  const pathname = usePathname() ?? "/";

  // Mapeamento de segmentos para rótulos em português
  const labelMap: Record<string, string> = {
    "": "Início",
    dashboard: "Dashboard",
    school_units: "Unidades Escolares",
    carencia: "Carência",
    temporaria: "Temporária",
    real: "Real",
    login: "Login",
    dashboard_root: "Visão Geral",
  };

  // Normaliza e divide o path em segmentos
  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  // Constrói partes cumulativas com suas urls
  const parts = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    return { seg, href };
  });

  // Renderiza: primeiro item "Início" sempre aponta para '/dashboard' se existir, caso contrário '/'
  const homeHref = "/dashboard";

  return (
    <Breadcrumb className="ml-3">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={homeHref}>Início</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {parts.map((p, i) => {
          const isLast = i === parts.length - 1;
          // label amigável: procura no mapa, senão mostra o segmento (decodificado)
          const label = labelMap[p.seg] ?? decodeURIComponent(p.seg);

          // Se o segmento for um número (id), mostramos como "Detalhe #id"
          const isId = /^\d+$/.test(p.seg);
          const display = isId ? `Detalhe #${p.seg}` : label;

          return (
            <React.Fragment key={p.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{display}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={p.href}>{display}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
