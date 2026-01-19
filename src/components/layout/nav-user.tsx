"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useState } from "react"

// Componente que exibe o bloco de usuário na sidebar.
// - Recebe um objeto `user` (opcional). Se não houver usuário autenticado,
//   exibimos informações de fallback.
// - Trata defensivamente campos ausentes (ex.: `avatar`) para evitar erros
//   em tempo de execução quando `user` for undefined.
export function NavUser({ user }: { user?: { name?: string; email?: string; avatar?: string } }) {
  const { isMobile } = useSidebar()

  // Valores para exibição com fallback quando o `user` estiver ausente.
  const displayName = user?.name ?? "Usuário";
  const displayEmail = user?.email ?? "";
  const avatarSrc = user?.avatar ?? undefined;

  // Gerar iniciais para o fallback do avatar (ex.: "MP" a partir do nome).
  const initials = (displayName || displayEmail)
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Estado para controlar abertura do diálogo de logout
  const [openLogout, setOpenLogout] = useState(false);

  return (
    <>
      <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {avatarSrc ? (
                  // Mostrar imagem quando houver URL válida
                  <AvatarImage src={avatarSrc} alt={displayName} />
                ) : (
                  // Caso contrário mostrar iniciais geradas a partir do nome/email
                  <AvatarFallback className="rounded-lg">{initials || "U"}</AvatarFallback>
                )}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarSrc ? (
                    <AvatarImage src={avatarSrc} alt={displayName} />
                  ) : (
                    <AvatarFallback className="rounded-lg">{initials || "U"}</AvatarFallback>
                  )}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* Item de logout: abre diálogo de confirmação antes de chamar signOut() */}
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpenLogout(true); }}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      </SidebarMenu>
      {/* Diálogo de confirmação de logout */}
      <Dialog open={openLogout} onOpenChange={(v) => setOpenLogout(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar saída</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          Tem certeza que deseja sair da sua sessão? Você será desconectado.
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpenLogout(false)}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              // Fecha o diálogo e solicita signOut ao next-auth
              setOpenLogout(false);
              await signOut({ callbackUrl: "/login" });
            }}
          >
            Sair
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}
