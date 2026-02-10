"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Cog,
  Command,
  Frame,
  Map,
  PieChart,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import { useSession } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

// Dados de exemplo para a sidebar (usados como fallback se não houver sessão)
const data = {
  navMain: [
    {
      title: "CARÊNCIA",
      url: "#",
      icon: UserMinus,
      isActive: true,
      items: [
        { title: "Incluir", url: "#" },
        { title: "Buscar", url: "#" },
      ],
    },
    {
      title: "PROVIMENTO",
      url: "#",
      icon: UserPlus,
      items: [
        { title: "Incluir", url: "#" },
        { title: "Buscar", url: "#" },
        { title: "Reserva", url: "#" },
      ],
    },
    {
      title: "GERENCIAMENTO",
      url: "#",
      icon: Building2,
      items: [
        { title: "Unidades Escolares", url: "/school_units" },
        { title: "Servidores", url: "#" },
      ],
    },
    {
      title: "CONFIGURAÇÕES",
      url: "#",
      icon: Cog,
      items: [{ title: "Listas Suspensas", url: "#" }],
    },
    {
      title: "ADMINISTRAÇÃO",
      url: "#",
      icon: Command,
      items: [{ title: "Usuários", url: "#" }],
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();

  const sessionUser = session?.user
    ? {
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        avatar: (session.user as any).image ?? undefined,
      }
    : undefined;

  const userToShow = sessionUser;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-3 py-4 group-data-[state=collapsed]:hidden">
          <Link href="/">
            <img src="/images/SCP.png" alt="SCP" className="h-32 w-auto mx-auto object-contain" />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userToShow} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
