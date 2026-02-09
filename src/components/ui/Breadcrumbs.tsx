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

	const segments = pathname.split("/").filter(Boolean)

	const items: Array<{ href: string; label: string }> = []

	// Sempre começamos com Início
	items.push({ href: "/", label: LABELS[""] })

	let acc = ""
	segments.forEach((seg, idx) => {
		acc += `/${seg}`

		// Se for um id numérico logo após `school_units`, tornamos "Detalhe #id"
		let label = LABELS[seg] || seg.replace(/[-_]/g, " ")
		if (seg.match(/^\d+$/) && segments[idx - 1] === "school_units") {
			label = `Detalhe #${seg}`
		}

		// Garante que `school_units` apareça com label amigável
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
