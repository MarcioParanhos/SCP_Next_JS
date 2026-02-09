"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./ui/mode-toggle"
import { ThemeSelector } from "./theme-selector"
// Breadcrumbs: componente cliente que mostra a navegação atual
import Breadcrumbs from "@/components/ui/Breadcrumbs"

export function SiteHeader({ showBreadcrumbs = true }: { showBreadcrumbs?: boolean }) {
  return (
    // Header compartilhado em todas as páginas.
    // - Inclui o `SidebarTrigger` (abre/fecha sidebar)
    // - Exibe o `Breadcrumbs` logo após o trigger para contextualizar a página
    // - Mostra o seletor de tema e o modo (dark/light) à direita
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* Breadcrumbs: mostra a trilha de navegação atual */}
        {showBreadcrumbs && <Breadcrumbs />}

        <div className="ml-auto flex items-center gap-2">
          <ThemeSelector />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
