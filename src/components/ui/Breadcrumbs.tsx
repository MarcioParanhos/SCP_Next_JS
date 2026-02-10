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
const LABELS: Record<string, string> = {
  "": "Início",
  dashboard: "Dashboard",
  school_units: "Unidades Escolares",
  carencia: "Carência",
  temporaria: "Temporária",
  real: "Real",
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
  items.push({ href: "/", label: LABELS[""] })

  let acc = ""
  segments.forEach((seg, idx) => {
    acc += `/${seg}`
    let label = LABELS[seg] || seg.replace(/[-_]/g, " ")
    if (seg.match(/^\d+$/) && segments[idx - 1] === "school_units") {
      label = namesById[seg] ?? `Detalhe #${seg}`
    }
    if (seg === "school_units") label = LABELS["school_units"]
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
