"use client";

import { ChevronRight, LayoutDashboard, type LucideIcon } from "lucide-react";

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
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Testando</SidebarGroupLabel> */}
      <SidebarMenu>
        <SidebarMenuButton
          tooltip="Quick Create"
          className="bg-primary cursor-pointer mb-3 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
        >
          <LayoutDashboard />
          <span>DASHBOARD</span>
        </SidebarMenuButton>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className="cursor-pointer"
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
                  {item.items?.map((subItem) => (
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
                              <Button className="flex-1 py-4 cursor-pointer">
                                REAL
                              </Button>
                              <Button className="flex-1 py-4 cursor-pointer">
                                TEMPORÁRIA
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        /* CASO CONTRÁRIO: Mantém o comportamento padrão de link */
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      )}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
