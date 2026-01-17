"use client";

import { ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // Special handling for /carencia routes: open CARÊNCIA and mark Incluir/Buscar
    if (pathname.startsWith("/carencia")) {
      setOpenGroup("CARÊNCIA");
      return;
    }
    // find first group that contains an item or subitem matching the pathname (by prefix)
    const found = items.find((it) => {
      // check top-level item url
      if (it.url && it.url !== "#" && (pathname === it.url || pathname.startsWith(it.url))) return true;
      // check submenu urls
      if (
        it.items?.some(
          (sub) => sub.url && sub.url !== "#" && (pathname === sub.url || pathname.startsWith(sub.url))
        )
      )
        return true;
      return false;
    });
    if (found) {
      setOpenGroup(found.title);
    } else {
      setOpenGroup(null);
    }
  }, [pathname, items]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuButton
          asChild
          className={
            `cursor-pointer mb-3 min-w-8 duration-200 ease-linear ${
              pathname === "/dashboard"
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90 active:text-primary-foreground"
                : "hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            }`
          }
        >
          <Link href="/dashboard">
            <LayoutDashboard />
            <span>DASHBOARD</span>
          </Link>
        </SidebarMenuButton>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={openGroup === item.title}
            onOpenChange={(v) => setOpenGroup(v ? item.title : null)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className={
                    `cursor-pointer ${openGroup === item.title ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/90' : ''}`
                  }
                  tooltip={item.title}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {/* Botões do Sub-menu */}
                <SidebarMenuSub>
                  {item.items?.map((subItem) => {
                    const isActiveSub = !!subItem.url && (pathname === subItem.url || pathname.startsWith(subItem.url));
                    return (
                      <SidebarMenuSubItem key={subItem.title}>
                        {/* VERIFICAÇÃO: Se o título for "Incluir", renderiza o Dialog */}
                        {subItem.title === "Incluir" ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <SidebarMenuSubButton className="cursor-pointer">
                                <span>{subItem.title}</span>
                              </SidebarMenuSubButton>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="uppercase">
                                  Incluir Carência
                                </DialogTitle>
                                <DialogDescription>
                                  Selecione o tipo de carência a ser lançada!
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex flex-col sm:flex-row w-full gap-4 pt-4">
                                <Button
                                  asChild
                                  className="flex-1 py-4 cursor-pointer"
                                >
                                  <Link href="/carencia/real">REAL</Link>
                                </Button>
                                <Button
                                  asChild
                                  className="flex-1 py-4 cursor-pointer"
                                >
                                  <Link href="/carencia/temporaria">
                                    TEMPORÁRIA
                                  </Link>
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          /* CASO CONTRÁRIO: Mantém o comportamento padrão de link */
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        )}
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
