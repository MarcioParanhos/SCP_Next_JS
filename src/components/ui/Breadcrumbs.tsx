"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb"

// Mapa de segmentos para rótulos em Português
// Rótulos dos segmentos do breadcrumb. Alteramos o rótulo vazio
// para "Dashboard" para ficar consistente com o link alvo (/dashboard).
const LABELS: Record<string, string> = {
  "": "Dashboard",
  dashboard: "Dashboard",
  school_units: "Unidades Escolares",
  carencia: "Carência",
  incluir: "Incluir Carência",
  temporaria: "Temporária",
  real: "Real",
  config: "Configurações",
  listas: "Listas Suspensas",
  motivos: "Motivos de Carência",
  areas: "Áreas",
  disciplinas: "Disciplinas",
  cursos: "Cursos",
  // Suporte para rota em inglês `/courses`
  courses: "Cursos",
  login: "Login",
}

export default function Breadcrumbs() {
  const pathname = usePathname() || "/"
  const segments = React.useMemo(() => pathname.split("/").filter(Boolean), [pathname])

  const [namesById, setNamesById] = React.useState<Record<string, string>>({})

  // Fetch names for numeric segments that follow `school_units`
  React.useEffect(() => {
    const ids = segments
      .map((s, idx) => ({ s, idx }))
      .filter(({ s, idx }) => s.match(/^\d+$/) && segments[idx - 1] === "school_units")
      .map(({ s }) => s)
    if (ids.length === 0) return

    let mounted = true
    ids.forEach(async (id) => {
      try {
        const res = await fetch(`/api/school_units/${id}`)
        if (!res.ok) return
        const json = await res.json()
        if (!mounted) return
        setNamesById((prev) => ({ ...prev, [id]: json?.data?.schoolUnit ?? `Detalhe #${id}` }))
      } catch (e) {
        // ignore
      }
    })

    return () => { mounted = false }
  }, [segments])

  const items: Array<{ href: string; label: string }> = []
  // Faz com que o link "Início" aponte sempre para o Dashboard
  // (em vez de "/" que pode levar à root pública). Isso garante
  // comportamento consistente quando o usuário clica no breadcrumb.
  items.push({ href: "/dashboard", label: LABELS[""] })

  let acc = ""
  segments.forEach((seg, idx) => {
    acc += `/${seg}`
    let label = LABELS[seg] || seg.replace(/[-_]/g, " ")
    if (seg.match(/^\d+$/) && segments[idx - 1] === "school_units") {
      label = namesById[seg] ?? `Detalhe #${seg}`
    }
    if (seg === "school_units") label = LABELS["school_units"]
    // Evita duplicar o link para /dashboard quando já adicionamos
    // o item inicial apontando para /dashboard.
    if (acc === "/dashboard" && items[0]?.href === "/dashboard") return
    items.push({ href: acc, label })
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <BreadcrumbItem key={item.href}>
              {!isLast ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
              {!isLast && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
